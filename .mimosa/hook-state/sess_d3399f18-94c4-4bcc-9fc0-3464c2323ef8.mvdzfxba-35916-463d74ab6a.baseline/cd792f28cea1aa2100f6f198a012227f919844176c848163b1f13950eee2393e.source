# -*- coding: utf-8 -*-
"""Super-admin application administration endpoints (Phase 11D).

IMPORTANT CONTEXT: the super_admin role here is an APPLICATION role for this
hackathon prototype. It administers the BhoomiTech application (users,
roles, audit trail, settings). It does NOT confer any government authority
and no endpoint pretends to be a ministry function.

Security rules enforced:
- every endpoint requires require_super_admin (plain admins get 403);
- no password hashes, lockout counters or credentials are ever returned;
- a super admin cannot deactivate themselves or change their own role
  (prevents self-lockout and last-super-admin accidents);
- every mutation writes an AuditLog entry (deterministic, no AI).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    User, AuditLog, SystemSetting, Division, District, Upazila, Mouza,
    KhatianRecord, DagRecord, LandParcel, PlotGeometry,
    OwnershipRecord, VerificationCase, LegalUpdate,
)
from app.api.deps import require_super_admin
from app.core.rate_limit import rate_limit

router = APIRouter(dependencies=[Depends(rate_limit(times=40, scope="superadmin"))])

ALLOWED_ROLES = ["citizen", "admin", "super_admin"]
RISK_LEVELS = ["LOW_CONCERN", "REVIEW_REQUIRED", "HIGH_ATTENTION",
               "CRITICAL_SIGNAL", "INSUFFICIENT_DATA"]


class AdminUserItem(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    preferred_language: str
    created_at: datetime
    last_login_at: Optional[datetime] = None
    is_locked: bool


class UserListResponse(BaseModel):
    totals: dict
    users: List[AdminUserItem]


class StatusUpdateRequest(BaseModel):
    is_active: bool


class RoleUpdateRequest(BaseModel):
    role: str = Field(pattern="^(citizen|admin|super_admin)$")


def _user_item(u: User) -> AdminUserItem:
    """Explicit whitelist: never expose password_hash or lockout counters."""
    return AdminUserItem(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
        is_verified=u.is_verified,
        preferred_language=u.preferred_language,
        created_at=u.created_at,
        last_login_at=u.last_login_at,
        is_locked=bool(u.locked_until is not None),
    )


def _write_audit(db: Session, acting_user: User, action_type: str,
                 resource_type: str, resource_id: str, description: str) -> None:
    db.add(AuditLog(
        user_id=acting_user.id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        action_description=description,
        success="success",
    ))


@router.get("/users", response_model=UserListResponse)
def list_users(role: Optional[str] = None, q: Optional[str] = None,
               current_user: User = Depends(require_super_admin),
               db: Session = Depends(get_db)):
    """List application users (whitelisted fields only)."""
    query = db.query(User)
    if role in ALLOWED_ROLES:
        query = query.filter(User.role == role)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            (func.lower(User.email).like(like)) |
            (func.lower(User.full_name).like(like)))
    users = query.order_by(User.created_at.desc()).limit(100).all()

    role_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all())
    return UserListResponse(
        totals={
            "all": sum(role_counts.values()),
            **{r: role_counts.get(r, 0) for r in ALLOWED_ROLES},
        },
        users=[_user_item(u) for u in users],
    )


@router.put("/users/{user_id}/status", response_model=AdminUserItem)
def update_user_status(user_id: int, request: StatusUpdateRequest,
                       current_user: User = Depends(require_super_admin),
                       db: Session = Depends(get_db)):
    """Activate/deactivate an application account (account status management)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="You cannot change your own account status")
    user.is_active = request.is_active
    _write_audit(
        db, current_user, "admin_account_status_change", "user", str(user.id),
        f"Account {'activated' if request.is_active else 'deactivated'}: {user.email}")
    db.commit()
    db.refresh(user)
    return _user_item(user)


