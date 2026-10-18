# -*- coding: utf-8 -*-
"""Phase 11D tests: super-admin application administration.

Covers strict RBAC (citizens AND plain admins denied), user management,
account status and role management with self-protection guards, audit
logging of mutations, settings read/update, and secret non-exposure.
"""
import uuid

import pytest

from tests.conftest import unique_email

FORBIDDEN_FRAGMENTS = ("password_hash", "argon2", "failed_login_attempts",
                       "locked_until", "SuperAdmin@2026")


@pytest.fixture()
def fresh_citizen(client, db):
    """A uniquely-named active citizen created directly via the API."""
    from app.core.security import hash_password
    from app.models import User
    user = User(
        email=unique_email("sa-manage"),
        full_name="Super Admin Test Citizen",
        password_hash=hash_password("Citizen@2026"),
        role="citizen",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


# ------------------------------------------------------------------- RBAC
def test_superadmin_requires_authentication(client):
    assert client.get("/api/superadmin/users").status_code == 401


def test_superadmin_denies_citizens(client, citizen_headers):
    assert client.get("/api/superadmin/users",
                      headers=citizen_headers).status_code == 403


def test_superadmin_denies_plain_admins(client, admin_headers):
    """Admins must NOT automatically receive super-admin permissions."""
    for path in ("/api/superadmin/users", "/api/superadmin/audit-logs",
                 "/api/superadmin/settings"):
        assert client.get(path, headers=admin_headers).status_code == 403
    assert client.put("/api/superadmin/users/1/status", json={"is_active": False},
                      headers=admin_headers).status_code == 403
    assert client.put("/api/superadmin/users/1/role", json={"role": "admin"},
                      headers=admin_headers).status_code == 403


def test_superadmin_allows_super_admin(client, super_admin_headers):
    r = client.get("/api/superadmin/users", headers=super_admin_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["totals"]["all"] >= 1
    assert body["totals"]["super_admin"] >= 1
    assert body["users"], "expected seeded users in the list"


# --------------------------------------------------------- user management
def test_user_list_never_exposes_secrets(client, super_admin_headers):
    r = client.get("/api/superadmin/users", headers=super_admin_headers)
    blob = r.text.lower()
    for fragment in FORBIDDEN_FRAGMENTS:
        assert fragment not in blob, f"secret exposed: {fragment}"
    for u in r.json()["users"]:
        assert set(u.keys()) == {
            "id", "email", "full_name", "role", "is_active", "is_verified",
            "preferred_language", "created_at", "last_login_at", "is_locked"}


def test_user_list_filters(client, super_admin_headers):
    admins = client.get("/api/superadmin/users?role=admin",
                        headers=super_admin_headers).json()
    assert admins["users"]
    assert all(u["role"] == "admin" for u in admins["users"])
    found = client.get("/api/superadmin/users?q=citizen1",
                       headers=super_admin_headers).json()
    assert any("citizen1@example.com" == u["email"] for u in found["users"])


# --------------------------------------------------------- account status
def test_deactivate_and_reactivate_account(client, super_admin_headers, fresh_citizen):
    uid = fresh_citizen.id
    r = client.put(f"/api/superadmin/users/{uid}/status",
                   json={"is_active": False}, headers=super_admin_headers)
    assert r.status_code == 200, r.text
    assert r.json()["is_active"] is False

    # A deactivated account cannot log in anymore
    login = client.post("/api/auth/login", json={
        "email": fresh_citizen.email, "password": "Citizen@2026"})
    assert login.status_code == 403

    # Reactivate
    r = client.put(f"/api/superadmin/users/{uid}/status",
                   json={"is_active": True}, headers=super_admin_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is True
    login = client.post("/api/auth/login", json={
        "email": fresh_citizen.email, "password": "Citizen@2026"})
    assert login.status_code == 200


def test_super_admin_cannot_deactivate_themselves(client, super_admin_headers):
    me = client.get("/api/superadmin/users?q=superadmin@bhoomitech.example",
                    headers=super_admin_headers).json()["users"][0]
    r = client.put(f"/api/superadmin/users/{me['id']}/status",
                   json={"is_active": False}, headers=super_admin_headers)
    assert r.status_code == 400


def test_status_change_unknown_user_404(client, super_admin_headers):
    assert client.put("/api/superadmin/users/999999/status",
                      json={"is_active": False},
                      headers=super_admin_headers).status_code == 404


# --------------------------------------------------------- role management
def test_role_change_and_audit_trail(client, super_admin_headers, fresh_citizen):
    uid = fresh_citizen.id
    r = client.put(f"/api/superadmin/users/{uid}/role",
                   json={"role": "admin"}, headers=super_admin_headers)
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "admin"

    # Invalid role rejected
    bad = client.put(f"/api/superadmin/users/{uid}/role",
                     json={"role": "ministry_official"},
                     headers=super_admin_headers)
    assert bad.status_code == 422

    # The mutation is recorded in the audit trail
    logs = client.get("/api/superadmin/audit-logs?limit=50",
                      headers=super_admin_headers).json()
    role_changes = [l for l in logs if l["action_type"] == "admin_role_change"
                    and l["resource_id"] == str(uid)]
    assert role_changes, "expected an admin_role_change audit entry"

    # Revert to citizen for fixture cleanliness
    client.put(f"/api/superadmin/users/{uid}/role",
               json={"role": "citizen"}, headers=super_admin_headers)


def test_super_admin_cannot_change_own_role(client, super_admin_headers):
    me = client.get("/api/superadmin/users?q=superadmin@bhoomitech.example",
                    headers=super_admin_headers).json()["users"][0]
    r = client.put(f"/api/superadmin/users/{me['id']}/role",
                   json={"role": "citizen"}, headers=super_admin_headers)
    assert r.status_code == 400


# ------------------------------------------------- audit logs and settings
def test_audit_logs_shape(client, super_admin_headers):
    logs = client.get("/api/superadmin/audit-logs?limit=10",
                      headers=super_admin_headers)
    assert logs.status_code == 200
    body = logs.json()
    assert isinstance(body, list) and body
    for entry in body:
        assert entry["action_type"]
        assert "password" not in json_lower(entry)


def json_lower(entry) -> str:
    import json as _json
    return _json.dumps(entry).lower()


def test_settings_read_and_update(client, super_admin_headers):
    settings = client.get("/api/superadmin/settings",
                          headers=super_admin_headers)
    assert settings.status_code == 200
    body = settings.json()
    assert len(body) >= 3
    key = body[0]["key"]

    r = client.put(f"/api/superadmin/settings/{key}",
                   json={"value": body[0]["value"]},
                   headers=super_admin_headers)
    assert r.status_code == 200, r.text

    assert client.put("/api/superadmin/settings/nope.missing",
                      json={"value": "x"},
                      headers=super_admin_headers).status_code == 404


def test_setting_change_audited(client, super_admin_headers):
    settings = client.get("/api/superadmin/settings",
                          headers=super_admin_headers).json()
    target = next(s for s in settings if s["is_editable"])
    client.put(f"/api/superadmin/settings/{target['key']}",
               json={"value": target["value"]}, headers=super_admin_headers)
    logs = client.get("/api/superadmin/audit-logs?limit=20",
                      headers=super_admin_headers).json()
    assert any(l["action_type"] == "admin_setting_change"
               and l["resource_id"] == target["key"] for l in logs)
