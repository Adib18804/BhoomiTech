# -*- coding: utf-8 -*-
"""Phase 11E tests: demo / development scenario selector API.

Covers authentication, the full set of 12 active scenarios in display
order, absence of spoilers (no expected risk level or expected findings
in the list), per-scenario claim detail for form pre-fill, and that the
scenario identifiers actually resolve through the normal land search.
"""
from tests.conftest import scenario_by_id

FORBIDDEN_SPOILERS = ("expected_risk_level", "expected_findings",
                      "seller_claim")


def test_demo_scenarios_require_authentication(client):
    assert client.get("/api/demo/scenarios").status_code == 401


def test_demo_list_returns_all_12_in_order(client, citizen_headers):
    r = client.get("/api/demo/scenarios", headers=citizen_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["demo_mode"] is True
    scenarios = body["scenarios"]
    assert len(scenarios) == 12
    letters = [s["letter"] for s in scenarios]
    assert letters == ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
    # No spoilers in the list payload
    blob = r.text
    for spoiler in FORBIDDEN_SPOILERS:
        assert spoiler not in blob, f"spoiler exposed in demo list: {spoiler}"
    for s in scenarios:
        assert s["parcel_id"] and s["parcel_id"].startswith("BT-PARCEL-")
        assert s["khatian_no"] and s["dag_no"]
        assert s["name_en"]


def test_demo_detail_includes_claim_for_prefill(client, citizen_headers):
    r = client.get("/api/demo/scenarios/SCENARIO_B", headers=citizen_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["demo_mode"] is True
    assert body["name_en"] == "Ownership Mismatch"
    claim = body["seller_claim"]
    assert claim["claimed_owner_name"]
    assert float(claim["claimed_share_decimal"]) > 0
    assert float(claim["claimed_sale_area_decimal"]) > 0


def test_demo_detail_unknown_scenario_404(client, citizen_headers):
    assert client.get("/api/demo/scenarios/SCENARIO_Z",
                      headers=citizen_headers).status_code == 404


def test_demo_scenario_identifiers_resolve_via_land_search(client, citizen_headers):
    """Selecting a scenario must lead to a real parcel via normal search."""
    scenario = scenario_by_id("SCENARIO_D")
    r = client.post("/api/land/search", json={
        "district": scenario["district"],
        "upazila": scenario["upazila"],
        "mouza": scenario["mouza"],
        "survey_type": scenario["survey_type"],
        "khatian_no": scenario["khatian_no"],
        "dag_no": scenario["dag_no"],
    }, headers=citizen_headers)
    assert r.status_code == 200, r.text
    assert r.json()["parcel"]["parcel_id"] == scenario["parcel_id"]