@router.put("/users/{user_id}/role", response_model=AdminUserItem)
def update_user_role(user_id: int, request: RoleUpdateRequest,
                     current_user: User = Depends(require_super_admin),
                     db: Session = Depends(get_db)):
    """Change an application role (citizen/admin/super_admin)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="You cannot change your own role")
    old_role = user.role
    user.role = request.role
    _write_audit(
        db, current_user, "admin_role_change", "user", str(user.id),
        f"Role changed for {user.email}: {old_role} -> {request.role}")
    db.commit()
    db.refresh(user)
    return _user_item(user)


@router.get("/audit-logs")
def list_audit_logs(limit: int = 20,
                    current_user: User = Depends(require_super_admin),
                    db: Session = Depends(get_db)):
    """Recent application audit trail (actors, actions, outcomes)."""
    limit = max(1, min(limit, 100))
    rows = (db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit).all())
    user_ids = {r.user_id for r in rows if r.user_id}
    emails = {}
    if user_ids:
        for u in db.query(User).filter(User.id.in_(user_ids)).all():
            emails[u.id] = u.email
    return [
        {
            "id": r.id,
            "action_type": r.action_type,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "action_description": r.action_description,
            "actor_email": emails.get(r.user_id),
            "success": r.success,
            "created_at": r.created_at,
        }
        for r in rows
    ]


class SettingUpdateRequest(BaseModel):
    value: str


@router.get("/settings")
def list_settings(current_user: User = Depends(require_super_admin),
                  db: Session = Depends(get_db)):
    """Application system settings (no secrets stored here)."""
    rows = db.query(SystemSetting).order_by(
        SystemSetting.category, SystemSetting.key).all()
    return [
        {
            "key": s.key,
            "value": s.value,
            "value_type": s.value_type,
            "category": s.category,
            "description_en": s.description_en,
            "description_bn": s.description_bn,
            "is_public": s.is_public,
            "is_editable": s.is_editable,
            "updated_at": s.updated_at,
        }
        for s in rows
    ]


@router.put("/settings/{key}")
def update_setting(key: str, request: SettingUpdateRequest,
                   current_user: User = Depends(require_super_admin),
                   db: Session = Depends(get_db)):
    """Update an editable system setting value."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Setting not found")
    if not setting.is_editable:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This setting is not editable")
    old_value = setting.value
    setting.value = request.value
    setting.updated_by = current_user.id
    _write_audit(
        db, current_user, "admin_setting_change", "system_setting", key,
        f"Setting '{key}' changed: '{old_value}' -> '{request.value}'")
    db.commit()
    return {"key": key, "value": request.value}


