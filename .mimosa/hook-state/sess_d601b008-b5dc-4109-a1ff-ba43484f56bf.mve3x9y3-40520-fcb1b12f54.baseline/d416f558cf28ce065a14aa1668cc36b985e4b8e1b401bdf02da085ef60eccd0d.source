# -*- coding: utf-8 -*-
"""Phase 11C tests: admin dashboard API.

Covers RBAC (citizens denied, admins allowed, super admins allowed), real
aggregation, privacy (no credential/lockout fields anywhere in the payload),
and system health reporting.
"""
import json

from tests.conftest import check_request_body, scenario_by_id, CITIZEN_EMAIL

FORBIDDEN_FRAGMENTS = (
    "password_hash", "argon2", "locked_until", "failed_login_attempts",
)


def test_admin_dashboard_requires_authentication(client):
    assert client.get("/api/dashboard/admin").status_code == 401


def test_admin_dashboard_denies_citizens(client, citizen_headers):
    assert client.get("/api/dashboard/admin",
                      headers=citizen_headers).status_code == 403


def test_admin_dashboard_allows_admin(client, admin_headers):
    r = client.get("/api/dashboard/admin", headers=admin_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["totals"]["total_citizens"] >= 1
    assert body["totals"]["total_cases"] >= 1
    assert body["totals"]["total_parcels"] >= 1
    assert sum(body["risk_distribution"].values()) >= 1
    assert body["system_health"]["database"] == "connected"
    assert body["system_health"]["environment"] == "synthetic-demo"


def test_admin_dashboard_allows_super_admin(client, super_admin_headers):
    r = client.get("/api/dashboard/admin", headers=super_admin_headers)
    assert r.status_code == 200
    assert r.json()["totals"]["total_cases"] >= 1


def test_admin_dashboard_reflects_verification_activity(client, citizen_headers,
                                                        admin_headers):
    scenario = scenario_by_id("SCENARIO_B")
    created = client.post("/api/verification/check",
                          json=check_request_body(scenario), headers=citizen_headers)
    assert created.status_code == 200
    case_id = created.json()["case_id"]

    r = client.get("/api/dashboard/admin", headers=admin_headers)
    body = r.json()
    recent_ids = [c["case_id"] for c in body["recent_cases"]]
    assert case_id in recent_ids
    # Recent activity carries land identifiers but NOT citizen identity
    for c in body["recent_cases"]:
        assert "user_id" not in c
        assert "email" not in c
        assert "full_name" not in c
        assert c["khatian_no"] and c["dag_no"]


def test_admin_dashboard_never_exposes_secrets(client, admin_headers):
    """No hashes, lockout counters or private citizen identity anywhere.

    The attempted-login email inside a security-event description is the
    account being targeted - necessary security-triage information for the
    authorized admin - so it is allowed ONLY in that section."""
    for _ in range(2):
        client.post("/api/auth/login", json={
            "email": "citizen1@example.com", "password": "WrongPassword!"})
    r = client.get("/api/dashboard/admin", headers=admin_headers)
    assert r.status_code == 200
    blob = r.text.lower()
    for fragment in FORBIDDEN_FRAGMENTS:
        assert fragment not in blob, f"secret exposed: {fragment}"

    body = json.loads(r.text)
    non_event_payload = json.dumps(
        {k: v for k, v in body.items() if k != "recent_security_events"})
    assert CITIZEN_EMAIL not in non_event_payload


def test_admin_dashboard_security_events_present(client, admin_headers):
    """Failed logins raise security events; the admin sees minimal fields."""
    client.post("/api/auth/login", json={
        "email": "citizen1@example.com", "password": "WrongPassword!"})
    r = client.get("/api/dashboard/admin", headers=admin_headers)
    events = r.json()["recent_security_events"]
    assert events, "expected at least one recent security event"
    for e in events:
        assert e["event_type"] and e["severity"]
        assert "user_id" not in e
        assert "email" not in e
