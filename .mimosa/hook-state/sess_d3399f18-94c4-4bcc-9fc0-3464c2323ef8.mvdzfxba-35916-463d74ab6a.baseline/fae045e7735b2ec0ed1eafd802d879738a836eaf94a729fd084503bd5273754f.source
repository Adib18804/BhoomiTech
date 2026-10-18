# -*- coding: utf-8 -*-
"""Jurisdiction-aware system admin endpoints (Feature #9 / Phases 14-16).

An admin is authorized for ONE upazila (users.assigned_upazila_id). Every
endpoint resolves the acting scope and enforces it SERVER-SIDE: an admin for
Savar can never read or mutate Dhaka/other-upazila records. super_admin has
global scope. Citizens never reach these endpoints (require_admin).

Synthetic demonstration data only. No AI, no external portal calls.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.db.session import get_db
from app.models import (
    User, Upazila, District, Mouza, KhatianRecord, DagRecord, LandParcel,
    OwnershipRecord, VerificationCase, LegalUpdate, AuditLog,
)
from app.api.deps import require_admin

router = APIRouter()


def _resolve_scope(current_user: User, requested_upazila_id: Optional[int]) -> Optional[int]:
    """Return the upazila id the actor may operate on (None = global/all)."""
    if current_user.role == "super_admin":
        return requested_upazila_id
    if current_user.assigned_upazila_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has no assigned jurisdiction.")
    if requested_upazila_id is not None and requested_upazila_id != current_user.assigned_upazila_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access records within your assigned upazila.")
    return current_user.assigned_upazila_id


def _parcel_in_scope(db: Session, parcel: LandParcel, scope_upazila_id: Optional[int]) -> bool:
    if scope_upazila_id is None:
        return True
    return parcel.dag.khatian.mouza.upazila_id == scope_upazila_id


@router.get("/jurisdiction")
def get_jurisdiction(current_user: User = Depends(require_admin),
                     db: Session = Depends(get_db)):
    """The acting admin's jurisdiction (assigned upazila) and scope type."""
    if current_user.role == "super_admin":
        return {
            "role": current_user.role,
            "is_global": True,
            "assigned_upazila": None,
        }
    upazila = None
    if current_user.assigned_upazila_id:
        up = db.query(Upazila).filter(Upazila.id == current_user.assigned_upazila_id).first()
        if up:
            district = db.query(District).filter(District.id == up.district_id).first()
            upazila = {
                "id": up.id,
                "name_en": up.name_en,
                "name_bn": up.name_bn,
                "district_name": district.name_en if district else None,
            }
    return {
        "role": current_user.role,
        "is_global": False,
        "assigned_upazila": upazila,
    }


@router.get("/upazilas")
def list_scoped_upazilas(current_user: User = Depends(require_admin),
                         db: Session = Depends(get_db)):
    """Upazilas the acting admin may work in (one for admin, all for super)."""
    if current_user.role == "super_admin":
        rows = db.query(Upazila).order_by(Upazila.name_en).all()
    else:
        if current_user.assigned_upazila_id is None:
            return []
        rows = db.query(Upazila).filter(Upazila.id == current_user.assigned_upazila_id).all()
    return [
        {"id": u.id, "name_en": u.name_en, "name_bn": u.name_bn,
         "district_id": u.district_id, "code": u.code}
        for u in rows
    ]


@router.get("/mouzas")
def list_scoped_mouzas(upazila_id: Optional[int] = None,
                       current_user: User = Depends(require_admin),
                       db: Session = Depends(get_db)):
    """Mouzas within the acting jurisdiction (Scope -> Mouza)."""
    scope = _resolve_scope(current_user, upazila_id)
    query = db.query(Mouza)
    if scope is not None:
        query = query.filter(Mouza.upazila_id == scope)
    rows = query.order_by(Mouza.name_en).all()
    return [
        {"id": m.id, "upazila_id": m.upazila_id, "name_en": m.name_en,
         "name_bn": m.name_bn, "jl_no": m.jl_no, "code": m.code}
        for m in rows
    ]