# ---------------------------------------------------------------------------
# System-wide statistics (Feature #12) - real DB aggregates, no secrets.
# ---------------------------------------------------------------------------
@router.get("/stats")
def system_stats(current_user: User = Depends(require_super_admin),
                 db: Session = Depends(get_db)):
    """System-wide statistics for the super admin dashboard.

    Never exposes passwords, tokens, hashes or security internals - counts and
    land identifiers only.
    """
    total_citizens = db.query(User).filter(User.role == "citizen").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_super_admins = db.query(User).filter(User.role == "super_admin").count()
    total_districts = db.query(District).count()
    total_upazilas = db.query(Upazila).count()
    total_mouzas = db.query(Mouza).count()
    total_khatians = db.query(KhatianRecord).count()
    total_dags = db.query(DagRecord).count()
    total_parcels = db.query(LandParcel).count()
    total_cases = db.query(VerificationCase).count()
    total_legal_updates = db.query(LegalUpdate).count()

    risk_rows = (
        db.query(VerificationCase.overall_risk_level, func.count(VerificationCase.id))
        .group_by(VerificationCase.overall_risk_level).all()
    )
    risk_distribution = {level: 0 for level in RISK_LEVELS}
    for level, n in risk_rows:
        if level in risk_distribution:
            risk_distribution[level] = n

    cases_by_jurisdiction = [
        {"upazila": name or "Unknown", "count": n}
        for name, n in (
            db.query(VerificationCase.upazila_name, func.count(VerificationCase.id))
            .group_by(VerificationCase.upazila_name)
            .order_by(func.count(VerificationCase.id).desc())
            .limit(8).all()
        )
    ]

    # Data completeness (deterministic % over synthetic dataset).
    def pct(part: int, whole: int) -> float:
        return round((part / whole) * 100, 1) if whole else 0.0

    parcels_with_geometry = db.query(PlotGeometry).count()
    parcels_with_ownership = db.query(func.count(func.distinct(OwnershipRecord.parcel_id))).scalar() or 0
    parcels_with_chouhaddi = (
        db.query(LandParcel)
        .filter(LandParcel.chouhaddi_north.isnot(None)).count()
    )
    data_completeness = {
        "geometry": pct(parcels_with_geometry, total_parcels),
        "ownership": pct(parcels_with_ownership, total_parcels),
        "chouhaddi": pct(parcels_with_chouhaddi, total_parcels),
    }

    recent_rows = (db.query(AuditLog)
                   .order_by(AuditLog.created_at.desc()).limit(8).all())
    recent_activity = [
        {
            "action_type": r.action_type,
            "action_description": r.action_description,
            "success": r.success,
            "created_at": r.created_at,
        }
        for r in recent_rows
    ]

    return {
        "totals": {
            "total_citizens": total_citizens,
            "total_admins": total_admins,
            "total_super_admins": total_super_admins,
            "total_districts": total_districts,
            "total_upazilas": total_upazilas,
            "total_mouzas": total_mouzas,
            "total_khatians": total_khatians,
            "total_dags": total_dags,
            "total_parcels": total_parcels,
            "total_verification_cases": total_cases,
            "total_legal_updates": total_legal_updates,
            "high_attention": risk_distribution.get("HIGH_ATTENTION", 0),
            "critical_signals": risk_distribution.get("CRITICAL_SIGNAL", 0),
        },
        "risk_distribution": risk_distribution,
        "cases_by_jurisdiction": cases_by_jurisdiction,
        "data_completeness": data_completeness,
        "recent_activity": recent_activity,
    }


# ---------------------------------------------------------------------------
# LOCATIONS CRUD (Feature #10) - divisions & districts (read/create/update/
# delete), upazilas & mouzas (CRUD). Reference data is synthetic demonstration
# data; removal is blocked while dependent records exist.
# ---------------------------------------------------------------------------
class DistrictCreateRequest(BaseModel):
    division_id: Optional[int] = None
    name_en: str
    name_bn: Optional[str] = None
    code: str


class DistrictUpdateRequest(BaseModel):
    division_id: Optional[int] = None
    name_en: Optional[str] = None
    name_bn: Optional[str] = None
    code: Optional[str] = None


class UpazilaCreateRequest(BaseModel):
    district_id: int
    name_en: str
    name_bn: Optional[str] = None
    code: str


class UpazilaUpdateRequest(BaseModel):
    name_en: Optional[str] = None
    name_bn: Optional[str] = None
    code: Optional[str] = None


class MouzaCreateRequest(BaseModel):
    upazila_id: int
    name_en: str
    name_bn: Optional[str] = None
    jl_no: Optional[str] = None
    code: str


class MouzaUpdateRequest(BaseModel):
    name_en: Optional[str] = None
    name_bn: Optional[str] = None
    jl_no: Optional[str] = None
    code: Optional[str] = None


@router.get("/locations/divisions")
def sa_list_divisions(current_user: User = Depends(require_super_admin),
                      db: Session = Depends(get_db)):
    rows = db.query(Division).order_by(Division.name_en).all()
    return [
        {"id": d.id, "name_en": d.name_en, "name_bn": d.name_bn, "code": d.code}
        for d in rows
    ]


