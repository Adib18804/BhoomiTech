# -*- coding: utf-8 -*-
"""Phase 11B tests: citizen dashboard API.

Covers real aggregation of the citizen's OWN data, privacy scoping
(no other citizen's cases leak in), and authentication.
"""
from tests.conftest import check_request_body, scenario_by_id


def _run_two_checks(client, headers):
    """Run checks on two different scenarios so aggregation has content."""
    results = []
    for sid in ("SCENARIO_A", "SCENARIO_E"):
        scenario = scenario_by_id(sid)
        r = client.post("/api/verification/check",
                        json=check_request_body(scenario), headers=headers)
        assert r.status_code == 200, r.text
        results.append((scenario, r.json()))
    return results


def test_citizen_dashboard_requires_authentication(client):
    assert client.get("/api/dashboard/citizen").status_code == 401


def test_citizen_dashboard_empty_state(client, citizen2_headers):
    """A fresh citizen gets zeros and empty lists - never someone else's data."""
    r = client.get("/api/dashboard/citizen", headers=citizen2_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["totals"]["total_cases"] == 0
    assert body["totals"]["total_reports"] == 0
    assert body["recent_cases"] == []
    assert body["recent_parcels"] == []
    assert body["latest_case"] is None
    assert set(body["risk_summary"].keys()) == {
        "LOW_CONCERN", "REVIEW_REQUIRED", "HIGH_ATTENTION",
        "CRITICAL_SIGNAL", "INSUFFICIENT_DATA"}


def test_citizen_dashboard_reflects_own_activity(client, citizen_headers):
    _run_two_checks(client, citizen_headers)
    r = client.get("/api/dashboard/citizen", headers=citizen_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["totals"]["total_cases"] >= 2
    assert body["totals"]["completed_cases"] >= 2
    assert sum(body["risk_summary"].values()) >= 2
    assert body["latest_case"] is not None
    assert body["latest_case"]["case_id"]
    assert len(body["recent_cases"]) >= 2
    # Case summaries expose land identifiers but never other users' info
    for case in body["recent_cases"]:
        assert case["khatian_no"] and case["dag_no"]
    # Land references carry public parcel ids and identifiers
    assert body["recent_parcels"], "expected at least one land reference"
    assert body["recent_parcels"][0]["parcel_id"].startswith("BT-PARCEL-")
    assert body["recent_parcels"][0]["district_name"]


def test_citizen_dashboard_privacy_between_citizens(client, citizen_headers,
                                                    citizen2_headers):
    """Cases run by citizen1 must never appear in citizen2's dashboard."""
    _run_two_checks(client, citizen_headers)
    r = client.get("/api/dashboard/citizen", headers=citizen2_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["totals"]["total_cases"] == 0
    assert body["recent_cases"] == []
    assert body["recent_parcels"] == []


def test_citizen_dashboard_counts_reports(client, citizen_headers):
    scenario, check = _run_two_checks(client, citizen_headers)[0]
    gen = client.post(f"/api/reports/case/{check['case_id']}", headers=citizen_headers)
    assert gen.status_code == 201
    r = client.get("/api/dashboard/citizen", headers=citizen_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["totals"]["total_reports"] >= 1
    flagged = [c for c in body["recent_cases"] if c["case_id"] == check["case_id"]]
    assert flagged and flagged[0]["has_report"] is True