@router.get("/stats")
def admin_stats(upazila_id: Optional[int] = None,
                current_user: User = Depends(require_admin),
                db: Session = Depends(get_db)):
    """Real database statistics for the acting admin's jurisdiction."""
    scope = _resolve_scope(current_user, upazila_id)

    mouza_q = db.query(Mouza)
    khatian_q = db.query(KhatianRecord).join(Mouza, KhatianRecord.mouza_id == Mouza.id)
    dag_q = db.query(DagRecord).join(KhatianRecord, DagRecord.khatian_id == KhatianRecord.id) \
        .join(Mouza, KhatianRecord.mouza_id == Mouza.id)
    parcel_q = db.query(LandParcel).join(DagRecord, LandParcel.dag_id == DagRecord.id) \
        .join(KhatianRecord, DagRecord.khatian_id == KhatianRecord.id) \
        .join(Mouza, KhatianRecord.mouza_id == Mouza.id)

    if scope is not None:
        mouza_q = mouza_q.filter(Mouza.upazila_id == scope)
        khatian_q = khatian_q.filter(Mouza.upazila_id == scope)
        dag_q = dag_q.filter(Mouza.upazila_id == scope)
        parcel_q = parcel_q.filter(Mouza.upazila_id == scope)

    total_mouzas = mouza_q.count()
    total_khatians = khatian_q.count()
    total_dags = dag_q.count()
    total_parcels = parcel_q.count()

    pending_updates_q = db.query(LegalUpdate).filter(LegalUpdate.status == "draft")
    if scope is not None:
        pending_updates_q = pending_updates_q.filter(LegalUpdate.upazila_id == scope)
    pending_updates = pending_updates_q.count()

    # Verification cases scoped by upazila name (case rows store the name).
    case_q = db.query(VerificationCase)
    if scope is not None:
        up = db.query(Upazila).filter(Upazila.id == scope).first()
        if up:
            case_q = case_q.filter(VerificationCase.upazila_name == up.name_en)
    total_cases = case_q.count()

    risk_rows = case_q.with_entities(
        VerificationCase.overall_risk_level, func.count(VerificationCase.id)
    ).group_by(VerificationCase.overall_risk_level).all()
    risk_distribution = {level or "INSUFFICIENT_DATA": n for level, n in risk_rows}

    return {
        "scope": {"upazila_id": scope, "is_global": scope is None},
        "totals": {
            "mouzas": total_mouzas,
            "khatian_records": total_khatians,
            "dag_records": total_dags,
            "parcels": total_parcels,
            "pending_updates": pending_updates,
            "verification_cases": total_cases,
        },
        "risk_distribution": risk_distribution,
    }


@router.get("/parcels")
def list_scoped_parcels(mouza_id: int,
                        current_user: User = Depends(require_admin),
                        db: Session = Depends(get_db)):
    """Parcels within a mouza (Mouza -> Manage Land Records)."""
    mouza = db.query(Mouza).filter(Mouza.id == mouza_id).first()
    if not mouza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mouza not found")
    scope = _resolve_scope(current_user, None)
    if scope is not None and mouza.upazila_id != scope:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This mouza is outside your assigned jurisdiction.")

    rows = (
        db.query(LandParcel)
        .join(DagRecord, LandParcel.dag_id == DagRecord.id)
        .join(KhatianRecord, DagRecord.khatian_id == KhatianRecord.id)
        .filter(KhatianRecord.mouza_id == mouza_id)
        .order_by(LandParcel.id)
        .all()
    )
    return [
        {
            "parcel_id": p.parcel_id,
            "khatian_no": p.dag.khatian.khatian_no,
            "survey_type": p.dag.khatian.survey_type,
            "dag_no": p.dag.dag_no,
            "area_decimal": float(p.area_decimal) if p.area_decimal is not None else None,
            "land_class": p.dag.land_class,
            "chouhaddi": {
                "north": p.chouhaddi_north, "south": p.chouhaddi_south,
                "east": p.chouhaddi_east, "west": p.chouhaddi_west,
            },
        }
        for p in rows
    ]


class ChouhaddiUpdateRequest(BaseModel):
    north: Optional[str] = None
    south: Optional[str] = None
    east: Optional[str] = None
    west: Optional[str] = None


@router.put("/parcels/{parcel_id}/chouhaddi")
def update_parcel_chouhaddi(parcel_id: str, payload: ChouhaddiUpdateRequest,
                            current_user: User = Depends(require_admin),
                            db: Session = Depends(get_db)):
    """Update a parcel's Chouhaddi (four-side boundaries).

    Jurisdiction is enforced server-side: an admin may only edit parcels that
    belong to their assigned upazila.
    """
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcel not found")
    scope = _resolve_scope(current_user, None)
    if not _parcel_in_scope(db, parcel, scope):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This parcel is outside your assigned jurisdiction.")

    parcel.chouhaddi_north = payload.north
    parcel.chouhaddi_south = payload.south
    parcel.chouhaddi_east = payload.east
    parcel.chouhaddi_west = payload.west
    parcel.chouhaddi_source = "synthetic_demo"
    db.add(AuditLog(
        user_id=current_user.id, action_type="chouhaddi_update",
        resource_type="land_parcel", resource_id=parcel.parcel_id,
        action_description=f"Updated Chouhaddi for parcel {parcel.parcel_id}",
        success="success",
    ))
    db.commit()
    return {
        "parcel_id": parcel.parcel_id,
        "chouhaddi": {
            "north": parcel.chouhaddi_north, "south": parcel.chouhaddi_south,
            "east": parcel.chouhaddi_east, "west": parcel.chouhaddi_west,
        },
    }
