# -*- coding: utf-8 -*-
"""Authentication tests: registration, login, invalid credentials, RBAC,
account lockout (Phase 8)."""
import pytest
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from tests.conftest import (
    ADMIN_EMAIL, ADMIN_PASSWORD, CITIZEN_EMAIL, CITIZEN_PASSWORD,
    login, unique_email,
)


# ---------------------------------------------------------------- registration
def test_register_new_user_returns_201_and_token(client):
    email = unique_email()
    r = client.post("/api/auth/register", json={
        "full_name": "Pytest New User", "email": email,
        "password": "Test@2026pass", "confirm_password": "Test@2026pass",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == email
    assert body["user"]["role"] == "citizen"
    _deactivate_test_user(email)


def test_register_duplicate_email_rejected(client):
    payload = {
        "full_name": "Duplicate", "email": CITIZEN_EMAIL,
        "password": CITIZEN_PASSWORD, "confirm_password": CITIZEN_PASSWORD,
    }
    assert client.post("/api/auth/register", json=payload).status_code == 400


def test_register_password_mismatch_rejected(client):
    r = client.post("/api/auth/register", json={
        "full_name": "Mismatch", "email": unique_email(),
        "password": "Test@2026pass", "confirm_password": "Different@2026",
    })
    assert r.status_code == 422


def test_register_invalid_email_rejected(client):
    r = client.post("/api/auth/register", json={
        "full_name": "Bad Email", "email": "not-an-email",
        "password": "Test@2026pass", "confirm_password": "Test@2026pass",
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------- login
def test_login_success_returns_token(client):
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == CITIZEN_EMAIL


def test_login_wrong_password_generic_message(client):
    r = login(client, CITIZEN_EMAIL, "WrongPassword@1")
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect email or password"


def test_login_nonexistent_email_same_generic_message(client):
    """The response for an unknown email must be identical to the response for
    a wrong password on an existing account (no account enumeration)."""
    r_known = login(client, CITIZEN_EMAIL, "WrongPassword@1")
    r_unknown = login(client, "ghost@example.com", "WrongPassword@1")
    assert r_unknown.status_code == 401
    assert r_known.json()["detail"] == r_unknown.json()["detail"]


def test_me_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user_without_password(client, citizen_headers):
    r = client.get("/api/auth/me", headers=citizen_headers)
    assert r.status_code == 200
    assert r.json()["email"] == CITIZEN_EMAIL
    assert "password" not in r.text.lower()


# ------------------------------------------------------------------- lockout
def test_lockout_engages_at_threshold(client):
    """5 consecutive wrong passwords lock the account (Phase 8)."""
    for i in range(settings.LOGIN_MAX_FAILED_ATTEMPTS):
        r = login(client, CITIZEN_EMAIL, "WrongPassword@1")
        assert r.status_code == 401
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 401
    assert "temporarily locked" in r.json()["detail"]
    with engine.connect() as conn:
        attempts, locked_until = conn.execute(
            text("SELECT failed_login_attempts, locked_until FROM users WHERE email=:e"),
            {"e": CITIZEN_EMAIL}).fetchone()
    assert attempts == settings.LOGIN_MAX_FAILED_ATTEMPTS
    assert locked_until is not None


def test_lockout_clears_after_expiry(client):
    """Once the lock window passes, the correct password works again."""
    for _ in range(settings.LOGIN_MAX_FAILED_ATTEMPTS):
        login(client, CITIZEN_EMAIL, "WrongPassword@1")
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET locked_until = NOW() - INTERVAL '1 second' "
                          "WHERE email=:e"), {"e": CITIZEN_EMAIL})
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 200
    with engine.connect() as conn:
        attempts, locked_until = conn.execute(
            text("SELECT failed_login_attempts, locked_until FROM users WHERE email=:e"),
            {"e": CITIZEN_EMAIL}).fetchone()
    assert attempts == 0 and locked_until is None


def test_successful_login_resets_counter(client):
    login(client, CITIZEN_EMAIL, "WrongPassword@1")
    login(client, CITIZEN_EMAIL, "WrongPassword@1")
    assert login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD).status_code == 200
    with engine.connect() as conn:
        attempts, locked_until = conn.execute(
            text("SELECT failed_login_attempts, locked_until FROM users WHERE email=:e"),
            {"e": CITIZEN_EMAIL}).fetchone()
    assert attempts == 0 and locked_until is None


# ---------------------------------------------------------------------- RBAC
def test_admin_login_rejects_citizen(client):
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD, admin=True)
    assert r.status_code == 403


def test_admin_login_accepts_admin_role(client):
    r = login(client, ADMIN_EMAIL, ADMIN_PASSWORD, admin=True)
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"


def test_admin_login_wrong_password_generic_message(client):
    r = login(client, ADMIN_EMAIL, "WrongPassword@1", admin=True)
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect credentials"


def _deactivate_test_user(email):
    """Deactivate users created by tests so they never appear in normal flows."""
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET is_active = false WHERE email = :e"), {"e": email})