@router.get("/locations/districts")
def sa_list_districts(division_id: Optional[int] = None,
                      current_user: User = Depends(require_super_admin),
                      db: Session = Depends(get_db)):
    q = db.query(District)
    if division_id:
        q = q.filter(District.division_id == division_id)
    rows = q.order_by(District.name_en).all()
    return [
        {"id": d.id, "division_id": d.division_id, "name_en": d.name_en,
         "name_bn": d.name_bn, "code": d.code}
        for d in rows
    ]


@router.post("/locations/districts", status_code=status.HTTP_201_CREATED)
def sa_create_district(payload: DistrictCreateRequest,
                       current_user: User = Depends(require_super_admin),
                       db: Session = Depends(get_db)):
    if payload.division_id and not db.query(Division).filter(
            Division.id == payload.division_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Unknown division_id")
    if db.query(District).filter(District.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="A district with this code already exists")
    district = District(division_id=payload.division_id, name_en=payload.name_en,
                        name_bn=payload.name_bn, code=payload.code)
    db.add(district)
    db.flush()
    _write_audit(db, current_user, "admin_create", "district", str(district.id),
                 f"Created district '{district.name_en}'")
    db.commit()
    db.refresh(district)
    return {"id": district.id, "division_id": district.division_id,
            "name_en": district.name_en, "name_bn": district.name_bn,
            "code": district.code}


@router.put("/locations/districts/{district_id}")
def sa_update_district(district_id: int, payload: DistrictUpdateRequest,
                       current_user: User = Depends(require_super_admin),
                       db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="District not found")
    if payload.division_id and not db.query(Division).filter(
            Division.id == payload.division_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Unknown division_id")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(district, field, value)
    _write_audit(db, current_user, "admin_update", "district", str(district.id),
                 f"Updated district '{district.name_en}'")
    db.commit()
    db.refresh(district)
    return {"id": district.id, "division_id": district.division_id,
            "name_en": district.name_en, "name_bn": district.name_bn,
            "code": district.code}


@router.delete("/locations/districts/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
def sa_delete_district(district_id: int,
                       current_user: User = Depends(require_super_admin),
                       db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="District not found")
    if db.query(Upazila).filter(Upazila.district_id == district_id).count() > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete a district that still has upazilas")
    _write_audit(db, current_user, "admin_delete", "district", str(district.id),
                 f"Deleted district '{district.name_en}'")
    db.delete(district)
    db.commit()
    return None


@router.get("/locations/upazilas")
def sa_list_upazilas(district_id: Optional[int] = None,
                     current_user: User = Depends(require_super_admin),
                     db: Session = Depends(get_db)):
    q = db.query(Upazila)
    if district_id:
        q = q.filter(Upazila.district_id == district_id)
    return [
        {"id": u.id, "district_id": u.district_id, "name_en": u.name_en,
         "name_bn": u.name_bn, "code": u.code}
        for u in q.order_by(Upazila.name_en).all()
    ]


@router.post("/locations/upazilas", status_code=status.HTTP_201_CREATED)
def sa_create_upazila(payload: UpazilaCreateRequest,
                      current_user: User = Depends(require_super_admin),
                      db: Session = Depends(get_db)):
    if not db.query(District).filter(District.id == payload.district_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown district_id")
    up = Upazila(district_id=payload.district_id, name_en=payload.name_en,
                 name_bn=payload.name_bn, code=payload.code)
    db.add(up)
    db.flush()
    _write_audit(db, current_user, "admin_create", "upazila", str(up.id),
                 f"Created upazila '{up.name_en}'")
    db.commit()
    db.refresh(up)
    return {"id": up.id, "district_id": up.district_id, "name_en": up.name_en,
            "name_bn": up.name_bn, "code": up.code}


@router.put("/locations/upazilas/{upazila_id}")
def sa_update_upazila(upazila_id: int, payload: UpazilaUpdateRequest,
                      current_user: User = Depends(require_super_admin),
                      db: Session = Depends(get_db)):
    up = db.query(Upazila).filter(Upazila.id == upazila_id).first()
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upazila not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(up, field, value)
    _write_audit(db, current_user, "admin_update", "upazila", str(up.id),
                 f"Updated upazila '{up.name_en}'")
    db.commit()
    db.refresh(up)
    return {"id": up.id, "district_id": up.district_id, "name_en": up.name_en,
            "name_bn": up.name_bn, "code": up.code}


@router.delete("/locations/upazilas/{upazila_id}", status_code=status.HTTP_204_NO_CONTENT)
def sa_delete_upazila(upazila_id: int,
                      current_user: User = Depends(require_super_admin),
                      db: Session = Depends(get_db)):
    up = db.query(Upazila).filter(Upazila.id == upazila_id).first()
    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upazila not found")
    if db.query(Mouza).filter(Mouza.upazila_id == upazila_id).count() > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete an upazila that still has mouzas")
    _write_audit(db, current_user, "admin_delete", "upazila", str(up.id),
                 f"Deleted upazila '{up.name_en}'")
    db.delete(up)
    db.commit()
    return None


@router.get("/locations/mouzas")
def sa_list_mouzas(upazila_id: Optional[int] = None,
                   current_user: User = Depends(require_super_admin),
                   db: Session = Depends(get_db)):
    q = db.query(Mouza)
    if upazila_id:
        q = q.filter(Mouza.upazila_id == upazila_id)
    return [
        {"id": m.id, "upazila_id": m.upazila_id, "name_en": m.name_en,
         "name_bn": m.name_bn, "jl_no": m.jl_no, "code": m.code}
        for m in q.order_by(Mouza.name_en).all()
    ]


@router.post("/locations/mouzas", status_code=status.HTTP_201_CREATED)
def sa_create_mouza(payload: MouzaCreateRequest,
                    current_user: User = Depends(require_super_admin),
                    db: Session = Depends(get_db)):
    if not db.query(Upazila).filter(Upazila.id == payload.upazila_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown upazila_id")
    mz = Mouza(upazila_id=payload.upazila_id, name_en=payload.name_en,
               name_bn=payload.name_bn, jl_no=payload.jl_no, code=payload.code)
    db.add(mz)
    db.flush()
    _write_audit(db, current_user, "admin_create", "mouza", str(mz.id),
                 f"Created mouza '{mz.name_en}'")
    db.commit()
    db.refresh(mz)
    return {"id": mz.id, "upazila_id": mz.upazila_id, "name_en": mz.name_en,
            "name_bn": mz.name_bn, "jl_no": mz.jl_no, "code": mz.code}


@router.put("/locations/mouzas/{mouza_id}")
def sa_update_mouza(mouza_id: int, payload: MouzaUpdateRequest,
                    current_user: User = Depends(require_super_admin),
                    db: Session = Depends(get_db)):
    mz = db.query(Mouza).filter(Mouza.id == mouza_id).first()
    if not mz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mouza not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mz, field, value)
    _write_audit(db, current_user, "admin_update", "mouza", str(mz.id),
                 f"Updated mouza '{mz.name_en}'")
    db.commit()
    db.refresh(mz)
    return {"id": mz.id, "upazila_id": mz.upazila_id, "name_en": mz.name_en,
            "name_bn": mz.name_bn, "jl_no": mz.jl_no, "code": mz.code}


@router.delete("/locations/mouzas/{mouza_id}", status_code=status.HTTP_204_NO_CONTENT)
def sa_delete_mouza(mouza_id: int,
                    current_user: User = Depends(require_super_admin),
                    db: Session = Depends(get_db)):
    mz = db.query(Mouza).filter(Mouza.id == mouza_id).first()
    if not mz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mouza not found")
    if db.query(KhatianRecord).filter(KhatianRecord.mouza_id == mouza_id).count() > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Cannot delete a mouza that still has khatian records")
    _write_audit(db, current_user, "admin_delete", "mouza", str(mz.id),
                 f"Deleted mouza '{mz.name_en}'")
    db.delete(mz)
    db.commit()
    return None
