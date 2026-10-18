# -*- coding: utf-8 -*-
"""Shared pytest fixtures for the BhoomiTech backend test suite.

Tests run against the REAL PostgreSQL/PostGIS database configured via
.env (DATABASE_URL) and exercise the FastAPI app in-process via TestClient.

Prerequisites (not created by the tests themselves):
  1. Postgres+PostGIS running (Docker container bhoomitech-db)
  2. alembic upgrade head   (schema at latest revision)
  3. python -m app.services.seed_data   (reference + demo scenario data)

Behavior notes:
- The in-memory rate limiter is reset before every test so limits never leak
  between tests; a dedicated test exercises the limit itself.
- Lockout state mutated by tests is reset after every test (autouse fixture).
- Registration tests create uniquely-named users; the shared fixture accounts
  (citizen1/admin1) are restored to a clean lockout state, not deleted.
"""
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from main import app
from app.core.config import settings
from app.core.rate_limit import rate_limiter
from app.db.session import SessionLocal, engine
from app.models import DemoScenario

CITIZEN_EMAIL = "citizen1@example.com"
CITIZEN_PASSWORD = "Citizen@2026"
CITIZEN2_EMAIL = "citizen2@example.com"
ADMIN_EMAIL = "admin1@bhoomitech.example"
ADMIN_PASSWORD = "Admin@2026"
SUPER_ADMIN_EMAIL = "superadmin@bhoomitech.example"
SUPER_ADMIN_PASSWORD = "SuperAdmin@2026"


# --------------------------------------------------------------------------
# Database availability guard: fail early with a clear message, not a deep
# traceback, when Postgres is not running or the seed is missing.
# --------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def seeded_database():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - environment problem
        pytest.exit(
            f"\nFATAL: cannot reach the database ({settings.DATABASE_URL}).\n"
            f"Start the Postgres+PostGIS container and run 'alembic upgrade head' first.\n"
            f"Underlying error: {exc}",
            returncode=3,
        )
    with engine.connect() as conn:
        n_scenarios = conn.execute(text("SELECT COUNT(*) FROM demo_scenarios")).scalar()
        n_users = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
    if not n_scenarios or not n_users:
        pytest.exit(
            "\nFATAL: database is not seeded. Run 'python -m app.services.seed_data' first.",
            returncode=3,
        )


# --------------------------------------------------------------------------
# App client with an isolated rate limiter per test.
# --------------------------------------------------------------------------
@pytest.fixture()
def client():
    rate_limiter.reset()
    with TestClient(app) as c:
        yield c
    rate_limiter.reset()


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def restore_lockout_state():
    """Keep login-security mutations from leaking between tests."""
    yield
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET failed_login_attempts=0, locked_until=NULL "
                 "WHERE email IN (:a, :b, :c, :d)"),
            {"a": CITIZEN_EMAIL, "b": CITIZEN2_EMAIL, "c": ADMIN_EMAIL, "d": SUPER_ADMIN_EMAIL},
        )


# --------------------------------------------------------------------------
# Auth token helpers/fixtures.
# --------------------------------------------------------------------------
def login(client, email, password, admin=False):
    path = "/api/auth/admin/login" if admin else "/api/auth/login"
    return client.post(path, json={"email": email, "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def citizen_headers(client):
    r = login(client, CITIZEN_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 200, f"citizen login failed: {r.status_code} {r.text}"
    return bearer(r.json()["access_token"])


@pytest.fixture()
def citizen2_headers(client):
    r = login(client, CITIZEN2_EMAIL, CITIZEN_PASSWORD)
    assert r.status_code == 200, f"citizen2 login failed: {r.status_code} {r.text}"
    return bearer(r.json()["access_token"])


@pytest.fixture()
def admin_headers(client):
    r = login(client, ADMIN_EMAIL, ADMIN_PASSWORD, admin=True)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return bearer(r.json()["access_token"])


@pytest.fixture()
def super_admin_headers(client):
    r = login(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, admin=True)
    assert r.status_code == 200, f"super admin login failed: {r.status_code} {r.text}"
    return bearer(r.json()["access_token"])


# --------------------------------------------------------------------------
# Demo scenarios (loaded from the database by scenario_id - never by index).
# --------------------------------------------------------------------------
def load_scenarios():
    session = SessionLocal()
    try:
        rows = session.query(DemoScenario).order_by(DemoScenario.display_order).all()
        return [
            {
                "scenario_id": s.scenario_id,
                "parcel_id": s.parcel_id,
                "expected_risk_level": s.expected_risk_level,
                "district": s.district_name,
                "upazila": s.upazila_name,
                "mouza": s.mouza_name,
                "survey_type": s.survey_type,
                "khatian_no": s.khatian_no,
                "dag_no": s.dag_no,
                "seller_claim": (s.expected_findings or {}).get("seller_claim", {}),
            }
            for s in rows
        ]
    finally:
        session.close()


def scenario_by_id(scenario_id):
    for s in load_scenarios():
        if s["scenario_id"] == scenario_id:
            return s
    raise AssertionError(f"Demo scenario {scenario_id} not found in database (seed missing?)")


@pytest.fixture()
def scenario_a():
    return scenario_by_id("SCENARIO_A")


def unique_email(prefix="pytest"):
    return f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"


def check_request_body(scenario):
    """Build a POST /api/verification/check body from a scenario row."""
    claim = scenario["seller_claim"]
    return {
        "parcel_id": scenario["parcel_id"],
        "seller_claim": {
            "claimed_owner_name": claim.get("claimed_owner_name", ""),
            "claimed_share_decimal": claim.get("claimed_share_decimal", 0),
            "claimed_sale_area_decimal": claim.get("claimed_sale_area_decimal", 0),
        },
    }
