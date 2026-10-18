# -*- coding: utf-8 -*-
"""
Phase 9 verification: API rate limiting.

Executed against the LIVE HTTP API on http://localhost:8000.

Usage:
  python verify_phase9_ratelimit.py a   # unit tests + admin-login/forgot/register/verification scopes
  python verify_phase9_ratelimit.py b   # citizen login scope - run "a", RESTART the server, then "b"
                                        # (the restart gives the login scope a fresh budget)

Part A - Unit level (in-process, deterministic):
  U1 SlidingWindowRateLimiter allows the first N hits then blocks, with a
     positive Retry-After.
  U2 Expired window entries are discarded, so the budget recovers after the
     window passes.
  U3 reset() clears counters.

Part A - HTTP level (each protected scope has an independent budget):
  H4 admin/login: wrong-password requests 1..10 -> 401, request 11 -> 429;
     Phase 8 lockout underneath still engages (attempts>=5, locked_until set).
  H2 forgot-password: requests 1..10 -> 200, request 11 -> 429.
  H3 register: duplicate-registration requests 1..10 -> 400, request 11 -> 429.
  H1 verification: first RATE_LIMIT_VERIFICATION_PER_MINUTE POST /check requests
     pass the limiter (404 unknown parcel - the limiter runs BEFORE the endpoint
     body and its hits still count), the next request returns 429 with
     Retry-After; the shared verification scope also blocks GET /{case_id}.

Part B - HTTP level (fresh login scope after server restart):
  H5 login: wrong-password requests 1..10 -> 401, request 11 -> 429; a
     CORRECT-password request is ALSO 429 (limiter is credential-agnostic);
     Phase 8 lockout still engaged at attempt 5.
  H6 endpoints outside the five protected scopes are NOT limited
     (/health, GET /api/locations/districts).
"""
import sys
import time as _time
from collections import deque

import httpx
from sqlalchemy import create_engine, text

from app.core.config import settings
from app.core.rate_limit import SlidingWindowRateLimiter

BASE = "http://localhost:8000/api"
CITIZEN_EMAIL = "citizen1@example.com"
CITIZEN_PASSWORD = "Citizen@2026"
ADMIN_EMAIL = "admin1@bhoomitech.example"
WRONG = "DefinitelyWrong@2026"
AUTH_LIMIT = settings.RATE_LIMIT_AUTH_PER_MINUTE
VER_LIMIT = settings.RATE_LIMIT_VERIFICATION_PER_MINUTE

engine = create_engine(settings.DATABASE_URL)
results = []


def record(check, passed, detail):
    results.append((check, passed, detail))
    print(f"[{'PASS' if passed else 'FAIL'}] {check}: {detail}")


def reset_user(email):
    with engine.begin() as c:
        c.execute(text("UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE email=:e"),
                  {"e": email})


def user_state(email):
    with engine.connect() as c:
        return c.execute(text("SELECT failed_login_attempts, locked_until FROM users WHERE email=:e"),
                         {"e": email}).fetchone()


