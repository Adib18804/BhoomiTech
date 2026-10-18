# -*- coding: utf-8 -*-
"""Phase 11A tests: due-diligence report generation and authorization.

Covers:
- a citizen can generate and read a report only for their OWN verification case;
- admin and super_admin follow the existing RBAC rules (can access any report);
- other citizens get 403; unauthenticated requests get 401;
- the persisted snapshot contains every required section and the cautious
  wording notices, and never contains forbidden claims;
- the PDF endpoint returns real PDF bytes with correct headers;
- both English and Bengali reports work.
"""
import re

import pytest

from tests.conftest import check_request_body, scenario_by_id

REPORT_ID_RE = re.compile(r"^BT-RPT-\d{4}-\d{6}$")

FORBIDDEN_CLAIMS = (
    # The report must never make these claims (the negated disclaimer wording
    # such as "does not guarantee" is fine and is not matched here).
    "100% safe",
    "guaranteed ownership",
    "certified ownership",
    "legally verified",
    "fraudulent",
    "no legal dispute",
)


def _run_check(client, headers, scenario_id="SCENARIO_A"):
    scenario = scenario_by_id(scenario_id)
    r = client.post("/api/verification/check",
                    json=check_request_body(scenario), headers=headers)
    assert r.status_code == 200, r.text
    return scenario, r.json()


def _generate(client, headers, case_id, lang="en"):
    return client.post(f"/api/reports/case/{case_id}?lang={lang}", headers=headers)


