# -*- coding: utf-8 -*-
"""Land & Registration Update content (Feature #4/#5).

- Published updates are readable (ticker + details). No legal claim is made
  by this content; every update carries an OFFICIAL SOURCE reference.
- Create/Update/Delete are restricted to administrators:
    * super_admin  -> global scope (national or any upazila)
    * admin        -> jurisdiction-limited to their assigned upazila
  Authorization is enforced SERVER-SIDE, never only by hiding UI.
- Citizens can never create or modify this content.
- Every mutation writes an AuditLog entry (deterministic, no AI).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import LegalUpdate, User, AuditLog, Upazila
from app.api.deps import get_current_user, require_admin
from app.schemas.content import (
    LegalUpdateCreate, LegalUpdateUpdate, LegalUpdateResponse,
    LEGAL_UPDATE_STATUSES, LEGAL_UPDATE_CATEGORIES,
)

router = APIRouter()


def _to_response(u: LegalUpdate) -> LegalUpdateResponse:
    return LegalUpdateResponse.model_validate(u)


def _validate(payload, partial: bool = False):
    if payload.category is not None and payload.category not in LEGAL_UPDATE_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid category. Allowed: {', '.join(LEGAL_UPDATE_CATEGORIES)}")
    if getattr(payload, "status", None) is not None and payload.status not in LEGAL_UPDATE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid status. Allowed: {', '.join(LEGAL_UPDATE_STATUSES)}")


def _enforce_jurisdiction(current_user: User, upazila_id: Optional[int]) -> Optional[int]:
    """Return the upazila_id the actor is allowed to write, enforcing scope.

    super_admin -> whatever was requested (global).
    admin       -> only their assigned upazila; national (None) is not allowed.
    """
    if current_user.role == "super_admin":
        return upazila_id
    # plain admin: jurisdiction-limited
    if current_user.assigned_upazila_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has no assigned jurisdiction; content authoring is not permitted.")
    if upazila_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="National updates can only be published by a super admin.")
    if upazila_id != current_user.assigned_upazila_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage updates for your assigned upazila.")
    return upazila_id


def _assert_can_edit(current_user: User, update: LegalUpdate) -> None:
    if current_user.role == "super_admin":
        return
    if current_user.assigned_upazila_id is None or update.upazila_id != current_user.assigned_upazila_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This update is outside your assigned jurisdiction.")


def _write_audit(db: Session, actor: User, action: str, resource_id: str, description: str):
    db.add(AuditLog(
        user_id=actor.id, action_type=action, resource_type="legal_update",
        resource_id=resource_id, action_description=description, success="success",
    ))


# --------------------------------------------------------------- public read
@router.get("/legal-updates", response_model=List[LegalUpdateResponse])
def list_published_updates(category: Optional[str] = None, limit: int = 20,
                           db: Session = Depends(get_db)):
    """Published land & registration updates (public informational content)."""
    limit = max(1, min(limit, 100))
    query = db.query(LegalUpdate).filter(LegalUpdate.status == "published")
    if category:
        query = query.filter(LegalUpdate.category == category)
    rows = (query.order_by(
        LegalUpdate.publication_date.desc().nullslast(),
        LegalUpdate.id.desc())
        .limit(limit).all())
    return [_to_response(u) for u in rows]


@router.get("/legal-updates/{update_id}", response_model=LegalUpdateResponse)
def get_published_update(update_id: int, db: Session = Depends(get_db)):
    """A single published update (details view)."""
    u = db.query(LegalUpdate).filter(
        LegalUpdate.id == update_id, LegalUpdate.status == "published").first()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Update not found")
    return _to_response(u)


# ----------------------------------------------------------- admin manage API
@router.get("/manage/legal-updates", response_model=List[LegalUpdateResponse])
def manage_list_updates(current_user: User = Depends(require_admin),
                        db: Session = Depends(get_db)):
    """All updates (any status) visible to the acting administrator."""
    query = db.query(LegalUpdate)
    if current_user.role != "super_admin":
        if current_user.assigned_upazila_id is None:
            return []
        query = query.filter(LegalUpdate.upazila_id == current_user.assigned_upazila_id)
    rows = query.order_by(LegalUpdate.updated_at.desc().nullslast(),
                          LegalUpdate.id.desc()).all()
    return [_to_response(u) for u in rows]


@router.post("/manage/legal-updates", response_model=LegalUpdateResponse,
             status_code=status.HTTP_201_CREATED)
def create_update(payload: LegalUpdateCreate,
                  current_user: User = Depends(require_admin),
                  db: Session = Depends(get_db)):
    """Create a land/registration update (admin jurisdiction enforced)."""
    _validate(payload)
    upazila_id = _enforce_jurisdiction(current_user, payload.upazila_id)
    if upazila_id is not None and not db.query(Upazila).filter(Upazila.id == upazila_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Unknown upazila_id")
    u = LegalUpdate(
        title_en=payload.title_en, title_bn=payload.title_bn,
        summary_en=payload.summary_en, summary_bn=payload.summary_bn,
        category=payload.category, publication_date=payload.publication_date,
        effective_date=payload.effective_date,
        official_source_name=payload.official_source_name,
        official_source_url=payload.official_source_url,
        language=payload.language, status=payload.status,
        upazila_id=upazila_id, created_by=current_user.id,
    )
    db.add(u)
    db.flush()
    _write_audit(db, current_user, "legal_update_create", str(u.id),
                 f"Created legal update '{u.title_en}' ({u.category}, {u.status})")
    db.commit()
    db.refresh(u)
    return _to_response(u)


@router.put("/manage/legal-updates/{update_id}", response_model=LegalUpdateResponse)
def update_update(update_id: int, payload: LegalUpdateUpdate,
                  current_user: User = Depends(require_admin),
                  db: Session = Depends(get_db)):
    """Update an existing land/registration update."""
    u = db.query(LegalUpdate).filter(LegalUpdate.id == update_id).first()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Update not found")
    _assert_can_edit(current_user, u)
    _validate(payload, partial=True)
    data = payload.model_dump(exclude_unset=True)
    # Re-check jurisdiction if the target upazila is being changed.
    if "upazila_id" in data:
        data["upazila_id"] = _enforce_jurisdiction(current_user, data["upazila_id"])
    for field, value in data.items():
        setattr(u, field, value)
    _write_audit(db, current_user, "legal_update_update", str(u.id),
                 f"Updated legal update '{u.title_en}' ({u.status})")
    db.commit()
    db.refresh(u)
    return _to_response(u)


@router.delete("/manage/legal-updates/{update_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_update(update_id: int,
                  current_user: User = Depends(require_admin),
                  db: Session = Depends(get_db)):
    """Delete (or archive) a land/registration update.

    Published updates are archived rather than hard-deleted to preserve the
    audit trail; drafts are removed entirely.
    """
    u = db.query(LegalUpdate).filter(LegalUpdate.id == update_id).first()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Update not found")
    _assert_can_edit(current_user, u)
    if u.status == "published":
        u.status = "archived"
        _write_audit(db, current_user, "legal_update_archive", str(u.id),
                     f"Archived legal update '{u.title_en}'")
    else:
        _write_audit(db, current_user, "legal_update_delete", str(u.id),
                     f"Deleted legal update '{u.title_en}'")
        db.delete(u)
    db.commit()
    return None
