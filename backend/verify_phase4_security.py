"""
Phase 4 security test - GET /api/verification/{case_id}

Verifies:
  1. Citizen owns case       -> 200, safe payload
  2. Citizen does NOT own    -> 403
  3. Admin                   -> 200
  4. Super Admin             -> 200
  5. Unauthenticated         -> 401
  6. No credential/internal fields anywhere in the response body
     (password_hash, hashed_password, password, user_id, secret, token...)
"""

import sys
import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000"
FORBIDDEN_KEYS = {"password_hash", "hashed_password", "password", "secret", "token",
                  "access_token", "refresh_token", "failed_login_attempts", "locked_until"}
FORBIDDEN_SUBSTRINGS = ("password", "secret", "$argon2", "credential")


def http(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}


def login(email, password):
    status, body = http("POST", "/api/auth/login", body={"email": email, "password": password})
    if status != 200:
        print(f"[FAIL] login {email}: {status} {body}")
        sys.exit(1)
    return body["access_token"]


def walk_keys(value, prefix=""):
    """Yield every (key path, raw text) pair in a nested JSON structure."""
    if isinstance(value, dict):
        for k, v in value.items():
            yield f"{prefix}.{k}" if prefix else k, k, v
            yield from walk_keys(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from walk_keys(v, f"{prefix}[{i}]")
    else:
        yield prefix, "", value


def main():
    # Create a case as citizen (scenario B -> the check creates a case)
    citizen = login("citizen1@example.com", "Citizen@2026")
    status, body = http("POST", "/api/verification/check", token=citizen, body={
        "parcel_id": "BT-PARCEL-000002",
        "seller_claim": {
            "claimed_owner_name": "Ghulam Sakib",
            "claimed_share_decimal": 35.0,
            "claimed_sale_area_decimal": 17.5,
            "claimed_khatian": "342", "claimed_dag": "122", "claimed_survey_type": "RS",
        }})
    if status != 200:
        print(f"[FAIL] could not create verification case: {status} {body}")
        sys.exit(1)
    case_id = body["case_id"]
    print(f"[OK] Case created: {case_id}\n")

    # Other accounts
    citizen2_token = None
    admin = login("admin1@bhoomitech.example", "Admin@2026")
    superadm = login("superadmin@bhoomitech.example", "SuperAdmin@2026")

    # citizen2: register a fresh citizen that does NOT own the case
    status, body = http("POST", "/api/auth/register", body={
        "full_name": "Other Citizen", "email": "other-citizen@example.com",
        "password": "OtherCitizen@2026", "confirm_password": "OtherCitizen@2026",
        "phone": "01700000001"})
    if status in (200, 201):
        citizen2_token = login("other-citizen@example.com", "OtherCitizen@2026")
        print("[OK] Second citizen registered")
    else:
        # already registered from a previous run
        citizen2_token = login("other-citizen@example.com", "OtherCitizen@2026")
        print("[OK] Second citizen logged in (existing account)")

    results = []

    def check(name, cond, detail=""):
        results.append((name, cond, detail))
        print(f"{'[OK]  ' if cond else '[FAIL] '}{name} {detail}")

    # 1. Owner access
    status, body = http("GET", f"/api/verification/{case_id}", token=citizen)
    check("1. Citizen owns case -> 200", status == 200, f"(got {status})")

    # 2. Non-owner citizen denied
    status, _ = http("GET", f"/api/verification/{case_id}", token=citizen2_token)
    check("2. Citizen not owner -> 403", status == 403, f"(got {status})")

    # 3. Admin allowed
    status, _ = http("GET", f"/api/verification/{case_id}", token=admin)
    check("3. Admin -> 200", status == 200, f"(got {status})")

    # 4. Super admin allowed
    status, _ = http("GET", f"/api/verification/{case_id}", token=superadm)
    check("4. Super Admin -> 200", status == 200, f"(got {status})")

    # 5. Unauthenticated denied
    status, _ = http("GET", f"/api/verification/{case_id}")
    check("5. Unauthenticated -> 401", status == 401, f"(got {status})")

    # 6. Exposure scan on the owner's 200 response
    status, body = http("GET", f"/api/verification/{case_id}", token=citizen)
    leaks = []
    for path, key, val in walk_keys(body):
        if key.lower() in FORBIDDEN_KEYS:
            leaks.append(f"key '{path}'")
        elif isinstance(val, str) and any(s in val.lower() for s in FORBIDDEN_SUBSTRINGS):
            leaks.append(f"value at '{path}'")
    # internal fields that must not appear
    text = json.dumps(body)
    for internal in ('"user_id"', '"id":', "verification_metadata"):
        if internal in text:
            leaks.append(f"internal field {internal}")
    check("6. No credential/internal fields in response", not leaks, f"({'; '.join(leaks) if leaks else 'clean'})")

    # Show the safe structure once
    print("\nResponse top-level fields:", sorted(body.keys()))
    if body.get("result"):
        print("Result summary:", body["result"])
    print("Findings count:", len(body.get("findings", [])))

    failed = [r for r in results if not r[1]]
    print(f"\nPHASE 4 RESULT: {len(results) - len(failed)}/{len(results)} PASSED")
    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
