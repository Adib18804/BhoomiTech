# -*- coding: utf-8 -*-
"""Dashboard endpoints (Phases 11B/11C).

Citizen dashboard: returns ONLY the requesting citizen's own data - their
verification cases, their risk summary, their land references, their report
count. No other users' information is exposed (no names, no emails, no other
cases).

Admin dashboard: platform-wide counters and recent activity for the admin
role (require_admin). No password hashes, credentials, lockout counters or
other secrets are ever returned; recent case activity carries land and case
identifiers only, not citizen identity.

Deterministic SQL aggregations over the existing models - no AI anywhere.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import time

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.db.session import get_db, engine
from app.core.config import settings
from app.models import (
    VerificationCase, Report, LandParcel, User, SecurityEvent,
)
from app.api.deps import get_current_user, require_admin
from app.core.rate_limit import rate_limit_verification

router = APIRouter()

RISK_LEVELS = ["LOW_CONCERN", "REVIEW_REQUIRED", "HIGH_ATTENTION",
               "CRITICAL_SIGNAL", "INSUFFICIENT_DATA"]


class CaseSummary(BaseModel):
    case_id: str
    status: str
    overall_risk_level: Optional[str] = None
    district_name: str
    upazila_name: str
    mouza_name: str
    survey_type: str
    khatian_no: str
    dag_no: str
    parcel_id: Optional[str] = None
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    has_report: bool = False


class LandReference(BaseModel):
    parcel_id: str
    district_name: str
    upazila_name: str
    mouza_name: str
    survey_type: str
    khatian_no: str
    dag_no: str
    area_decimal: Optional[float] = None
    last_checked_at: datetime


class CitizenDashboardResponse(BaseModel):
    totals: dict
    risk_summary: dict
    latest_case: Optional[CaseSummary] = None
    recent_cases: List[CaseSummary]
    recent_parcels: List[LandReference]


def _case_summary(db: Session, case: VerificationCase) -> CaseSummary:
    parcel = db.query(LandParcel).filter(
        LandParcel.id == case.parcel_id).first() if case.parcel_id else None
    has_report = db.query(Report).filter(
        Report.verification_case_id == case.id).count() > 0
    return CaseSummary(
        case_id=case.case_id,
        status=case.status,
        overall_risk_level=case.overall_risk_level,
        district_name=case.district_name,
        upazila_name=case.upazila_name,
        mouza_name=case.mouza_name,
        survey_type=case.survey_type,
        khatian_no=case.khatian_no,
        dag_no=case.dag_no,
        parcel_id=parcel.parcel_id if parcel else None,
        initiated_at=case.initiated_at,
        completed_at=case.completed_at,
        has_report=has_report,
    )


@router.get("/citizen", response_model=CitizenDashboardResponse,
            dependencies=[Depends(rate_limit_verification)])
def citizen_dashboard(current_user=Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """Aggregated, privacy-scoped stats for the logged-in citizen."""
    cases = db.query(VerificationCase).filter(
        VerificationCase.user_id == current_user.id
    ).order_by(VerificationCase.initiated_at.desc()).all()

    total_reports = db.query(Report).filter(
        Report.user_id == current_user.id).count()

    risk_summary = {level: 0 for level in RISK_LEVELS}
    for c in cases:
        if c.overall_risk_level in risk_summary:
            risk_summary[c.overall_risk_level] += 1

    recent_cases = [_case_summary(db, c) for c in cases[:5]]
    latest_case = _case_summary(db, cases[0]) if cases else None

    # Distinct land parcels this citizen has checked (most recent first)
    parcel_rows = (
        db.query(
            VerificationCase.parcel_id,
            func.max(VerificationCase.initiated_at).label("last_checked"),
        )
        .filter(
            VerificationCase.user_id == current_user.id,
            VerificationCase.parcel_id.isnot(None),
        )
        .group_by(VerificationCase.parcel_id)
        .order_by(func.max(VerificationCase.initiated_at).desc())
        .limit(5)
        .all()
    )
    recent_parcels: List[LandReference] = []
    for pid, last_checked in parcel_rows:
        p = db.query(LandParcel).filter(LandParcel.id == pid).first()
        if not p:
            continue
        recent_parcels.append(LandReference(
            parcel_id=p.parcel_id,
            district_name=p.dag.khatian.mouza.upazila.district.name_en,
            upazila_name=p.dag.khatian.mouza.upazila.name_en,
            mouza_name=p.dag.khatian.mouza.name_en,
            survey_type=p.dag.khatian.survey_type,
            khatian_no=p.dag.khatian.khatian_no,
            dag_no=p.dag.dag_no,
            area_decimal=float(p.area_decimal) if p.area_decimal is not None else None,
            last_checked_at=last_checked,
        ))

    return CitizenDashboardResponse(
        totals={
            "total_cases": len(cases),
            "completed_cases": sum(1 for c in cases if c.status == "completed"),
            "total_reports": total_reports,
        },
        risk_summary=risk_summary,
        latest_case=latest_case,
        recent_cases=recent_cases,
        recent_parcels=recent_parcels,
    )


# ------------------------------------------------------------------ 11C admin
class AdminDashboardResponse(BaseModel):
    totals: dict
    case_status_distribution: dict
    risk_distribution: dict
    recent_cases: List[dict]
    recent_security_events: List[dict]
    system_health: dict


@router.get("/admin", response_model=AdminDashboardResponse)
def admin_dashboard(current_user=Depends(require_admin),
                    db: Session = Depends(get_db)):
    """Platform-wide stats for the admin role.

    Privacy rules: no password hashes, credentials, lockout counters or
    other secrets; recent cases carry land/case identifiers only (no citizen
    identity); security events carry the minimal fields admins need for
    triage. Admins do NOT receive super-admin-only capabilities here."""
    total_citizens = db.query(User).filter(User.role == "citizen").count()
    total_admins = db.query(User).filter(
        User.role.in_(["admin", "super_admin"])).count()
    total_cases = db.query(VerificationCase).count()
    total_reports = db.query(Report).count()
    total_parcels = db.query(LandParcel).count()

    # Case status distribution
    status_rows = (
        db.query(VerificationCase.status, func.count(VerificationCase.id))
        .group_by(VerificationCase.status).all()
    )
    case_status_distribution = {s or "unknown": n for s, n in status_rows}

    # Risk distribution (all five levels always present)
    risk_rows = (
        db.query(VerificationCase.overall_risk_level,
                 func.count(VerificationCase.id))
        .group_by(VerificationCase.overall_risk_level).all()
    )
    risk_distribution = {level: 0 for level in RISK_LEVELS}
    for level, n in risk_rows:
        if level in risk_distribution:
            risk_distribution[level] = n

    # Recent verification activity: case + land identifiers ONLY
    # (deliberately no citizen name/email - drill down via the case API
    #  under existing RBAC if identity is genuinely required)
    recent_case_rows = (
        db.query(VerificationCase)
        .order_by(VerificationCase.initiated_at.desc())
        .limit(8).all()
    )
    recent_cases = [
        {
            "case_id": c.case_id,
            "status": c.status,
            "overall_risk_level": c.overall_risk_level,
            "district_name": c.district_name,
            "upazila_name": c.upazila_name,
            "mouza_name": c.mouza_name,
            "survey_type": c.survey_type,
            "khatian_no": c.khatian_no,
            "dag_no": c.dag_no,
            "initiated_at": c.initiated_at,
        }
        for c in recent_case_rows
    ]

    # Recent security events (minimal triage fields)
    event_rows = (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.created_at.desc())
        .limit(5).all()
    )
    recent_security_events = [
        {
            "event_type": e.event_type,
            "severity": e.severity,
            "description": e.description,
            "ip_address": e.ip_address,
            "created_at": e.created_at,
        }
        for e in event_rows
    ]

    # System health: live DB probe + seeded reference counts
    started = time.perf_counter()
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    latency_ms = int((time.perf_counter() - started) * 1000)

    return AdminDashboardResponse(
        totals={
            "total_citizens": total_citizens,
            "total_admins": total_admins,
            "total_cases": total_cases,
            "total_reports": total_reports,
            "total_parcels": total_parcels,
        },
        case_status_distribution=case_status_distribution,
        risk_distribution=risk_distribution,
        recent_cases=recent_cases,
        recent_security_events=recent_security_events,
        system_health={
            "database": "connected" if db_ok else "unavailable",
            "database_latency_ms": latency_ms,
            "app_version": settings.VERSION,
            "environment": "synthetic-demo",
        },
    )
