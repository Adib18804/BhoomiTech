from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.db.session import get_db
from app.models import LandParcel, VerificationCase, VerificationResult, VerificationFinding, SellerClaim, Report, User
from app.schemas.verification import (
    VerificationRequest, VerificationResultResponse,
    VerificationCheckResult as CheckResultSchema,
    VerificationFindingResponse,
    VerificationCaseDetailResponse, SellerClaimDetailResponse,
    VerificationResultSummaryResponse, VerificationFindingDetailResponse
)
from app.services.verification_engine import VerificationEngine
from app.api.deps import get_current_user
from app.core.rate_limit import rate_limit_verification

router = APIRouter()


@router.post("/check", response_model=VerificationResultResponse,
             dependencies=[Depends(rate_limit_verification)])
def run_verification(
    request: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run complete land verification
    Deterministic rule-based checks - NO AI/ML
    """
    
    # Get land parcel
    parcel = db.query(LandParcel).filter(
        LandParcel.parcel_id == request.parcel_id
    ).first()
    
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    # Create verification case
    # The case_id is allocated as count + 1, so two concurrent requests could
    # compute the same id and the second would fail with a unique-constraint
    # error at commit (observed with React StrictMode double-invoking the
    # verification call in dev). A transaction-scoped advisory lock makes the
    # count-and-insert allocation atomic; the lock is released automatically
    # when this request's transaction commits or rolls back.
    db.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"), {"lock_id": 723101})
    case_id = f"BT-VER-{datetime.now().year}-{db.query(VerificationCase).count() + 1:06d}"
    
    # Get dag and khatian info
    dag = parcel.dag
    khatian = dag.khatian
    mouza = khatian.mouza
    upazila = mouza.upazila
    district = upazila.district
    
    verification_case = VerificationCase(
        case_id=case_id,
        user_id=current_user.id,
        parcel_id=parcel.id,
        district_name=district.name_en,
        upazila_name=upazila.name_en,
        mouza_name=mouza.name_en,
        survey_type=khatian.survey_type,
        khatian_no=khatian.khatian_no,
        dag_no=dag.dag_no,
        status="in_progress"
    )
    db.add(verification_case)
    db.flush()
    
    # Save seller claim
    seller_claim = SellerClaim(
        verification_case_id=verification_case.id,
        claimed_owner_name=request.seller_claim.claimed_owner_name,
        claimed_share_decimal=Decimal(str(request.seller_claim.claimed_share_decimal)),
        claimed_sale_area_decimal=Decimal(str(request.seller_claim.claimed_sale_area_decimal)),
        claimed_khatian=request.seller_claim.claimed_khatian,
        claimed_dag=request.seller_claim.claimed_dag,
        claimed_survey_type=request.seller_claim.claimed_survey_type
    )
    db.add(seller_claim)
    
    # Run verification engine
    engine = VerificationEngine(db)
    
    risk_level, risk_score, check_results = engine.run_verification(
        parcel=parcel,
        claimed_owner=request.seller_claim.claimed_owner_name,
        claimed_share=Decimal(str(request.seller_claim.claimed_share_decimal)),
        claimed_sale_area=Decimal(str(request.seller_claim.claimed_sale_area_decimal))
    )
    
    # Save verification result
    total_checks = len(check_results)
    passed_checks = sum(1 for c in check_results if c.status == "passed")
    warnings = sum(1 for c in check_results if c.status in ["warning", "insufficient_data"])
    critical_issues = sum(1 for c in check_results if c.status in ["critical", "attention"])
    
    verification_result = VerificationResult(
        case_id=verification_case.id,
        overall_risk_level=risk_level,
        risk_score=risk_score,
        total_checks=total_checks,
        passed_checks=passed_checks,
        warnings=warnings,
        critical_issues=critical_issues
    )
    db.add(verification_result)
    
    # Save findings
    for check_result in check_results:
        for finding in check_result.findings:
            db_finding = VerificationFinding(
                case_id=verification_case.id,
                check_type=finding.check_type,
                finding_type=finding.finding_type,
                severity=finding.severity,
                title_en=finding.title_en,
                title_bn=finding.title_bn or "",
                description_en=finding.description_en,
                description_bn=finding.description_bn or "",
                explanation_en=finding.explanation_en,
                explanation_bn=finding.explanation_bn or "",
                recommendation_en=finding.recommendation_en,
                recommendation_bn=finding.recommendation_bn or "",
                related_data=finding.related_data
            )
            db.add(db_finding)
    
    # Update case status
    verification_case.status = "completed"
    verification_case.overall_risk_level = risk_level
    verification_case.completed_at = datetime.utcnow()
    
    db.commit()
    
    # Build response
    checks_response = []
    recommendations = []
    
    for check_result in check_results:
        findings_response = [
            VerificationFindingResponse(
                check_type=f.check_type,
                finding_type=f.finding_type,
                severity=f.severity,
                title_en=f.title_en,
                title_bn=f.title_bn,
                description_en=f.description_en,
                description_bn=f.description_bn,
                explanation_en=f.explanation_en,
                explanation_bn=f.explanation_bn,
                recommendation_en=f.recommendation_en,
                recommendation_bn=f.recommendation_bn,
                related_data=f.related_data
            )
            for f in check_result.findings
        ]
        
        checks_response.append(CheckResultSchema(
            check_name=check_result.check_name,
            status=check_result.status,
            findings=findings_response
        ))
        
        # Collect recommendations
        for f in check_result.findings:
            if f.recommendation_en:
                recommendations.append(f.recommendation_en)
    
    return VerificationResultResponse(
        case_id=case_id,
        parcel_id=request.parcel_id,
        overall_risk_level=risk_level,
        risk_score=risk_score,
        checks=checks_response,
        total_checks=total_checks,
        passed_checks=passed_checks,
        warnings=warnings,
        critical_issues=critical_issues,
        recommendations=recommendations,
        generated_at=datetime.utcnow()
    )


@router.get("/cases", dependencies=[Depends(rate_limit_verification)])
def list_my_verification_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List verification cases for the requesting citizen ("My Checks").

    Privacy-scoped: a citizen receives ONLY their own cases; admin and
    super_admin keep their existing platform-wide access. Returns an explicit
    set of safe fields - no internal ids, user ids or credentials.
    """
    query = db.query(VerificationCase)
    if current_user.role not in ["admin", "super_admin"]:
        query = query.filter(VerificationCase.user_id == current_user.id)
    cases = query.order_by(VerificationCase.initiated_at.desc()).all()

    results = []
    for case in cases:
        parcel = db.query(LandParcel).filter(
            LandParcel.id == case.parcel_id).first() if case.parcel_id else None
        has_report = db.query(Report).filter(
            Report.verification_case_id == case.id).count() > 0
        results.append({
            "case_id": case.case_id,
            "status": case.status,
            "overall_risk_level": case.overall_risk_level,
            "district_name": case.district_name,
            "upazila_name": case.upazila_name,
            "mouza_name": case.mouza_name,
            "survey_type": case.survey_type,
            "khatian_no": case.khatian_no,
            "dag_no": case.dag_no,
            "parcel_id": parcel.parcel_id if parcel else None,
            "initiated_at": case.initiated_at,
            "completed_at": case.completed_at,
            "has_report": has_report,
        })
    return results


@router.get("/{case_id}", response_model=VerificationCaseDetailResponse,
            dependencies=[Depends(rate_limit_verification)])
def get_verification(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get verification case by ID.

    Returns an explicit Pydantic schema containing only safe client-facing
    fields. Never returns raw ORM objects: internal ids, user_id, the user
    relationship (credentials), and verification metadata are excluded.
    """

    verification_case = db.query(VerificationCase).filter(
        VerificationCase.case_id == case_id
    ).first()

    if not verification_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification case not found"
        )

    # Owner-or-admin authorization (RBAC: citizen = owner only,
    # admin/super_admin = any case)
    if verification_case.user_id != current_user.id and current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this verification"
        )

    # Explicitly build the whitelisted response (public parcel identifier,
    # not the internal FK; no user/credential fields anywhere in the payload)
    parcel = db.query(LandParcel).filter(
        LandParcel.id == verification_case.parcel_id
    ).first() if verification_case.parcel_id else None
    return VerificationCaseDetailResponse(
        case_id=verification_case.case_id,
        status=verification_case.status,
        overall_risk_level=verification_case.overall_risk_level,
        district_name=verification_case.district_name,
        upazila_name=verification_case.upazila_name,
        mouza_name=verification_case.mouza_name,
        survey_type=verification_case.survey_type,
        khatian_no=verification_case.khatian_no,
        dag_no=verification_case.dag_no,
        parcel_id=parcel.parcel_id if parcel else None,
        initiated_at=verification_case.initiated_at,
        completed_at=verification_case.completed_at,
        seller_claim=SellerClaimDetailResponse.model_validate(verification_case.seller_claim)
        if verification_case.seller_claim else None,
        result=VerificationResultSummaryResponse.model_validate(verification_case.result)
        if verification_case.result else None,
        findings=[
            VerificationFindingDetailResponse.model_validate(f)
            for f in verification_case.findings
        ],
    )
