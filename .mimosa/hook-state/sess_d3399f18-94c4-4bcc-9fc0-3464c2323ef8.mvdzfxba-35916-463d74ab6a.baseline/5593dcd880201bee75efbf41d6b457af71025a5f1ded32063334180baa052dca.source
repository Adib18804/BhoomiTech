# -*- coding: utf-8 -*-
"""Verification engine tests: all 12 demo scenarios (A-L) executed through the
live API, plus request validation and the insufficient-data case.

Scenarios are loaded from the demo_scenarios table by scenario_id (never by
list index) and each one is checked against its expected_risk_level.
"""
import re
from concurrent.futures import ThreadPoolExecutor

import pytest

from app.models import VerificationCase
from tests.conftest import check_request_body, load_scenarios, scenario_by_id

CASE_ID_RE = re.compile(r"^BT-VER-\d{4}-\d{6}$")


def pytest_generate_tests(metafunc):
    if "scenario" in metafunc.fixturenames:
        scenarios = load_scenarios()
        metafunc.parametrize(
            "scenario",
            scenarios,
            ids=[s["scenario_id"] for s in scenarios],
        )


def test_all_demo_scenarios_produce_expected_risk_level(client, citizen_headers, scenario):
    """Every demo scenario A-L must produce exactly its expected risk level."""
    r = client.post("/api/verification/check",
                    json=check_request_body(scenario), headers=citizen_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["parcel_id"] == scenario["parcel_id"]
    assert body["overall_risk_level"] == scenario["expected_risk_level"], (
        f"{scenario['scenario_id']}: expected {scenario['expected_risk_level']}, "
        f"got {body['overall_risk_level']}"
    )
    # Sanity of the summary block
    assert body["total_checks"] == len(body["checks"]) > 0
    assert body["case_id"]


def test_scenario_a_clean_record_is_low_concern(client, citizen_headers):
    scenario = scenario_by_id("SCENARIO_A")
    r = client.post("/api/verification/check",
                    json=check_request_body(scenario), headers=citizen_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["overall_risk_level"] == "LOW_CONCERN"
    assert body["critical_issues"] == 0


def test_scenario_k_insufficient_data(client, citizen_headers):
    """Missing data must yield INSUFFICIENT_DATA, never a clean result."""
    scenario = scenario_by_id("SCENARIO_K")
    r = client.post("/api/verification/check",
                    json=check_request_body(scenario), headers=citizen_headers)
    assert r.status_code == 200
    assert r.json()["overall_risk_level"] == "INSUFFICIENT_DATA"


def test_check_unknown_parcel_404(client, citizen_headers):
    body = check_request_body(scenario_by_id("SCENARIO_A"))
    body["parcel_id"] = "BT-PARCEL-NOPE"
    assert client.post("/api/verification/check", json=body,
                       headers=citizen_headers).status_code == 404


def test_check_requires_authentication(client):
    body = check_request_body(scenario_by_id("SCENARIO_A"))
    assert client.post("/api/verification/check", json=body).status_code == 401


def test_check_rejects_incomplete_claim(client, citizen_headers):
    body = {"parcel_id": scenario_by_id("SCENARIO_A")["parcel_id"],
            "seller_claim": {"claimed_owner_name": "Only Name"}}
    assert client.post("/api/verification/check", json=body,
                       headers=citizen_headers).status_code == 422


def test_detail_returns_bilingual_findings(client, citizen_headers):
    """Phase 7: findings must carry both English and Bengali content."""
    scenario = scenario_by_id("SCENARIO_D")  # area/share conflict
    created = client.post("/api/verification/check",
                          json=check_request_body(scenario), headers=citizen_headers)
    assert created.status_code == 200
    detail = client.get(f"/api/verification/{created.json()['case_id']}",
                        headers=citizen_headers)
    assert detail.status_code == 200
    findings = detail.json()["findings"]
    assert findings, "expected at least one finding"
    with_bn = [f for f in findings if f.get("title_bn")]
    assert with_bn, "expected at least one Bengali title among findings"


def test_concurrent_duplicate_verification_requests_never_collide(client, citizen_headers, db):
    """Regression for the count()+1 case_id allocation race.

    React StrictMode fires the verification effect twice, so two requests can
    reach the API concurrently for the same land parcel. The id allocation must
    be serialised (transaction-scoped advisory lock) so that:

      * every request receives a 200 (no unique-constraint HTTP 500),
      * every generated case_id is unique,
      * every id is persisted exactly once.

    This test fails on the pre-fix code where two concurrent requests compute
    the same BT-VER-... id.
    """
    scenario = scenario_by_id("SCENARIO_F")
    body = check_request_body(scenario)
    attempts = 6

    def fire(_):
        return client.post("/api/verification/check", json=body, headers=citizen_headers)

    with ThreadPoolExecutor(max_workers=attempts) as pool:
        responses = list(pool.map(fire, range(attempts)))

    statuses = [r.status_code for r in responses]
    assert all(s == 200 for s in statuses), f"non-200 concurrent responses: {statuses}"

    case_ids = [r.json()["case_id"] for r in responses]
    assert len(case_ids) == attempts
    assert all(CASE_ID_RE.match(cid) for cid in case_ids), case_ids
    assert len(set(case_ids)) == attempts, f"duplicate case ids: {case_ids}"

    # Each id must be persisted exactly once (no silent duplicate/overwrite).
    persisted = db.query(VerificationCase).filter(
        VerificationCase.case_id.in_(case_ids)).count()
    assert persisted == attempts
