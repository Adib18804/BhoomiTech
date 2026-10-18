# Final Verification Report — BhoomiTech Stabilization Phase

Date: 2026-10-18
Scope: Phases 0–10 of the approved stabilization order, plus the follow-on
Phases 11A–11E (see "Current status" below).

Every claim below was executed; nothing is projected or assumed. Evidence
files are referenced where they exist.

---

## 0. Current status

The sections below document the Phase 0–10 stabilization run. Since then the
product has advanced further and the functional baseline is now frozen at
commit `a015035`. Current state:

- **Phase 11A — Report generation**: complete. Bilingual (English/Bengali) PDF
  due-diligence reports via fpdf2 + Noto Sans Bengali with text shaping.
- **Phase 11B — Citizen dashboard**: complete.
- **Phase 11C — Admin dashboard**: complete.
- **Phase 11D — Super admin dashboard**: complete.
- **Phase 11E — Demo scenario selector**: complete ("Demo/Development Mode").
- **Tests**: **109 passing** (`cd backend && python -m pytest`).
- **Concurrency race condition fixed**: verification case-ID and report-ID
  allocation now use a transaction-scoped PostgreSQL advisory lock, so
  React StrictMode duplicate verification requests no longer collide on the
  unique `case_id` constraint (previously an HTTP 500). A concurrent
  duplicate-verification regression test was added.
- **Frontend TypeScript**: clean; **frontend production build**: successful.
- **Commit `a015035`** is the current functional checkpoint.

---


## 1. Database status

- PostgreSQL 16.4 with PostGIS 3.4 running in Docker container `bhoomitech-db`; the API connects and `/health` returns `{"status":"healthy"}`.
- PostGIS geometry columns are intact and used (no SQLite fallback, no removed geometry fields).
- Populated tables (live counts): users 14, districts 5, upazilas 5, mouzas 3, khatian_records 5, dag_records 28, land_parcels 28, plot_geometries 28, owners 10, ownership_records 28, historical_records 35, mutation_records 22, case_records 7, government_status_records 4, acquisition_records 4, transactions 22, demo_scenarios 12.
- `verification_cases` (124) and `security_events` (183) have grown through test/verification runs — expected demonstration-database pollution, harmless.

## 2. Migration status

- Alembic is the only schema mechanism; `create_all()` is not used anywhere for schema management.
- `alembic current` → `f5cf0029c5b5 (head)`; `alembic heads` → `f5cf0029c5b5`. Chain: initial migration (29 tables incl. PostGIS geometry) → `f5cf0029c5b5` (`users.locked_until` for account lockout).
- Migration upgrade and downgrade operations were manually inspected before application.

## 3. Seed status

- Seed via `python -m app.services.seed_data`; all demo data is synthetic (no real names, NIDs, or phone numbers).
- Scenario claims are stored **inside** `demo_scenarios.expected_findings → seller_claim` (claimed_owner_name, claimed_share_decimal, claimed_sale_area_decimal) — no reliance on list indexes anywhere (seed, engine tests, or pytest).
- Seeded admin emails use `@bhoomitech.example` / citizens `@example.com` — deliverable test domains (the original `.local` was rejected by email validation at login time).

## 4. Scenario results A–L (all 12, executed)

Verified at three levels: engine-level (`backend/verify_scenarios.py`), through the live HTTP API (`backend/verify_scenarios_api.py`), and as pytest parametrized tests. (The raw output files these scripts write — `phase*_results.txt` — are generated artifacts and are no longer committed.)

| Scenario | Parcel | Expected | Actual | Score | Result |
|---|---|---|---|---|---|
| A — Clean record | BT-PARCEL-000001 | LOW_CONCERN | LOW_CONCERN | 10 | PASS |
| B — Ownership mismatch | BT-PARCEL-000002 | HIGH_ATTENTION | HIGH_ATTENTION | 75 | PASS |
| C — Mutation pending | BT-PARCEL-000003 | REVIEW_REQUIRED | REVIEW_REQUIRED | 45 | PASS |
| D — Area/share conflict | BT-PARCEL-000004 | HIGH_ATTENTION | HIGH_ATTENTION | 75 | PASS |
| E — Litigation | BT-PARCEL-000005 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 95–100 | PASS |
| F — Transaction overlap | BT-PARCEL-000006 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 95–100 | PASS |
| G — Acquisition | BT-PARCEL-000007 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 95–100 | PASS |
| H — Government status | BT-PARCEL-000008 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 95–100 | PASS |
| I — Historical chain | BT-PARCEL-000009 | REVIEW_REQUIRED | REVIEW_REQUIRED | 45 | PASS |
| J — Combined signals | BT-PARCEL-000010 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 95 | PASS |
| K — Insufficient data | BT-PARCEL-000011 | INSUFFICIENT_DATA | INSUFFICIENT_DATA | 0 | PASS |
| L — Combined critical | BT-PARCEL-000012 | CRITICAL_SIGNAL | CRITICAL_SIGNAL | 100 | PASS |

Scenario K confirms the product rule: **missing data yields INSUFFICIENT_DATA, never a clean result.**

## 5. Security fixes

