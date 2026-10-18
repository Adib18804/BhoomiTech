# -*- coding: utf-8 -*-
"""Due-diligence report endpoints (Phase 11A).

RBAC mirrors the verification detail rules exactly:
  - the citizen who owns the case can generate and read their report;
  - admin and super_admin can access any report (existing RBAC rules);
  - everyone else gets 403; unauthenticated gets 401.

Responses never expose credentials or internal fields: the JSON metadata
schema is an explicit Pydantic whitelist, and the PDF/JSON content comes from
the persisted snapshot.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import VerificationCase, Report, User
from app.api.deps import get_current_user
from app.services import report_service

router = APIRouter()


class ReportSummaryResponse(BaseModel):
    report_id: str
    case_id: str
    title: str
    language: str
    format: str
    file_size_bytes: Optional[int]
    created_at: datetime
    overall_risk_level: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(ReportSummaryResponse):
    content: Optional[dict] = None


def _get_case_or_404(db: Session, case_id: str) -> VerificationCase:
    case = db.query(VerificationCase).filter(VerificationCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification case not found")
    return case


def _authorize_report_access(user: User, report: Report, case: VerificationCase) -> None:
    if case.user_id != user.id and user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.post("/case/{case_id}", response_model=ReportDetailResponse,
             status_code=status.HTTP_201_CREATED)
def generate_report(case_id: str, lang: str = "en",
                    current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Generate (and persist) a due-diligence report for a verification case.

    The snapshot is built server-side from the same records the engine used,
    so reports are reproducible and auditable."""
    if lang not in ("en", "bn"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="lang must be 'en' or 'bn'")
    case = _get_case_or_404(db, case_id)
    if case.user_id != current_user.id and current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    report = report_service.generate_report(db, case, language=lang)

    return ReportDetailResponse(
        report_id=report.report_id,
        case_id=case.case_id,
        title=report.title,
        language=report.language,
        format=report.format,
        file_size_bytes=report.file_size_bytes,
        created_at=report.created_at,
        overall_risk_level=case.overall_risk_level,
        content=report.content_json,
    )


@router.get("", response_model=List[ReportSummaryResponse])
def list_my_reports(current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """List due-diligence reports for the requesting user ("Reports").

    Privacy-scoped: a citizen receives ONLY their own reports; admin and
    super_admin keep their existing platform-wide access.
    """
    query = db.query(Report)
    if current_user.role not in ["admin", "super_admin"]:
        query = query.filter(Report.user_id == current_user.id)
    reports = query.order_by(Report.created_at.desc()).all()

    summaries: List[ReportSummaryResponse] = []
    for r in reports:
        case = db.query(VerificationCase).filter(
            VerificationCase.id == r.verification_case_id).first()
        summaries.append(ReportSummaryResponse(
            report_id=r.report_id, case_id=case.case_id if case else "",
            title=r.title, language=r.language, format=r.format,
            file_size_bytes=r.file_size_bytes, created_at=r.created_at,
            overall_risk_level=case.overall_risk_level if case else None,
        ))
    return summaries


@router.get("/case/{case_id}", response_model=List[ReportSummaryResponse])
def list_reports_for_case(case_id: str,
                          current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """List reports generated for a verification case."""
    case = _get_case_or_404(db, case_id)
    if case.user_id != current_user.id and current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    reports = db.query(Report).filter(Report.verification_case_id == case.id).all()
    return [
        ReportSummaryResponse(
            report_id=r.report_id, case_id=case.case_id, title=r.title,
            language=r.language, format=r.format, file_size_bytes=r.file_size_bytes,
            created_at=r.created_at, overall_risk_level=case.overall_risk_level,
        ) for r in reports
    ]


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(report_id: str,
               current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    """Fetch a report's metadata and structured snapshot (JSON)."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    _authorize_report_access(current_user, report, report.verification_case)
    report.accessed_at = datetime.utcnow()
    db.commit()
    return ReportDetailResponse(
        report_id=report.report_id,
        case_id=report.verification_case.case_id,
        title=report.title,
        language=report.language,
        format=report.format,
        file_size_bytes=report.file_size_bytes,
        created_at=report.created_at,
        overall_risk_level=report.verification_case.overall_risk_level,
        content=report.content_json,
    )


@router.get("/{report_id}/pdf")
def get_report_pdf(report_id: str,
                   current_user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Download the persisted PDF (same bytes as at generation time)."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report or not report.content_pdf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    _authorize_report_access(current_user, report, report.verification_case)
    report.accessed_at = datetime.utcnow()
    db.commit()
    return Response(
        content=report.content_pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{report.report_id}.pdf"'},
    )
