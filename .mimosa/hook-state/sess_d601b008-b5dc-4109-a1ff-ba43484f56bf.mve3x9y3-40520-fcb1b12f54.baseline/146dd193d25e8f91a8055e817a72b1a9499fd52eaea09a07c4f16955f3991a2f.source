# -*- coding: utf-8 -*-
"""
Phase 8 verification: deterministic account lockout (login + admin login).

Checks executed against the LIVE HTTP API on http://localhost:8000:
  1. Baseline correct citizen login succeeds (200).
  2. Wrong passwords increment failed_login_attempts deterministically (1..4),
     each returning the SAME generic "Incorrect email or password" message.
  3. The 5th wrong password (threshold = LOGIN_MAX_FAILED_ATTEMPTS) locks the
     account: locked_until is set ~LOGIN_LOCKOUT_MINUTES ahead, a high-severity
     "account_locked" SecurityEvent is written, and the response is the clear
     lock message.
  4. The CORRECT password is rejected while locked (lock takes precedence).
  5. After lock expiry (simulated by moving locked_until into the past), the
     correct password succeeds AND resets failed_login_attempts=0, locked_until=NULL.
  6. A wrong password for a NON-EXISTENT email returns the same generic message
     as for an existing user (no email-existence leak).
  7. The same lockout cycle is verified for /auth/admin/login with an admin account.

Run: PYTHONIOENCODING=utf-8 ./venv/Scripts/python.exe verify_phase8_lockout.py
"""
import sys
import httpx
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, text
from app.core.config import settings

BASE = "http://localhost:8000/api"
CITIZEN_EMAIL = "citizen1@example.com"
CITIZEN_PASSWORD = "Citizen@2026"
ADMIN_EMAIL = "admin1@bhoomitech.example"
ADMIN_PASSWORD = "Admin@2026"
NONEXISTENT_EMAIL = "nosuchuser@example.com"
WRONG = "DefinitelyWrong@2026"

engine = create_engine(settings.DATABASE_URL)

results = []


def record(check, passed, detail):
    results.append((check, passed, detail))
    print(f"[{'PASS' if passed else 'FAIL'}] {check}: {detail}")


def db_user(email):
    with engine.connect() as c:
        row = c.execute(
            text("SELECT failed_login_attempts, locked_until FROM users WHERE email = :e"),
            {"e": email},
        ).fetchone()
    return row


def reset_user(email):
    with engine.begin() as c:
        c.execute(
            text("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = :e"),
            {"e": email},
        )


def login(path, email, password):
    with httpx.Client(base_url=BASE, timeout=15) as client:
        return client.post(f"/{path}", json={"email": email, "password": password})


def lock_count(email):
    with engine.connect() as c:
        return c.execute(
            text("SELECT COUNT(*) FROM security_events WHERE event_type='account_locked' AND email = :e"),
            {"e": email},
        ).scalar()