def part_a():
    # ---------------------------------------------------------- unit level
    print("=" * 78)
    print("PART A1: UNIT - SlidingWindowRateLimiter")
    print("=" * 78)

    limiter = SlidingWindowRateLimiter()
    seq = [limiter.check("unit", 3) for _ in range(4)]
    record("U1 allows N then blocks", seq[0][0] and seq[1][0] and seq[2][0] and not seq[3][0],
           f"results={[(ok, ra) for ok, ra in seq]}")
    record("U1 Retry-After positive on block", seq[3][1] >= 1, f"retry_after={seq[3][1]}s")

    with limiter._lock:
        limiter._hits["expiry"] = deque([_time.monotonic() - 120.0, _time.monotonic() - 119.0])
    ok, _ra = limiter.check("expiry", 3)
    record("U2 expired entries discarded, budget recovers", ok, f"allowed={ok}")

    limiter.reset()
    ok, _ = limiter.check("unit", 3)
    record("U3 reset() clears counters", ok, f"allowed after reset={ok}")

    # ---------------------------------------------------------- HTTP level
    print("=" * 78)
    print("PART A2: HTTP - admin-login / forgot-password / register / verification scopes")
    print("=" * 78)

    client = httpx.Client(base_url=BASE, timeout=20)

    # --- H4: admin/login scope (fresh budget) ---
    statuses = [client.post("/auth/admin/login", json={"email": ADMIN_EMAIL, "password": WRONG}).status_code
                for _ in range(AUTH_LIMIT + 2)]
    st = user_state(ADMIN_EMAIL)
    record(f"H4 admin/login: {AUTH_LIMIT} x 401 then 429",
           statuses[:AUTH_LIMIT] == [401] * AUTH_LIMIT and statuses[AUTH_LIMIT] == 429,
           f"statuses={statuses}")
    record("H4 Phase 8 lockout still engaged beneath the limiter",
           st[0] >= 5 and st[1] is not None,
           f"attempts={st[0]}, locked_until={st[1]}")
    reset_user(ADMIN_EMAIL)

    # --- H2: forgot-password scope (fresh budget) ---
    statuses = [client.post("/auth/forgot-password", json={"email": "someone@example.com"}).status_code
                for _ in range(AUTH_LIMIT + 2)]
    record(f"H2 forgot-password: {AUTH_LIMIT} x 200 then 429",
           statuses[:AUTH_LIMIT] == [200] * AUTH_LIMIT and statuses[AUTH_LIMIT] == 429,
           f"statuses={statuses}")

    # --- H3: register scope (fresh budget) ---
    body = {"full_name": "Rate Limit Test", "email": CITIZEN_EMAIL,
            "password": CITIZEN_PASSWORD, "confirm_password": CITIZEN_PASSWORD}
    statuses = [client.post("/auth/register", json=body).status_code for _ in range(AUTH_LIMIT + 2)]
    record(f"H3 register: {AUTH_LIMIT} x 400 (duplicate email) then 429",
           statuses[:AUTH_LIMIT] == [400] * AUTH_LIMIT and statuses[AUTH_LIMIT] == 429,
           f"statuses={statuses}")

    # --- H1: verification scope (fresh budget). Token comes from citizen
    # login; the login bucket has 1 hit, which is irrelevant because Part B
    # (login flood) runs only after a server restart. ---
    r = client.post("/auth/login", json={"email": CITIZEN_EMAIL, "password": CITIZEN_PASSWORD})
    record("H1 pre: citizen login for token", r.status_code == 200, f"status={r.status_code}")
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # A schema-valid body so the request reaches the endpoint (404 unknown
    # parcel). Malformed bodies are covered too: dependencies run before body
    # validation, so even 422 responses consume budget.
    bad_body = {"parcel_id": "BT-DOES-NOT-EXIST",
                "seller_claim": {"claimed_owner_name": "Test", "claimed_share_decimal": 50,
                                 "claimed_sale_area_decimal": 25}}
    statuses = [client.post("/verification/check", json=bad_body, headers=headers).status_code
                for _ in range(VER_LIMIT)]
    r_next = client.post("/verification/check", json=bad_body, headers=headers)
    record(f"H1 first {VER_LIMIT} /check pass the limiter (404 unknown parcel; hits still count)",
           all(s == 404 for s in statuses),
           f"distinct statuses={sorted(set(statuses))}")
    record("H1 limit exceeded -> 429 with Retry-After",
           r_next.status_code == 429 and int(r_next.headers.get("retry-after", "0")) >= 1,
           f"status={r_next.status_code}, retry-after={r_next.headers.get('retry-after')}, "
           f"detail='{r_next.json().get('detail', '')[:55]}'")
    r_get = client.get("/verification/BOGUS-CASE", headers=headers)
    record("H1 shared verification scope also blocks GET /{case_id}", r_get.status_code == 429,
           f"status={r_get.status_code}")


def part_b():
    print("=" * 78)
    print("PART B: HTTP - citizen login scope (server freshly restarted)")
    print("=" * 78)

    client = httpx.Client(base_url=BASE, timeout=20)

    statuses = [client.post("/auth/login", json={"email": CITIZEN_EMAIL, "password": WRONG}).status_code
                for _ in range(AUTH_LIMIT + 2)]
    record(f"H5 login: {AUTH_LIMIT} x 401 then 429",
           statuses[:AUTH_LIMIT] == [401] * AUTH_LIMIT and statuses[AUTH_LIMIT] == 429,
           f"statuses={statuses}")

    r = client.post("/auth/login", json={"email": CITIZEN_EMAIL, "password": CITIZEN_PASSWORD})
    record("H5 correct password ALSO 429 while limited (credential-agnostic)",
           r.status_code == 429, f"status={r.status_code}")

    st = user_state(CITIZEN_EMAIL)
    record("H5 Phase 8 lockout still engaged beneath the limiter",
           st[0] >= 5 and st[1] is not None,
           f"attempts={st[0]}, locked_until={st[1]}")
    reset_user(CITIZEN_EMAIL)

    # --- H6: endpoints outside the five protected scopes are not limited ---
    r_health = httpx.get("http://localhost:8000/health", timeout=10)
    r_loc = client.get("/locations/districts")
    record("H6 /health not rate limited", r_health.status_code == 200, f"status={r_health.status_code}")
    record("H6 GET /api/locations/districts not rate limited", r_loc.status_code == 200,
           f"status={r_loc.status_code}")


def summarize():
    failed = [r for r in results if not r[1]]
    print("=" * 78)
    print(f"RESULT (part '{part}'): {len(results) - len(failed)}/{len(results)} checks passed")
    with open("phase9_results.txt", "a", encoding="utf-8") as f:
        f.write(f"--- run part {part} at {_time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        for check, passed, detail in results:
            f.write(f"[{'PASS' if passed else 'FAIL'}] {check}: {detail}\n")
    if failed:
        print("FAILED CHECKS:")
        for check, _, detail in failed:
            print(f"  - {check}: {detail}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    part = sys.argv[1] if len(sys.argv) > 1 else "a"
    if part == "a":
        part_a()
    elif part == "b":
        part_b()
    else:
        print("usage: verify_phase9_ratelimit.py [a|b]")
        sys.exit(2)
    summarize()