- **Verification detail exposure (Phase 4)** — `GET /verification/{case_id}` returns an explicit Pydantic whitelist (`VerificationCaseDetailResponse`); no raw ORM objects, no `password_hash`, no internal fields. RBAC verified: owner 200, non-owner 403, admin 200, super admin 200, unauthenticated 401 (`backend/verify_phase4_security.py`, 6/6).
- **Account lockout (Phase 8)** — deterministic: lock check precedes password check; `failed_login_attempts` increments per failure; lock engages at `LOGIN_MAX_FAILED_ATTEMPTS` (5) for `LOGIN_LOCKOUT_MINUTES` (15); success resets counter and lock; `account_locked` security events (high severity) recorded; messages are identical for existing and non-existing emails. Verified end-to-end over HTTP (`backend/verify_phase8_lockout.py`, 23/23).
- **Rate limiting (Phase 9)** — in-memory sliding window (60 s, per client IP, no external infra) on login / admin-login / register / forgot-password (10/min) and verification check + detail (20/min); 429 responses carry `Retry-After`; `X-Forwarded-For` deliberately not trusted. Verified over HTTP (unit + live, `backend/verify_phase9_ratelimit.py`, 17/17).
- No secrets in source: `.env` is git-ignored; `.env.example` documents every variable with placeholders.

## 6. Verification engine checks

Ten deterministic, rule-based checks — **no AI, no LLM, no machine learning anywhere in the product**:

1. Land identity
2. Ownership
3. Mutation
4. Legal cases
5. Government status
6. Acquisition
7. Transaction overlap
8. Historical consistency (CS→SA→RS→BS chain; gaps flagged, **no automatic "illegal" declaration**; future dates and area drift beyond max(1%, 0.05 decimal) flagged)
9. Area/share (expected = total_area × recorded_share% ; claim exceeding expectation by > 0.01 decimal → attention signal)
10. Cross-record consistency (share sums vs 100% ±1%, mutation vs parcel area, transacted vs total area, government-status + pending-mutation coexistence)

All findings use cautious language only ("Recorded owner", "Potential mismatch", "Case signal found", "Insufficient data"); risk levels are limited to LOW_CONCERN, REVIEW_REQUIRED, HIGH_ATTENTION, CRITICAL_SIGNAL, INSUFFICIENT_DATA.

## 7. Frontend build

- `npm run build` — **passes** (vite 5, built in ~3.3 s; chunks: react-vendor, map-vendor, i18n-vendor).
- `npm run dev` — starts and serves on port 5173 with a clean log (`/tmp/bt_frontend.log`); `/api` is proxied to the backend.

## 8. TypeScript

- `npx tsc --noEmit` — **exit 0** on a fresh run.
- No disabled checking: no `@ts-ignore`, no suppression flags. Root causes were fixed (added `src/vite-env.d.ts` for `import.meta.env` and image module types; removed genuinely unused imports).

## 9. Test result

- **pytest: 109 passed** (Phase 0–10 baseline was 61; Phases 11A–11E added report, dashboard, demo-selector and concurrency-regression coverage). Verified twice consecutively for repeatability. Run: `cd backend && python -m pytest`.
- Bilingual end-to-end: scenario D detail returns both English and Bengali finding content (verified via API and pytest).
- Manual workflow (exact UI flow: login → land search by identifiers → seller claim → check → case detail): 6/6 checks pass over HTTP, including "no password material in responses".
- Browser-level UI walkthrough was not automated (browser tooling blocked by the session's permission mode); the HTTP-level workflow above exercises the identical requests the frontend sends.

## 10. Remaining limitations

1. **Phase 11 completed after this run**: report generation (PDF), citizen/admin/super-admin dashboards and the demo scenario selector are now implemented (see "Current status" above).
2. Rate limiter is in-process memory: counters are per-worker and reset on restart; a multi-worker deployment needs a shared store.
3. Account lockout is per-account only (no per-IP throttling of a single account spread across IPs); rate limiting partially covers this at the IP level.
4. Password reset does not send email (returns the generic success message by design); token-based reset flow is unimplemented.
5. `X-Forwarded-For` is ignored; behind a reverse proxy, the proxy must resolve the real client IP (e.g. `uvicorn --proxy-headers` with trusted hosts) or limits will bind to the proxy address.
6. The demonstration database accumulates verification cases and security events from test runs (by design, harmless; re-running the seed resets them).
7. Forgot-password, register and login share per-endpoint IP budgets; an attacker rotating endpoints gets independent budgets per endpoint (documented trade-off).
8. Historical-consistency chain detection relies on the seeded CS→SA→RS→BS chain shape; unrelated survey-type sequences would need rule review before production use.

---

## Command summary (all executed)

```text
alembic upgrade head / current / heads          # f5cf0029c5b5 (head)
python -m app.services.seed_data                # synthetic seed
python verify_scenarios.py                      # 12/12 ALL PASS
python verify_scenarios_api.py                  # 12/12 via HTTP
python verify_phase4_security.py                # 6/6
python verify_phase8_lockout.py                 # 23/23
python verify_phase9_ratelimit.py a ; restart ; b   # 17/17
python -m pytest                                # 61 passed at Phase 0–10; 109 passed at current baseline
cd frontend && npm run build                    # success
cd frontend && npx tsc --noEmit                 # exit 0
```

Commits (this stabilization phase): `f316b3f` Phase 2, `1ea78f1` Phase 3,
`ed189a3` Phase 4, `1613266` Phase 5, `b6b04b1` Phase 6, `ce53de0` Phase 7,
`2944f50` Phase 8, `8b2f42d` Phase 9, `19094c8` Phase 10.
Phase 11A–11E followed, and `a015035` is the current functional checkpoint
(verification case-ID race fix + concurrency regression test).