# ---------------------------------------------------------------- generation
def test_generate_report_as_owner(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    r = _generate(client, citizen_headers, check["case_id"])
    assert r.status_code == 201, r.text
    body = r.json()
    assert REPORT_ID_RE.match(body["report_id"]), body["report_id"]
    assert body["case_id"] == check["case_id"]
    assert body["format"] == "pdf"
    assert body["language"] == "en"
    assert body["overall_risk_level"] == check["overall_risk_level"]
    assert body["file_size_bytes"] and body["file_size_bytes"] > 1000
    assert "Due Diligence" in body["title"]


def test_report_snapshot_contains_required_sections(client, citizen_headers):
    scenario, check = _run_check(client, citizen_headers)
    body = _generate(client, citizen_headers, check["case_id"]).json()
    content = body["content"]

    land = content["land_identity"]
    assert land["district"] == scenario["district"]
    assert land["upazila"] == scenario["upazila"]
    assert land["mouza"] == scenario["mouza"]
    assert land["survey_type"] == scenario["survey_type"]
    assert land["khatian_no"] == scenario["khatian_no"]
    assert land["dag_no"] == scenario["dag_no"]

    # Every required section exists (empty sections are still present as lists)
    for section in ("recorded_owners", "historical_records", "mutation_records",
                    "case_records", "government_status", "acquisition_records",
                    "transactions", "verification_checks"):
        assert section in content, f"missing section: {section}"

    # Scenario A is a fully-populated clean record
    assert content["recorded_owners"], "expected recorded owners for scenario A"
    assert content["historical_records"], "expected historical records for scenario A"
    assert content["verification_checks"], "expected verification checks"
    assert content["case"]["case_id"] == check["case_id"]

    # The seller's claim is echoed back exactly as entered
    claim = scenario["seller_claim"]
    assert content["seller_claim"]["claimed_owner_name"] == claim["claimed_owner_name"]


def test_report_uses_cautious_wording_only(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    content = _generate(client, citizen_headers, check["case_id"]).json()["content"]

    notices = content["notices"]
    assert "NOT A GOVERNMENT CERTIFICATE" in notices["not_certificate_en"]
    assert "SYNTHETIC DEMONSTRATION DATA" in notices["synthetic_en"]
    assert "no AI" in notices["footer_en"]

    blob = str(content).lower()
    for phrase in FORBIDDEN_CLAIMS:
        assert phrase not in blob, f"forbidden claim in report: {phrase}"


def test_bengali_report_language(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    r = _generate(client, citizen_headers, check["case_id"], lang="bn")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["language"] == "bn"
    assert "যাচাইকরণ প্রতিবেদন" in body["title"]
    content = body["content"]
    assert "সরকারি সনদপত্র নয়" in content["notices"]["not_certificate_bn"]
    assert content["notices"]["synthetic_bn"]
    assert content["land_identity"]["district"] == scenario_by_id("SCENARIO_A")["district"]


def test_generate_report_invalid_lang_422(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    assert _generate(client, citizen_headers, check["case_id"], lang="fr").status_code == 422


def test_generate_report_unknown_case_404(client, citizen_headers):
    assert _generate(client, citizen_headers, "BT-VER-NOPE").status_code == 404


# ------------------------------------------------------------ authorization
def test_generate_report_requires_authentication(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    r = client.post(f"/api/reports/case/{check['case_id']}")
    assert r.status_code == 401


def test_other_citizen_cannot_generate_report(client, citizen_headers, citizen2_headers):
    _, check = _run_check(client, citizen_headers)
    assert _generate(client, citizen2_headers, check["case_id"]).status_code == 403


def test_admin_can_generate_report_for_any_case(client, citizen_headers, admin_headers):
    _, check = _run_check(client, citizen_headers)
    r = _generate(client, admin_headers, check["case_id"])
    assert r.status_code == 201, r.text


def test_super_admin_can_generate_report_for_any_case(client, citizen_headers,
                                                      super_admin_headers):
    _, check = _run_check(client, citizen_headers)
    r = _generate(client, super_admin_headers, check["case_id"])
    assert r.status_code == 201, r.text


def test_other_citizen_cannot_read_report(client, citizen_headers, citizen2_headers):
    _, check = _run_check(client, citizen_headers)
    report_id = _generate(client, citizen_headers, check["case_id"]).json()["report_id"]
    assert client.get(f"/api/reports/{report_id}", headers=citizen2_headers).status_code == 403
    assert client.get(f"/api/reports/{report_id}/pdf",
                      headers=citizen2_headers).status_code == 403


def test_admin_and_super_admin_can_read_report(client, citizen_headers,
                                               admin_headers, super_admin_headers):
    _, check = _run_check(client, citizen_headers)
    report_id = _generate(client, citizen_headers, check["case_id"]).json()["report_id"]
    assert client.get(f"/api/reports/{report_id}", headers=admin_headers).status_code == 200
    assert client.get(f"/api/reports/{report_id}", headers=super_admin_headers).status_code == 200


# ------------------------------------------------------------------ PDF/json
def test_pdf_download_returns_real_pdf(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    body = _generate(client, citizen_headers, check["case_id"]).json()
    r = client.get(f"/api/reports/{body['report_id']}/pdf", headers=citizen_headers)
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "application/pdf"
    assert r.content.startswith(b"%PDF")
    assert r.headers["content-disposition"].endswith(f'"{body["report_id"]}.pdf"')
    # Persisted bytes and declared size agree
    assert len(r.content) == body["file_size_bytes"]


def test_pdf_download_requires_authentication(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    report_id = _generate(client, citizen_headers, check["case_id"]).json()["report_id"]
    assert client.get(f"/api/reports/{report_id}/pdf").status_code == 401


def test_get_report_json_detail(client, citizen_headers):
    _, check = _run_check(client, citizen_headers)
    report_id = _generate(client, citizen_headers, check["case_id"]).json()["report_id"]
    r = client.get(f"/api/reports/{report_id}", headers=citizen_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["report_id"] == report_id
    assert body["content"]["land_identity"]["khatian_no"]
    assert client.get("/api/reports/BT-RPT-1999-000000",
                      headers=citizen_headers).status_code == 404


def test_list_reports_for_case(client, citizen_headers, citizen2_headers):
    _, check = _run_check(client, citizen_headers)
    _generate(client, citizen_headers, check["case_id"])
    _generate(client, citizen_headers, check["case_id"], lang="bn")
    r = client.get(f"/api/reports/case/{check['case_id']}", headers=citizen_headers)
    assert r.status_code == 200
    reports = r.json()
    assert len(reports) >= 2
    assert {rep["language"] for rep in reports} >= {"en", "bn"}
    # Other citizens cannot even list them
    assert client.get(f"/api/reports/case/{check['case_id']}",
                      headers=citizen2_headers).status_code == 403
