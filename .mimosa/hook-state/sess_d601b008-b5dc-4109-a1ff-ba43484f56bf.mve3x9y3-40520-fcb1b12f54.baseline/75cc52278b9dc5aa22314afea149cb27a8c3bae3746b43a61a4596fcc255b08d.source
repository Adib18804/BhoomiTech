"""
Phase 3 END-TO-END scenario verification - runs every demo scenario A-L through
the ACTUAL API workflow (login -> POST /api/verification/check) exactly as the
frontend does, and compares overall_risk_level with the expected level.

Usage (server must be running on :8000):
    PYTHONIOENCODING=utf-8 ./venv/Scripts/python.exe verify_scenarios_api.py
"""

import sys
import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000"

# Scenario D/I/K previously depended on the Phase 5 engine work; implemented now.
PENDING_PHASE_5 = set()


def http(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def main():
    # 1. Login as citizen demo account (the actual workflow entry point)
    status, body = http("POST", "/api/auth/login", body={
        "email": "citizen1@example.com", "password": "Citizen@2026"})
    if status != 200:
        print(f"[FAIL] Login failed: {status} {body}")
        sys.exit(1)
    token = body.get("access_token")
    print("[OK] Logged in as citizen1@example.com\n")

    # 2. Load scenario definitions from the DB (no demo-scenario API exists yet;
    #    that is deferred to Phase 11). The verification itself runs over HTTP.
    from app.db.session import SessionLocal
    from app.models import DemoScenario
    db = SessionLocal()
    scenarios = db.query(DemoScenario).filter(DemoScenario.is_active == True).order_by(DemoScenario.display_order).all()
    if not scenarios:
        print("[FAIL] No demo scenarios in DB. Run seed.py first.")
        sys.exit(2)
    scenarios = [
        {
            "scenario_id": s.scenario_id,
            "expected_risk_level": s.expected_risk_level,
            "parcel_id": s.parcel_id,
            "khatian_no": s.khatian_no,
            "dag_no": s.dag_no,
            "survey_type": s.survey_type,
            "display_order": s.display_order,
            "expected_findings": s.expected_findings,
        }
        for s in scenarios
    ]
    db.close()

    print(f"{'Scn':<4} {'Parcel':<20} {'Expected':<18} {'Actual':<18} {'Score':<6} {'Status':<10}")
    print("-" * 96)
    rows, all_pass = [], True
    for s in sorted(scenarios, key=lambda x: x.get("display_order", 0)):
        sid = s["scenario_id"]
        expected = s["expected_risk_level"]
        claim = (s.get("expected_findings") or {}).get("seller_claim", {})
        parcel_id = s.get("parcel_id")

        status, result = http("POST", "/api/verification/check", token=token, body={
            "parcel_id": parcel_id,
            "seller_claim": {
                "claimed_owner_name": claim.get("claimed_owner_name", ""),
                "claimed_share_decimal": claim.get("claimed_share_decimal", 0),
                "claimed_sale_area_decimal": claim.get("claimed_sale_area_decimal", 0),
                "claimed_khatian": s.get("khatian_no"),
                "claimed_dag": s.get("dag_no"),
                "claimed_survey_type": s.get("survey_type"),
            },
        })
        if status != 200:
            print(f"{sid[-1]:<4} {str(parcel_id):<20} {expected:<18} {'HTTP ' + str(status):<18} {'-':<6} {'[FAIL]':<10}")
            rows.append((sid, parcel_id, expected, f"HTTP {status}", False))
            all_pass = False
            continue

        actual = result["overall_risk_level"]
        score = result["risk_score"]
        passed = actual == expected
        if not passed:
            all_pass = False
        status_label = "[OK]" if passed else ("[PENDING PHASE 5]" if sid in PENDING_PHASE_5 else "[FAIL]")
        print(f"{sid[-1]:<4} {str(parcel_id):<20} {expected:<18} {actual:<18} {score:<6} {status_label:<10}")
        rows.append((sid, parcel_id, expected, actual, passed))

    print("-" * 96)
    print("Legend: [PENDING PHASE 5] = expected level needs engine checks scheduled for Phase 5")
    print(f"API end-to-end: {'ALL PASS' if all_pass else 'see table above'}")

    with open("phase3_api_results.txt", "w", encoding="utf-8") as f:
        f.write("Scenario | Parcel | Expected | Actual | Pass\n")
        for sid, pid, exp, act, ok in rows:
            f.write(f"{sid} | {pid} | {exp} | {act} | {'PASS' if ok else 'PENDING/FAIL'}\n")
    print("Saved: backend/phase3_api_results.txt")


if __name__ == "__main__":
    main()
