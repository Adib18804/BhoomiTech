"""
Phase 3 verification utility - runs the ACTUAL VerificationEngine against each
demo scenario A-L using the deterministic claims stored in DemoScenario.

Produces: Scenario | Parcel | Expected Result | Actual Result | Pass/Fail

Usage:
    PYTHONIOENCODING=utf-8 ./venv/Scripts/python.exe verify_scenarios.py
"""

import sys
from decimal import Decimal

from app.db.session import SessionLocal
from app.models import DemoScenario, LandParcel, DagRecord, KhatianRecord
from app.services.verification_engine import VerificationEngine

# Scenario D/I/K previously depended on the Phase 5 engine work
# (check_area_share, check_historical_consistency, insufficient>=2 rule).
# Those checks are implemented now; the set is empty for reference.
PENDING_PHASE_5 = set()


def resolve_parcel(db, scenario: DemoScenario):
    """Resolve the parcel via explicit identifiers - same path as the engine workflow."""
    return (
        db.query(LandParcel)
        .join(DagRecord, LandParcel.dag_id == DagRecord.id)
        .join(KhatianRecord, DagRecord.khatian_id == KhatianRecord.id)
        .filter(
            KhatianRecord.khatian_no == scenario.khatian_no,
            KhatianRecord.survey_type == scenario.survey_type,
            DagRecord.dag_no == scenario.dag_no,
        )
        .first()
    )


def get_claim(scenario: DemoScenario):
    """Read the deterministic seller claim stored by the seeder.
    Structure: expected_findings['seller_claim'] = {claimed_owner_name,
    claimed_share_decimal, claimed_sale_area_decimal}."""
    ef = scenario.expected_findings or {}
    claim = ef.get("seller_claim", ef)  # fall back to flat for robustness
    share = claim.get("claimed_share_decimal", 0)
    sale_area = claim.get("claimed_sale_area_decimal")
    return (
        claim.get("claimed_owner_name", ""),
        Decimal(str(share)),
        Decimal(str(sale_area)) if sale_area is not None else Decimal("0"),
    )


def main():
    db = SessionLocal()
    scenarios = (
        db.query(DemoScenario).filter(DemoScenario.is_active == True).order_by(DemoScenario.display_order).all()
    )
    if not scenarios:
        print("[FAIL] No active demo scenarios found. Run seed.py first.")
        sys.exit(1)

    print("=" * 110)
    print("PHASE 3 SCENARIO VERIFICATION - engine output vs expected result")
    print("=" * 110)
    header = f"{'Scn':<4} {'Parcel':<20} {'Expected':<18} {'Actual':<18} {'Score':<6} {'Status':<8}"
    print(header)
    print("-" * 110)

    results = []
    all_pass = True
    for s in scenarios:
        parcel = resolve_parcel(db, s)
        expected = s.expected_risk_level  # authoritative expected level stored by the seeder

        if parcel is None:
            print(f"{s.scenario_id[-1]:<4} {'NOT FOUND':<20} {expected:<18} {'-':<18} {'-':<6} {'[FAIL]':<8}")
            results.append((s.scenario_id, None, expected, None, False))
            all_pass = False
            continue

        claimed_owner, claimed_share, claimed_sale_area = get_claim(s)
        engine = VerificationEngine(db)
        risk_level, risk_score, check_results = engine.run_verification(
            parcel, claimed_owner, claimed_share, claimed_sale_area
        )

        passed = risk_level == expected
        if not passed:
            all_pass = False
        if passed:
            status = "[OK]"
        elif s.scenario_id in PENDING_PHASE_5:
            status = "[PENDING PHASE 5]"
        else:
            status = "[FAIL]"
        print(f"{s.scenario_id[-1]:<4} {parcel.parcel_id:<20} {expected:<18} {risk_level:<18} {risk_score:<6} {status:<8}")

        # Per-check detail for transparency
        for cr in check_results:
            if cr.status != "passed":
                top = cr.findings[0].title_en if cr.findings else ""
                print(f"{'':<4}   - {cr.check_name}: {cr.status} ({top})")

        results.append((s.scenario_id, parcel.parcel_id, expected, risk_level, passed))

    db.close()

    print("=" * 110)
    print("Legend: [PENDING PHASE 5] = expected result depends on engine checks planned for Phase 5")
    print(f"Overall (current engine): {'ALL PASS' if all_pass else 'see table above'}")

    # Persist a machine-readable summary for the final report
    with open("phase3_results.txt", "w", encoding="utf-8") as f:
        f.write("Scenario | Parcel | Expected | Actual | Pass\n")
        for sid, pid, exp, act, ok in results:
            f.write(f"{sid} | {pid} | {exp} | {act} | {'PASS' if ok else 'PENDING/FAIL'}\n")
    print("Saved: backend/phase3_results.txt")


if __name__ == "__main__":
    main()
