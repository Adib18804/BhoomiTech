# -*- coding: utf-8 -*-
"""Security tests:
- object-level authorization on GET /verification/{case_id} (Phase 4 RBAC:
  owner allowed, non-owner denied, admin/super-admin allowed, unauthenticated
  denied),
- no password_hash or other credential material in any API response,
- rate limiting returns 429 (Phase 9),
- lockout records a high-severity security event (Phase 8).
"""
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from tests.conftest import (
    ADMIN_EMAIL, CITIZEN_EMAIL, CITIZEN_PASSWORD, check_request_body,
    login, scenario_by_id, unique_email,
)

FORBIDDEN_RESPONSE_FRAGMENTS = (
    "password_hash", "argon2", "$argon2id",
)


def _create_case(client, headers, scenario):
    r = client.post("/api/verification/check", json=check_request_body(scenario), headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["case_id"]


def _assert_no_credentials(payload_text):
    lowered = payload_text.lower()
    for fragment in FORBIDDEN_RESPONSE_FRAGMENTS:
        assert fragment not in lowered, f"leaked credential material: {fragment}"


# ---------------------------------------------- object-level authorization
def test_verification_detail_unauthenticated_denied(client, citizen_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    assert client.get(f"/api/verification/{case_id}").status_code == 401


def test_verification_detail_owner_allowed(client, citizen_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    r = client.get(f"/api/verification/{case_id}", headers=citizen_headers)
    assert r.status_code == 200
    assert r.json()["case_id"] == case_id


def test_verification_detail_non_owner_denied(client, citizen_headers, citizen2_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    assert client.get(f"/api/verification/{case_id}",
                      headers=citizen2_headers).status_code == 403


def test_verification_detail_admin_allowed(client, citizen_headers, admin_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    assert client.get(f"/api/verification/{case_id}",
                      headers=admin_headers).status_code == 200


def test_verification_detail_super_admin_allowed(client, citizen_headers, super_admin_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    assert client.get(f"/api/verification/{case_id}",
                      headers=super_admin_headers).status_code == 200


def test_verification_detail_unknown_case_404(client, admin_headers):
    assert client.get("/api/verification/BT-VER-NOPE",
                      headers=admin_headers).status_code == 404


# ------------------------------------------------- no credential exposure
def test_no_password_hash_in_auth_responses(client):
    """Login, register and /me responses must never contain credentials."""
    r_login = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r_login.status_code == 200
    _assert_no_credentials(r_login.text)

    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r_me = client.get("/api/auth/me", headers=headers)
    assert r_me.status_code == 200
    _assert_no_credentials(r_me.text)

    email = unique_email("sectest")
    try:
        r_reg = client.post("/api/auth/register", json={
            "full_name": "Sec Test", "email": email,
            "password": "Test@2026pass", "confirm_password": "Test@2026pass",
        })
        assert r_reg.status_code == 201
        _assert_no_credentials(r_reg.text)
    finally:
        with engine.begin() as conn:
            conn.execute(text("UPDATE users SET is_active=false WHERE email=:e"), {"e": email})


def test_no_password_hash_in_verification_detail(client, citizen_headers):
    case_id = _create_case(client, citizen_headers, scenario_by_id("SCENARIO_A"))
    r = client.get(f"/api/verification/{case_id}", headers=citizen_headers)
    assert r.status_code == 200
    _assert_no_credentials(r.text)


# ------------------------------------------------------------- rate limiting
def test_login_rate_limited_after_threshold(client):
    """The 11th login attempt within a minute is rejected with 429."""
    for _ in range(settings.RATE_LIMIT_AUTH_PER_MINUTE):
        r = login(client, CITIZEN_EMAIL, "WrongPassword@1")
        assert r.status_code == 401
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 429
    assert int(r.headers["retry-after"]) >= 1


def test_lockout_writes_security_event(client):
    for _ in range(settings.LOGIN_MAX_FAILED_ATTEMPTS):
        login(client, CITIZEN_EMAIL, "WrongPassword@1")
    with engine.connect() as conn:
        events = conn.execute(
            text("SELECT severity FROM security_events "
                 "WHERE event_type='account_locked' AND email=:e "
                 "ORDER BY created_at DESC LIMIT 1"),
            {"e": CITIZEN_EMAIL}).scalar()
    assert events == "high"
