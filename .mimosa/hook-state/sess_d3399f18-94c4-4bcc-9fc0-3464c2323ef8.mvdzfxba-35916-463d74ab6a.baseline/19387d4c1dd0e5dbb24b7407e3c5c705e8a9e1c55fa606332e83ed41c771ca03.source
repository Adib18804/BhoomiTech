# -*- coding: utf-8 -*-
"""Demo / development scenario endpoints (Phase 11E).

DEMO / DEVELOPMENT MODE ONLY: these endpoints expose the 12 synthetic
demonstration scenarios so reviewers can walk the full verification
workflow. They are NOT an official government feature and the data is
entirely synthetic.

The list endpoint deliberately does NOT expose expected_risk_level or the
scenario's expected findings (the verification result should remain a live
discovery). The per-scenario detail endpoint returns the seller claim that
belongs to the scenario so the demo can pre-fill the claim form.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import DemoScenario
from app.api.deps import get_current_user

router = APIRouter()


class DemoScenarioItem(BaseModel):
    scenario_id: str
    letter: str
    name_en: str
    name_bn: Optional[str] = None
    description_en: str
    description_bn: Optional[str] = None
    scenario_type: str
    district_name: str
    upazila_name: str
    mouza_name: str
    survey_type: str
    khatian_no: str
    dag_no: str
    parcel_id: Optional[str] = None
    display_order: int


class DemoScenarioDetail(DemoScenarioItem):
    demo_mode: bool = True
    seller_claim: dict


def _letter(scenario_id: str) -> str:
    return scenario_id.replace("SCENARIO_", "").replace("_", " ") or scenario_id


def _item(s: DemoScenario) -> DemoScenarioItem:
    return DemoScenarioItem(
        scenario_id=s.scenario_id,
        letter=_letter(s.scenario_id),
        name_en=s.name_en,
        name_bn=s.name_bn,
        description_en=s.description_en,
        description_bn=s.description_bn,
        scenario_type=s.scenario_type,
        district_name=s.district_name,
        upazila_name=s.upazila_name,
        mouza_name=s.mouza_name,
        survey_type=s.survey_type,
        khatian_no=s.khatian_no,
        dag_no=s.dag_no,
        parcel_id=s.parcel_id,
        display_order=s.display_order,
    )


@router.get("/scenarios")
def list_demo_scenarios(current_user=Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """All active demo scenarios (DEMO / DEVELOPMENT MODE - synthetic data)."""
    rows = (db.query(DemoScenario)
            .filter(DemoScenario.is_active.is_(True))
            .order_by(DemoScenario.display_order).all())
    return {
        "demo_mode": True,
        "data_notice": "SYNTHETIC DEMONSTRATION DATA",
        "scenarios": [_item(s) for s in rows],
    }


@router.get("/scenarios/{scenario_id}", response_model=DemoScenarioDetail)
def get_demo_scenario(scenario_id: str,
                      current_user=Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """One demo scenario incl. its seller claim (for demo form pre-fill)."""
    s = db.query(DemoScenario).filter(
        DemoScenario.scenario_id == scenario_id,
        DemoScenario.is_active.is_(True)).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Demo scenario not found")
    item = _item(s)
    claim = (s.expected_findings or {}).get("seller_claim") or {}
    return DemoScenarioDetail(
        **item.model_dump(),
        demo_mode=True,
        seller_claim={
            "claimed_owner_name": claim.get("claimed_owner_name", ""),
            "claimed_share_decimal": claim.get("claimed_share_decimal", 0),
            "claimed_sale_area_decimal": claim.get("claimed_sale_area_decimal", 0),
        },
    )