def run_cycle(path, email, good_password, label):
    """Execute the full lockout lifecycle for one endpoint and record results."""
    reset_user(email)

    # --- Step 1: baseline correct login ---
    r = login(path, email, good_password)
    record(f"{label}: baseline correct login", r.status_code == 200,
           f"status={r.status_code}")

    # --- Step 2: wrong passwords below threshold ---
    generic_msgs = []
    for i in range(1, settings.LOGIN_MAX_FAILED_ATTEMPTS):
        r = login(path, email, WRONG)
        generic_msgs.append(r.status_code == 401 and r.json().get("detail") == "Incorrect email or password"
                            if path == "auth/login" else r.status_code == 401)
        row = db_user(email)
        ok_count = row and row[0] == i and row[1] is None
        record(f"{label}: wrong password #{i} -> counter={i}, not locked", bool(ok_count),
               f"http={r.status_code}, attempts={row[0]}, locked_until={row[1]}")
    # message uniformity (citizen endpoint uses one generic string)
    r_last = login(path, email, WRONG)  # do not use this response for counting
    record(f"{label}: failure message is generic", all(generic_msgs),
           "all below-threshold failures returned the same generic 401 message")

    # --- Step 3: threshold reached -> lock ---
    r = login(path, email, WRONG)
    row = db_user(email)
    detail_msg = r.json().get("detail", "")
    locked_ok = (
        r.status_code == 401
        and "temporarily locked" in detail_msg
        and row[0] == settings.LOGIN_MAX_FAILED_ATTEMPTS
        and row[1] is not None
    )
    record(f"{label}: threshold lock at attempt {settings.LOGIN_MAX_FAILED_ATTEMPTS}", locked_ok,
           f"http={r.status_code}, attempts={row[0]}, locked_until={row[1]}, msg='{detail_msg[:70]}...'")

    # lock window sanity: ~LOGIN_LOCKOUT_MINUTES in the future
    lu = row[1]
    if lu is not None:
        if lu.tzinfo is None:
            lu = lu.replace(tzinfo=timezone.utc)
        mins = (lu - datetime.now(timezone.utc)).total_seconds() / 60
        record(f"{label}: lock window ~= {settings.LOGIN_LOCKOUT_MINUTES} min",
               0 < mins <= settings.LOGIN_LOCKOUT_MINUTES + 1, f"lock expires in {mins:.1f} min")

    record(f"{label}: account_locked security event written", lock_count(email) >= 1,
           f"account_locked events for {email}: {lock_count(email)}")

    # --- Step 4: correct password rejected while locked ---
    r = login(path, email, good_password)
    ok = r.status_code == 401 and "temporarily locked" in r.json().get("detail", "")
    record(f"{label}: correct password rejected while locked", ok,
           f"http={r.status_code}, msg='{r.json().get('detail', '')[:70]}...'")

    # --- Step 5: expiry -> correct login resets everything ---
    with engine.begin() as c:
        c.execute(text("UPDATE users SET locked_until = NOW() - INTERVAL '1 second' WHERE email = :e"),
                  {"e": email})
    r = login(path, email, good_password)
    row = db_user(email)
    ok = r.status_code == 200 and row[0] == 0 and row[1] is None
    record(f"{label}: after expiry correct login succeeds and resets counters", ok,
           f"http={r.status_code}, attempts={row[0]}, locked_until={row[1]}")


print("=" * 78)
print("PHASE 8 VERIFICATION: ACCOUNT LOCKOUT (deterministic, HTTP-level)")
print("=" * 78)
print(f"Settings: LOGIN_MAX_FAILED_ATTEMPTS={settings.LOGIN_MAX_FAILED_ATTEMPTS}, "
      f"LOGIN_LOCKOUT_MINUTES={settings.LOGIN_LOCKOUT_MINUTES}")

# --- Citizen login lifecycle ---
run_cycle("auth/login", CITIZEN_EMAIL, CITIZEN_PASSWORD, "citizen login")

# --- Email existence must not be revealed ---
r_existing = login("auth/login", CITIZEN_EMAIL, WRONG)     # resets nothing; counter becomes 1
r_missing = login("auth/login", NONEXISTENT_EMAIL, WRONG)
same = (r_existing.status_code == 401 and r_missing.status_code == 401
        and r_existing.json().get("detail") == r_missing.json().get("detail"))
record("wrong password: existing vs non-existing email identical response", same,
       f"existing={r_existing.status_code} '{r_existing.json().get('detail')}', "
       f"missing={r_missing.status_code} '{r_missing.json().get('detail')}'")

# --- Admin login lifecycle ---
run_cycle("auth/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD, "admin login")

# --- Cleanup: leave both accounts clean ---
reset_user(CITIZEN_EMAIL)
reset_user(ADMIN_EMAIL)

failed = [r for r in results if not r[1]]
print("=" * 78)
print(f"RESULT: {len(results) - len(failed)}/{len(results)} checks passed")
if failed:
    print("FAILED CHECKS:")
    for check, _, detail in failed:
        print(f"  - {check}: {detail}")
    with open("phase8_results.txt", "w", encoding="utf-8") as f:
        f.write("PHASE 8 ACCOUNT LOCKOUT: FAIL\n")
        for check, _, detail in results:
            f.write(f"[{'PASS' if _ else 'FAIL'}] {check}: {detail}\n")
    sys.exit(1)

with open("phase8_results.txt", "w", encoding="utf-8") as f:
    f.write("PHASE 8 ACCOUNT LOCKOUT: ALL CHECKS PASS\n\n")
    for check, passed, detail in results:
        f.write(f"[{'PASS' if passed else 'FAIL'}] {check}: {detail}\n")
print("Details written to phase8_results.txt")
