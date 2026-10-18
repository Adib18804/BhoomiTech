# -*- coding: utf-8 -*-
"""Land endpoint tests: search, parcel detail, geometry, ownership, history,
mutation, cases, government status, acquisition, transactions.

Parcels are identified through demo scenario rows (by scenario_id) - never
through list indexes - so tests remain stable regardless of row order.
"""
from tests.conftest import scenario_by_id


def _search_payload(scenario):
    return {
        "district": scenario["district"],
        "upazila": scenario["upazila"],
        "mouza": scenario["mouza"],
        "survey_type": scenario["survey_type"],
        "khatian_no": scenario["khatian_no"],
        "dag_no": scenario["dag_no"],
    }


# --------------------------------------------------------------------- search
def test_search_by_explicit_identifiers(client, scenario_a):
    r = client.post("/api/land/search", json=_search_payload(scenario_a))
    assert r.status_code == 200, r.text
    assert r.json()["parcel"]["parcel_id"] == scenario_a["parcel_id"]


def test_search_unknown_district_404(client):
    r = client.post("/api/land/search", json={
        "district": "No Such District", "upazila": "X", "mouza": "X",
        "survey_type": "RS", "khatian_no": "342", "dag_no": "121",
    })
    assert r.status_code == 404


def test_search_unknown_dag_404(client, scenario_a):
    payload = _search_payload(scenario_a)
    payload["dag_no"] = "99999"
    assert client.post("/api/land/search", json=payload).status_code == 404


# -------------------------------------------------------------- parcel detail
def test_parcel_detail(client, scenario_a):
    r = client.get(f"/api/land/{scenario_a['parcel_id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["parcel"]["parcel_id"] == scenario_a["parcel_id"]
    assert str(body["parcel"]["khatian_no"]) == str(scenario_a["khatian_no"])
    assert str(body["parcel"]["dag_no"]) == str(scenario_a["dag_no"])
    assert isinstance(body["ownership"], list)
    assert body["geometry"] is not None


def test_parcel_detail_unknown_404(client):
    assert client.get("/api/land/BT-PARCEL-NOPE").status_code == 404


# ------------------------------------------------------------------- geometry
def test_parcel_geometry_geojson(client, scenario_a):
    r = client.get(f"/api/land/{scenario_a['parcel_id']}/geometry")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "Feature"
    assert body["geometry"]["type"] == "Polygon"
    assert body["geometry"]["coordinates"]


# ------------------------------------------------------------------ ownership
def test_ownership_records(client, scenario_a):
    """Scenario A has a single recorded owner matching the seller claim."""
    r = client.get(f"/api/land/{scenario_a['parcel_id']}/ownership")
    assert r.status_code == 200
    owners = r.json()
    assert len(owners) == 1
    claim_name = scenario_a["seller_claim"]["claimed_owner_name"]
    assert owners[0]["owner"]["name_en"] == claim_name, owners


def test_ownership_unknown_parcel_404(client):
    assert client.get("/api/land/BT-PARCEL-NOPE/ownership").status_code == 404


# -------------------------------------------------------------------- history
def test_history_records_present_for_chain_scenario(client):
    """Scenario I carries the multi-survey historical chain (>= 3 records)."""
    scenario_i = scenario_by_id("SCENARIO_I")
    r = client.get(f"/api/land/{scenario_i['parcel_id']}/history")
    assert r.status_code == 200
    history = r.json()
    assert len(history) >= 3, history


def test_history_empty_list_for_scenario_k(client):
    """Scenario K is the insufficient-data case: no historical records."""
    scenario_k = scenario_by_id("SCENARIO_K")
    r = client.get(f"/api/land/{scenario_k['parcel_id']}/history")
    assert r.status_code == 200
    assert r.json() == []


# ------------------------------------------------------------------- mutation
def test_mutation_pending_scenario(client):
    """Scenario C: a mutation application is pending (no approval date)."""
    scenario_c = scenario_by_id("SCENARIO_C")
    r = client.get(f"/api/land/{scenario_c['parcel_id']}/mutation")
    assert r.status_code == 200
    mutations = r.json()
    assert len(mutations) >= 1
    assert mutations[0]["status"] == "pending"
    assert mutations[0]["approval_date"] is None


def test_mutation_completed_for_clean_scenario(client, scenario_a):
    """A clean record may carry COMPLETED (approved) mutations - only pending
    or in-review mutations are a concern. Scenario A's mutation is approved."""
    r = client.get(f"/api/land/{scenario_a['parcel_id']}/mutation")
    assert r.status_code == 200
    mutations = r.json()
    assert len(mutations) >= 1
    assert all(m["status"] == "approved" and m["approval_date"] is not None
               for m in mutations)


# ---------------------------------------------------------------------- cases
def test_case_records_for_litigation_scenario(client):
    scenario_e = scenario_by_id("SCENARIO_E")
    r = client.get(f"/api/land/{scenario_e['parcel_id']}/cases")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_cases_none_for_clean_scenario(client, scenario_a):
    r = client.get(f"/api/land/{scenario_a['parcel_id']}/cases")
    assert r.status_code == 200
    assert r.json() == []


# ---------------------------------------------------------- government status
def test_government_status_scenario(client):
    scenario_h = scenario_by_id("SCENARIO_H")
    r = client.get(f"/api/land/{scenario_h['parcel_id']}/government-status")
    assert r.status_code == 200
    assert len(r.json()) >= 1


# ----------------------------------------------------------------- acquisition
def test_acquisition_scenario(client):
    scenario_g = scenario_by_id("SCENARIO_G")
    r = client.get(f"/api/land/{scenario_g['parcel_id']}/acquisition")
    assert r.status_code == 200
    assert len(r.json()) >= 1


# --------------------------------------------------------------- transactions
def test_transactions_for_overlap_scenario(client):
    scenario_f = scenario_by_id("SCENARIO_F")
    r = client.get(f"/api/land/{scenario_f['parcel_id']}/transactions")
    assert r.status_code == 200
    assert len(r.json()) >= 2


def test_transactions_none_for_clean_scenario(client, scenario_a):
    r = client.get(f"/api/land/{scenario_a['parcel_id']}/transactions")
    assert r.status_code == 200
    assert r.json() == []
