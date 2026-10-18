"""
Comprehensive synthetic data seeder for BhoomiTech
Creates deterministic, relational demo data with realistic cadastral geometry

Scenario alignment (stabilization Phase 3):
- Every demo scenario maps to an explicit (khatian, survey_type, dag) identifier
  that is guaranteed to exist in the generated land records.
- Scenario-specific supporting records (ownership, mutation, cases, government
  status, acquisition, transactions, history) are attached via explicit
  identifier lookups - NEVER via list indexes.
- Generic background data skips scenario parcels entirely so scenario outcomes
  stay deterministic.
"""

import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from shapely.geometry import Polygon
import json

from app.models import *
from app.core.security import hash_password


# ---------------------------------------------------------------------------
# Scenario -> land identifier map (single source of truth)
#
# Land record generation (seed_land_records) creates khatians in this order:
#   RS 342 -> 8 dags  -> dag 121..128 (parcels 1-8)
#   RS 343 -> 6 dags  -> dag 129..134 (parcels 9-14)
#   RS 344 -> 5 dags  -> dag 135..139 (parcels 15-19)
#   SA 128 -> 4 dags  -> dag 140..143 (parcels 20-23)
#   SA 129 -> 5 dags  -> dag 144..148 (parcels 24-28)
# These identifiers are stable and deterministic.
# ---------------------------------------------------------------------------
SCENARIO_IDENTIFIERS = {
    "SCENARIO_A": {"khatian_no": "342", "survey_type": "RS", "dag_no": "121"},  # LOW CONCERN
    "SCENARIO_B": {"khatian_no": "342", "survey_type": "RS", "dag_no": "122"},  # OWNERSHIP MISMATCH
    "SCENARIO_C": {"khatian_no": "342", "survey_type": "RS", "dag_no": "123"},  # MUTATION PENDING
    "SCENARIO_D": {"khatian_no": "342", "survey_type": "RS", "dag_no": "124"},  # AREA/SHARE CONFLICT
    "SCENARIO_E": {"khatian_no": "342", "survey_type": "RS", "dag_no": "125"},  # CASE SIGNAL
    "SCENARIO_F": {"khatian_no": "342", "survey_type": "RS", "dag_no": "126"},  # TRANSACTION OVERLAP
    "SCENARIO_G": {"khatian_no": "342", "survey_type": "RS", "dag_no": "127"},  # ACQUISITION SIGNAL
    # Corrected: dag 128 is generated under khatian 342, not 343
    "SCENARIO_H": {"khatian_no": "342", "survey_type": "RS", "dag_no": "128"},  # GOV/KHAS SIGNAL
    "SCENARIO_I": {"khatian_no": "343", "survey_type": "RS", "dag_no": "129"},  # HISTORICAL TRANSITION
    "SCENARIO_J": {"khatian_no": "343", "survey_type": "RS", "dag_no": "130"},  # MULTIPLE RISKS
    # Corrected: dag 131/132 are generated under khatian 343, not 344
    "SCENARIO_K": {"khatian_no": "343", "survey_type": "RS", "dag_no": "131"},  # INSUFFICIENT DATA
    "SCENARIO_L": {"khatian_no": "343", "survey_type": "RS", "dag_no": "132"},  # CRITICAL COMBINED
}

# Explicit owner names used by scenario fixtures (must exist in seed_owners).
SCENARIO_OWNERS = {
    "SCENARIO_A": ["Md. Karim Ahmed"],
    "SCENARIO_B": ["Fatema Begum"],
    "SCENARIO_C": ["Abdul Jabbar"],
    "SCENARIO_D": ["Rahima Khatun", "Md. Rahim Hasan"],  # joint ownership 50/50
    "SCENARIO_E": ["Ayesha Siddika"],
    "SCENARIO_F": ["Habibur Rahman"],
    "SCENARIO_G": ["Salma Khatun"],
    "SCENARIO_H": ["Md. Jamal Uddin"],
    "SCENARIO_I": ["Nasima Begum"],
    "SCENARIO_J": ["Md. Karim Ahmed"],
    "SCENARIO_K": [],  # intentionally no ownership data
    "SCENARIO_L": ["Fatema Begum"],
}


def generate_deterministic_polygon(seed_value: int, base_lat: float, base_lon: float, area_decimal: float) -> Polygon:
    """
    Generate deterministic polygon geometry based on seed
    area_decimal: area in decimal (1 decimal ≈ 436 m²)
    """
    area_sqm = area_decimal * 436.0
    side_length_m = math.sqrt(area_sqm)

    # Convert meters to approximate degrees (at Bangladesh latitude)
    meters_per_degree_lat = 111000
    meters_per_degree_lon = 96000

    side_lat = side_length_m / meters_per_degree_lat
    side_lon = side_length_m / meters_per_degree_lon

    offset_lat = (seed_value % 100) * side_lat * 1.5
    offset_lon = ((seed_value // 100) % 100) * side_lon * 1.5

    lat_start = base_lat + offset_lat
    lon_start = base_lon + offset_lon

    variation = (seed_value % 10) * 0.00001

    coords = [
        (lon_start, lat_start),
        (lon_start + side_lon, lat_start + variation),
        (lon_start + side_lon + variation, lat_start + side_lat),
        (lon_start - variation, lat_start + side_lat + variation),
        (lon_start, lat_start),  # Close the polygon
    ]

    return Polygon(coords)


def create_geojson_from_polygon(polygon: Polygon) -> dict:
    """Convert Shapely polygon to GeoJSON"""
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [list(polygon.exterior.coords)]
        },
        "properties": {}
    }


# ---------------------------------------------------------------------------
# Deterministic lookup helpers (explicit relationships, never list indexes)
# ---------------------------------------------------------------------------

def get_parcel_by_identifiers(db: Session, khatian_no: str, survey_type: str, dag_no: str):
    """Resolve a parcel deterministically via mouza -> khatian -> dag chain."""
    return (
        db.query(LandParcel)
        .join(DagRecord, LandParcel.dag_id == DagRecord.id)
        .join(KhatianRecord, DagRecord.khatian_id == KhatianRecord.id)
        .filter(
            KhatianRecord.khatian_no == khatian_no,
            KhatianRecord.survey_type == survey_type,
            DagRecord.dag_no == dag_no,
        )
        .first()
    )


def get_scenario_parcel(db: Session, scenario_id: str):
    """Return the parcel for a scenario, or None with a loud warning."""
    ident = SCENARIO_IDENTIFIERS[scenario_id]
    parcel = get_parcel_by_identifiers(db, ident["khatian_no"], ident["survey_type"], ident["dag_no"])
    if not parcel:
        print(f"[FAIL] {scenario_id}: parcel {ident} not found - land records missing?")
    return parcel


def get_owner_by_name(db: Session, name_en: str):
    return db.query(Owner).filter(Owner.name_en == name_en).first()


def scenario_parcel_ids(db: Session) -> set:
    """IDs of all parcels reserved for demo scenarios (excluded from generic data)."""
    ids = set()
    for scenario_id in SCENARIO_IDENTIFIERS:
        parcel = get_scenario_parcel(db, scenario_id)
        if parcel:
            ids.add(parcel.id)
    return ids


def _days_ago(days: int) -> datetime:
    return datetime.now() - timedelta(days=days)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def seed_super_admin(db: Session):
    """Create super admin account"""
    existing = db.query(User).filter(User.email == "superadmin@bhoomitech.example").first()
    if not existing:
        super_admin = User(
            email="superadmin@bhoomitech.example",
            full_name="System Administrator",
            password_hash=hash_password("SuperAdmin@2026"),
            role="super_admin",
            is_active=True,
            preferred_language="en"
        )
        db.add(super_admin)
        print("[OK] Created Super Admin account (superadmin@bhoomitech.example / SuperAdmin@2026)")


def seed_admin_users(db: Session):
    """Create admin users"""
    admins = [
        {"email": "admin1@bhoomitech.example", "name": "Admin User One", "password": "Admin@2026"},
        {"email": "admin2@bhoomitech.example", "name": "Admin User Two", "password": "Admin@2026"},
    ]

    for admin_data in admins:
        existing = db.query(User).filter(User.email == admin_data["email"]).first()
        if not existing:
            admin = User(
                email=admin_data["email"],
                full_name=admin_data["name"],
                password_hash=hash_password(admin_data["password"]),
                role="admin",
                is_active=True,
                preferred_language="en"
            )
            db.add(admin)

    print(f"[OK] Created {len(admins)} admin accounts")


def seed_citizen_users(db: Session):
    """Create demo citizen users"""
    citizens = [
        {"email": "citizen1@example.com", "name": "Md. Karim Ahmed", "mobile": "01712345678", "password": "Citizen@2026"},
        {"email": "citizen2@example.com", "name": "Fatema Begum", "mobile": "01812345679", "password": "Citizen@2026"},
        {"email": "citizen3@example.com", "name": "Rahim Mia", "mobile": "01912345680", "password": "Citizen@2026"},
    ]

    for citizen_data in citizens:
        existing = db.query(User).filter(User.email == citizen_data["email"]).first()
        if not existing:
            citizen = User(
                email=citizen_data["email"],
                mobile=citizen_data["mobile"],
                full_name=citizen_data["name"],
                password_hash=hash_password(citizen_data["password"]),
                role="citizen",
                is_active=True,
                preferred_language="bn"
            )
            db.add(citizen)

    print(f"[OK] Created {len(citizens)} citizen accounts")


# ---------------------------------------------------------------------------
# Administrative hierarchy reference data (SYNTHETIC DEMONSTRATION DATA)
#
# Bangladesh currently has 8 divisions and 64 districts. Only the names and the
# division -> district -> upazila relationships are modelled here; every row is
# synthetic demonstration data and is NOT an authoritative administrative
# record. Upazilas are a representative subset per district (not exhaustive).
#
# The existing Dhaka > Savar > Demo/Test/Sample Mouza anchors are preserved
# exactly (codes DHK/SAV/DM001/TM002/SM003) because the demo scenarios (A-L)
# resolve their land records through them.
# ---------------------------------------------------------------------------
ADMIN_HIERARCHY = [
    {
        "code": "DHK", "name_en": "Dhaka", "name_bn": "ঢাকা",
        "districts": [
            {"code": "DHK", "name_en": "Dhaka", "name_bn": "ঢাকা", "upazilas": [
                {"code": "SAV", "name_en": "Savar", "name_bn": "সাভার"},
                {"code": "DHM", "name_en": "Dhamrai", "name_bn": "ধামরাই"},
                {"code": "KRN", "name_en": "Keraniganj", "name_bn": "কেরানীগঞ্জ"},
                {"code": "NWB", "name_en": "Nawabganj", "name_bn": "নবাবগঞ্জ"},
                {"code": "DOH", "name_en": "Dohar", "name_bn": "দোহার"},
            ]},
            {"code": "FRD", "name_en": "Faridpur", "name_bn": "ফরিদপুর", "upazilas": [
                {"name_en": "Faridpur Sadar", "name_bn": "ফরিদপুর সদর"},
                {"name_en": "Bhanga", "name_bn": "ভাঙ্গা"},
            ]},
            {"code": "GZP", "name_en": "Gazipur", "name_bn": "গাজীপুর", "upazilas": [
                {"name_en": "Gazipur Sadar", "name_bn": "গাজীপুর সদর"},
                {"name_en": "Kaliakair", "name_bn": "কালিয়াকৈর"},
            ]},
            {"code": "GPA", "name_en": "Gopalganj", "name_bn": "গোপালগঞ্জ", "upazilas": [
                {"name_en": "Gopalganj Sadar", "name_bn": "গোপালগঞ্জ সদর"},
                {"name_en": "Kashiani", "name_bn": "কাশিয়ানী"},
            ]},
            {"code": "KIS", "name_en": "Kishoreganj", "name_bn": "কিশোরগঞ্জ", "upazilas": [
                {"name_en": "Kishoreganj Sadar", "name_bn": "কিশোরগঞ্জ সদর"},
                {"name_en": "Bhairab", "name_bn": "ভৈরব"},
            ]},
            {"code": "MAD", "name_en": "Madaripur", "name_bn": "মাদারীপুর", "upazilas": [
                {"name_en": "Madaripur Sadar", "name_bn": "মাদারীপুর সদর"},
                {"name_en": "Shibchar", "name_bn": "শিবচর"},
            ]},
            {"code": "MAN", "name_en": "Manikganj", "name_bn": "মানিকগঞ্জ", "upazilas": [
                {"name_en": "Manikganj Sadar", "name_bn": "মানিকগঞ্জ সদর"},
                {"name_en": "Saturia", "name_bn": "সাটুরিয়া"},
            ]},
            {"code": "MUN", "name_en": "Munshiganj", "name_bn": "মুন্সিগঞ্জ", "upazilas": [
                {"name_en": "Munshiganj Sadar", "name_bn": "মুন্সিগঞ্জ সদর"},
                {"name_en": "Sreenagar", "name_bn": "শ্রীনগর"},
            ]},
            {"code": "NAR", "name_en": "Narayanganj", "name_bn": "নারায়ণগঞ্জ", "upazilas": [
                {"name_en": "Narayanganj Sadar", "name_bn": "নারায়ণগঞ্জ সদর"},
                {"name_en": "Rupganj", "name_bn": "রূপগঞ্জ"},
            ]},
            {"code": "NAS", "name_en": "Narsingdi", "name_bn": "নরসিংদী", "upazilas": [
                {"name_en": "Narsingdi Sadar", "name_bn": "নরসিংদী সদর"},
                {"name_en": "Palash", "name_bn": "পলাশ"},
            ]},
            {"code": "RJB", "name_en": "Rajbari", "name_bn": "রাজবাড়ী", "upazilas": [
                {"name_en": "Rajbari Sadar", "name_bn": "রাজবাড়ী সদর"},
                {"name_en": "Pangsha", "name_bn": "পাংশা"},
            ]},
            {"code": "SRP", "name_en": "Shariatpur", "name_bn": "শরীয়তপুর", "upazilas": [
                {"name_en": "Shariatpur Sadar", "name_bn": "শরীয়তপুর সদর"},
                {"name_en": "Damudya", "name_bn": "ডামুড্যা"},
            ]},
            {"code": "TAN", "name_en": "Tangail", "name_bn": "টাঙ্গাইল", "upazilas": [
                {"name_en": "Tangail Sadar", "name_bn": "টাঙ্গাইল সদর"},
                {"name_en": "Mirzapur", "name_bn": "মির্জাপুর"},
            ]},
        ],
    },
    {
        "code": "CTG", "name_en": "Chattogram", "name_bn": "চট্টগ্রাম",
        "districts": [
            {"code": "BAN", "name_en": "Bandarban", "name_bn": "বান্দরবান", "upazilas": [
                {"name_en": "Bandarban Sadar", "name_bn": "বান্দরবান সদর"},
                {"name_en": "Thanchi", "name_bn": "থানচি"},
            ]},
            {"code": "BBR", "name_en": "Brahmanbaria", "name_bn": "ব্রাহ্মণবাড়িয়া", "upazilas": [
                {"name_en": "Brahmanbaria Sadar", "name_bn": "ব্রাহ্মণবাড়িয়া সদর"},
                {"name_en": "Ashuganj", "name_bn": "আশুগঞ্জ"},
            ]},
            {"code": "CHD", "name_en": "Chandpur", "name_bn": "চাঁদপুর", "upazilas": [
                {"name_en": "Chandpur Sadar", "name_bn": "চাঁদপুর সদর"},
                {"name_en": "Hajiganj", "name_bn": "হাজীগঞ্জ"},
            ]},
            {"code": "CTG", "name_en": "Chattogram", "name_bn": "চট্টগ্রাম", "upazilas": [
                {"name_en": "Kotwali", "name_bn": "কোতোয়ালী"},
                {"name_en": "Patiya", "name_bn": "পটিয়া"},
            ]},
            {"code": "CUM", "name_en": "Cumilla", "name_bn": "কুমিল্লা", "upazilas": [
                {"name_en": "Cumilla Sadar", "name_bn": "কুমিল্লা সদর"},
                {"name_en": "Debidwar", "name_bn": "দেবিদ্বার"},
            ]},
            {"code": "COX", "name_en": "Cox's Bazar", "name_bn": "কক্সবাজার", "upazilas": [
                {"name_en": "Cox's Bazar Sadar", "name_bn": "কক্সবাজার সদর"},
                {"name_en": "Teknaf", "name_bn": "টেকনাফ"},
            ]},
            {"code": "FEN", "name_en": "Feni", "name_bn": "ফেনী", "upazilas": [
                {"name_en": "Feni Sadar", "name_bn": "ফেনী সদর"},
                {"name_en": "Chhagalnaiya", "name_bn": "ছাগলনাইয়া"},
            ]},
            {"code": "KGR", "name_en": "Khagrachhari", "name_bn": "খাগড়াছড়ি", "upazilas": [
                {"name_en": "Khagrachhari Sadar", "name_bn": "খাগড়াছড়ি সদর"},
                {"name_en": "Dighinala", "name_bn": "দীঘিনালা"},
            ]},
            {"code": "LAK", "name_en": "Lakshmipur", "name_bn": "লক্ষ্মীপুর", "upazilas": [
                {"name_en": "Lakshmipur Sadar", "name_bn": "লক্ষ্মীপুর সদর"},
                {"name_en": "Raipur", "name_bn": "রায়পুর"},
            ]},
            {"code": "NOA", "name_en": "Noakhali", "name_bn": "নোয়াখালী", "upazilas": [
                {"name_en": "Noakhali Sadar", "name_bn": "নোয়াখালী সদর"},
                {"name_en": "Begumganj", "name_bn": "বেগমগঞ্জ"},
            ]},
            {"code": "RGM", "name_en": "Rangamati", "name_bn": "রাঙ্গামাটি", "upazilas": [
                {"name_en": "Rangamati Sadar", "name_bn": "রাঙ্গামাটি সদর"},
                {"name_en": "Kaptai", "name_bn": "কাপ্তাই"},
            ]},
        ],
    },
    {
        "code": "RAJ", "name_en": "Rajshahi", "name_bn": "রাজশাহী",
        "districts": [
            {"code": "BOG", "name_en": "Bogura", "name_bn": "বগুড়া", "upazilas": [
                {"name_en": "Bogura Sadar", "name_bn": "বগুড়া সদর"},
                {"name_en": "Sherpur", "name_bn": "শেরপুর"},
            ]},
            {"code": "CHP", "name_en": "Chapainawabganj", "name_bn": "চাঁপাইনবাবগঞ্জ", "upazilas": [
                {"name_en": "Chapainawabganj Sadar", "name_bn": "চাঁপাইনবাবগঞ্জ সদর"},
                {"name_en": "Shibganj", "name_bn": "শিবগঞ্জ"},
            ]},
            {"code": "JOY", "name_en": "Joypurhat", "name_bn": "জয়পুরহাট", "upazilas": [
                {"name_en": "Joypurhat Sadar", "name_bn": "জয়পুরহাট সদর"},
                {"name_en": "Akkelpur", "name_bn": "আক্কেলপুর"},
            ]},
            {"code": "NAO", "name_en": "Naogaon", "name_bn": "নওগাঁ", "upazilas": [
                {"name_en": "Naogaon Sadar", "name_bn": "নওগাঁ সদর"},
                {"name_en": "Atrai", "name_bn": "আত্রাই"},
            ]},
            {"code": "NAT", "name_en": "Natore", "name_bn": "নাটোর", "upazilas": [
                {"name_en": "Natore Sadar", "name_bn": "নাটোর সদর"},
                {"name_en": "Singra", "name_bn": "সিংড়া"},
            ]},
            {"code": "PAB", "name_en": "Pabna", "name_bn": "পাবনা", "upazilas": [
                {"name_en": "Pabna Sadar", "name_bn": "পাবনা সদর"},
                {"name_en": "Ishwardi", "name_bn": "ঈশ্বরদী"},
            ]},
            {"code": "RAJ", "name_en": "Rajshahi", "name_bn": "রাজশাহী", "upazilas": [
                {"name_en": "Boalia", "name_bn": "বোয়ালিয়া"},
                {"name_en": "Puthia", "name_bn": "পুঠিয়া"},
            ]},
            {"code": "SIR", "name_en": "Sirajganj", "name_bn": "সিরাজগঞ্জ", "upazilas": [
                {"name_en": "Sirajganj Sadar", "name_bn": "সিরাজগঞ্জ সদর"},
                {"name_en": "Shahjadpur", "name_bn": "শাহজাদপুর"},
            ]},
        ],
    },
    {
        "code": "KHL", "name_en": "Khulna", "name_bn": "খুলনা",
        "districts": [
            {"code": "BAG", "name_en": "Bagerhat", "name_bn": "বাগেরহাট", "upazilas": [
                {"name_en": "Bagerhat Sadar", "name_bn": "বাগেরহাট সদর"},
                {"name_en": "Mongla", "name_bn": "মোংলা"},
            ]},
            {"code": "CHU", "name_en": "Chuadanga", "name_bn": "চুয়াডাঙ্গা", "upazilas": [
                {"name_en": "Chuadanga Sadar", "name_bn": "চুয়াডাঙ্গা সদর"},
                {"name_en": "Damurhuda", "name_bn": "দামুড়হুদা"},
            ]},
            {"code": "JAS", "name_en": "Jashore", "name_bn": "যশোর", "upazilas": [
                {"name_en": "Jashore Sadar", "name_bn": "যশোর সদর"},
                {"name_en": "Abhaynagar", "name_bn": "অভয়নগর"},
            ]},
            {"code": "JHE", "name_en": "Jhenaidah", "name_bn": "ঝিনাইদহ", "upazilas": [
                {"name_en": "Jhenaidah Sadar", "name_bn": "ঝিনাইদহ সদর"},
                {"name_en": "Shailkupa", "name_bn": "শৈলকুপা"},
            ]},
            {"code": "KHL", "name_en": "Khulna", "name_bn": "খুলনা", "upazilas": [
                {"name_en": "Khulna Sadar", "name_bn": "খুলনা সদর"},
                {"name_en": "Dumuria", "name_bn": "ডুমুরিয়া"},
            ]},
            {"code": "KUS", "name_en": "Kushtia", "name_bn": "কুষ্টিয়া", "upazilas": [
                {"name_en": "Kushtia Sadar", "name_bn": "কুষ্টিয়া সদর"},
                {"name_en": "Kumarkhali", "name_bn": "কুমারখালী"},
            ]},
            {"code": "MAG", "name_en": "Magura", "name_bn": "মাগুরা", "upazilas": [
                {"name_en": "Magura Sadar", "name_bn": "মাগুরা সদর"},
                {"name_en": "Shalikha", "name_bn": "শালিখা"},
            ]},
            {"code": "MEH", "name_en": "Meherpur", "name_bn": "মেহেরপুর", "upazilas": [
                {"name_en": "Meherpur Sadar", "name_bn": "মেহেরপুর সদর"},
                {"name_en": "Gangni", "name_bn": "গাংনী"},
            ]},
            {"code": "NRL", "name_en": "Narail", "name_bn": "নড়াইল", "upazilas": [
                {"name_en": "Narail Sadar", "name_bn": "নড়াইল সদর"},
                {"name_en": "Lohagara", "name_bn": "লোহাগড়া"},
            ]},
            {"code": "SAT", "name_en": "Satkhira", "name_bn": "সাতক্ষীরা", "upazilas": [
                {"name_en": "Satkhira Sadar", "name_bn": "সাতক্ষীরা সদর"},
                {"name_en": "Kalaroa", "name_bn": "কলারোয়া"},
            ]},
        ],
    },
    {
        "code": "SYL", "name_en": "Sylhet", "name_bn": "সিলেট",
        "districts": [
            {"code": "HAB", "name_en": "Habiganj", "name_bn": "হবিগঞ্জ", "upazilas": [
                {"name_en": "Habiganj Sadar", "name_bn": "হবিগঞ্জ সদর"},
                {"name_en": "Madhabpur", "name_bn": "মাধবপুর"},
            ]},
            {"code": "MOU", "name_en": "Moulvibazar", "name_bn": "মৌলভীবাজার", "upazilas": [
                {"name_en": "Moulvibazar Sadar", "name_bn": "মৌলভীবাজার সদর"},
                {"name_en": "Sreemangal", "name_bn": "শ্রীমঙ্গল"},
            ]},
            {"code": "SUN", "name_en": "Sunamganj", "name_bn": "সুনামগঞ্জ", "upazilas": [
                {"name_en": "Sunamganj Sadar", "name_bn": "সুনামগঞ্জ সদর"},
                {"name_en": "Chhatak", "name_bn": "ছাতক"},
            ]},
            {"code": "SYL", "name_en": "Sylhet", "name_bn": "সিলেট", "upazilas": [
                {"name_en": "Sylhet Sadar", "name_bn": "সিলেট সদর"},
                {"name_en": "Beanibazar", "name_bn": "বিয়ানীবাজার"},
            ]},
        ],
    },
    {
        "code": "RNG", "name_en": "Rangpur", "name_bn": "রংপুর",
        "districts": [
            {"code": "DIN", "name_en": "Dinajpur", "name_bn": "দিনাজপুর", "upazilas": [
                {"name_en": "Dinajpur Sadar", "name_bn": "দিনাজপুর সদর"},
                {"name_en": "Birganj", "name_bn": "বীরগঞ্জ"},
            ]},
            {"code": "GAI", "name_en": "Gaibandha", "name_bn": "গাইবান্ধা", "upazilas": [
                {"name_en": "Gaibandha Sadar", "name_bn": "গাইবান্ধা সদর"},
                {"name_en": "Gobindaganj", "name_bn": "গোবিন্দগঞ্জ"},
            ]},
            {"code": "KUR", "name_en": "Kurigram", "name_bn": "কুড়িগ্রাম", "upazilas": [
                {"name_en": "Kurigram Sadar", "name_bn": "কুড়িগ্রাম সদর"},
                {"name_en": "Ulipur", "name_bn": "উলিপুর"},
            ]},
            {"code": "LAL", "name_en": "Lalmonirhat", "name_bn": "লালমনিরহাট", "upazilas": [
                {"name_en": "Lalmonirhat Sadar", "name_bn": "লালমনিরহাট সদর"},
                {"name_en": "Patgram", "name_bn": "পাটগ্রাম"},
            ]},
            {"code": "NIL", "name_en": "Nilphamari", "name_bn": "নীলফামারী", "upazilas": [
                {"name_en": "Nilphamari Sadar", "name_bn": "নীলফামারী সদর"},
                {"name_en": "Saidpur", "name_bn": "সৈয়দপুর"},
            ]},
            {"code": "PAN", "name_en": "Panchagarh", "name_bn": "পঞ্চগড়", "upazilas": [
                {"name_en": "Panchagarh Sadar", "name_bn": "পঞ্চগড় সদর"},
                {"name_en": "Debiganj", "name_bn": "দেবীগঞ্জ"},
            ]},
            {"code": "RNG", "name_en": "Rangpur", "name_bn": "রংপুর", "upazilas": [
                {"name_en": "Rangpur Sadar", "name_bn": "রংপুর সদর"},
                {"name_en": "Badarganj", "name_bn": "বদরগঞ্জ"},
            ]},
            {"code": "THA", "name_en": "Thakurgaon", "name_bn": "ঠাকুরগাঁও", "upazilas": [
                {"name_en": "Thakurgaon Sadar", "name_bn": "ঠাকুরগাঁও সদর"},
                {"name_en": "Pirganj", "name_bn": "পীরগঞ্জ"},
            ]},
        ],
    },
    {
        "code": "MYM", "name_en": "Mymensingh", "name_bn": "ময়মনসিংহ",
        "districts": [
            {"code": "JAM", "name_en": "Jamalpur", "name_bn": "জামালপুর", "upazilas": [
                {"name_en": "Jamalpur Sadar", "name_bn": "জামালপুর সদর"},
                {"name_en": "Sarishabari", "name_bn": "সরিষাবাড়ী"},
            ]},
            {"code": "MYM", "name_en": "Mymensingh", "name_bn": "ময়মনসিংহ", "upazilas": [
                {"name_en": "Mymensingh Sadar", "name_bn": "ময়মনসিংহ সদর"},
                {"name_en": "Bhaluka", "name_bn": "ভালুকা"},
            ]},
            {"code": "NET", "name_en": "Netrokona", "name_bn": "নেত্রকোনা", "upazilas": [
                {"name_en": "Netrokona Sadar", "name_bn": "নেত্রকোনা সদর"},
                {"name_en": "Mohanganj", "name_bn": "মোহনগঞ্জ"},
            ]},
            {"code": "SHE", "name_en": "Sherpur", "name_bn": "শেরপুর", "upazilas": [
                {"name_en": "Sherpur Sadar", "name_bn": "শেরপুর সদর"},
                {"name_en": "Nalitabari", "name_bn": "নালিতাবাড়ী"},
            ]},
        ],
    },
    {
        "code": "BAR", "name_en": "Barishal", "name_bn": "বরিশাল",
        "districts": [
            {"code": "BRG", "name_en": "Barguna", "name_bn": "বরগুনা", "upazilas": [
                {"name_en": "Barguna Sadar", "name_bn": "বরগুনা সদর"},
                {"name_en": "Amtali", "name_bn": "আমতলী"},
            ]},
            {"code": "BAR", "name_en": "Barishal", "name_bn": "বরিশাল", "upazilas": [
                {"name_en": "Barishal Sadar", "name_bn": "বরিশাল সদর"},
                {"name_en": "Bakerganj", "name_bn": "বাকেরগঞ্জ"},
            ]},
            {"code": "BHO", "name_en": "Bhola", "name_bn": "ভোলা", "upazilas": [
                {"name_en": "Bhola Sadar", "name_bn": "ভোলা সদর"},
                {"name_en": "Char Fasson", "name_bn": "চরফ্যাশন"},
            ]},
            {"code": "JHA", "name_en": "Jhalokati", "name_bn": "ঝালকাঠি", "upazilas": [
                {"name_en": "Jhalokati Sadar", "name_bn": "ঝালকাঠি সদর"},
                {"name_en": "Kathalia", "name_bn": "কাঠালিয়া"},
            ]},
            {"code": "PAT", "name_en": "Patuakhali", "name_bn": "পটুয়াখালী", "upazilas": [
                {"name_en": "Patuakhali Sadar", "name_bn": "পটুয়াখালী সদর"},
                {"name_en": "Kalapara", "name_bn": "কলাপাড়া"},
            ]},
            {"code": "PIR", "name_en": "Pirojpur", "name_bn": "পিরোজপুর", "upazilas": [
                {"name_en": "Pirojpur Sadar", "name_bn": "পিরোজপুর সদর"},
                {"name_en": "Mathbaria", "name_bn": "মঠবাড়িয়া"},
            ]},
        ],
    },
]


def seed_locations(db: Session):
    """Create the administrative hierarchy: 8 divisions, 64 districts,
    representative upazilas per district, and synthetic demonstration mouzas.

    Idempotent: rows are matched by their stable codes and only created when
    missing; existing names/relations are kept in sync. The Dhaka > Savar >
    Demo/Test/Sample Mouza anchors used by demo scenarios A-L are preserved.
    """
    division_count = district_count = upazila_count = 0

    for division_data in ADMIN_HIERARCHY:
        division = db.query(Division).filter(Division.code == division_data["code"]).first()
        if not division:
            division = Division(
                code=division_data["code"],
                name_en=division_data["name_en"],
                name_bn=division_data["name_bn"],
            )
            db.add(division)
            db.flush()
            division_count += 1
        else:
            division.name_en = division_data["name_en"]
            division.name_bn = division_data["name_bn"]

        for dist_data in division_data["districts"]:
            district = db.query(District).filter(District.code == dist_data["code"]).first()
            if not district:
                district = District(
                    code=dist_data["code"],
                    name_en=dist_data["name_en"],
                    name_bn=dist_data["name_bn"],
                    division_id=division.id,
                )
                db.add(district)
                db.flush()
                district_count += 1
            else:
                district.name_en = dist_data["name_en"]
                district.name_bn = dist_data["name_bn"]
                district.division_id = division.id

            for idx, upz_data in enumerate(dist_data["upazilas"], start=1):
                code = upz_data.get("code") or f"{dist_data['code']}{idx}"
                upazila = db.query(Upazila).filter(Upazila.code == code).first()
                if not upazila:
                    upazila = Upazila(
                        district_id=district.id,
                        name_en=upz_data["name_en"],
                        name_bn=upz_data["name_bn"],
                        code=code,
                    )
                    db.add(upazila)
                    db.flush()
                    upazila_count += 1
                else:
                    upazila.district_id = district.id
                    upazila.name_en = upz_data["name_en"]
                    upazila.name_bn = upz_data["name_bn"]

    db.commit()
    print(f"[OK] Seeded {division_count} new divisions, {district_count} new districts, "
          f"{upazila_count} new upazilas (8/64 totals enforced)")

    # --- Synthetic demonstration mouzas -----------------------------------
    # The three original demo mouzas under Savar keep their stable codes.
    savar = db.query(Upazila).filter(Upazila.code == "SAV").first()
    mouzas_data = [
        {"upazila_id": savar.id, "name_en": "Demo Mouza", "name_bn": "ডেমো মৌজা",
         "jl_no": "001", "code": "DM001",
         "description": "SYNTHETIC demonstration mouza (not an official land record)."},
        {"upazila_id": savar.id, "name_en": "Test Mouza", "name_bn": "টেস্ট মৌজা",
         "jl_no": "002", "code": "TM002",
         "description": "SYNTHETIC demonstration mouza (not an official land record)."},
        {"upazila_id": savar.id, "name_en": "Sample Mouza", "name_bn": "স্যাম্পল মৌজা",
         "jl_no": "003", "code": "SM003",
         "description": "SYNTHETIC demonstration mouza (not an official land record)."},
    ]

    for mz_data in mouzas_data:
        existing = db.query(Mouza).filter(
            Mouza.code == mz_data["code"],
            Mouza.upazila_id == mz_data["upazila_id"]
        ).first()
        if not existing:
            db.add(Mouza(**mz_data))
    db.flush()

    # One synthetic demonstration mouza per remaining upazila so the cascading
    # search can always resolve a mouza; these carry NO land records, which
    # demonstrates the "no demonstration record" empty state.
    mouza_count = 0
    for idx, upazila in enumerate(db.query(Upazila).order_by(Upazila.id).all(), start=1):
        if upazila.id == savar.id:
            continue
        existing = db.query(Mouza).filter(Mouza.upazila_id == upazila.id).first()
        if existing:
            continue
        db.add(Mouza(
            upazila_id=upazila.id,
            name_en=f"{upazila.name_en} Demonstration Mouza",
            name_bn=f"{upazila.name_bn} ডেমো মৌজা",
            jl_no=str(500 + idx),
            code=f"{upazila.code}M1",
            description="SYNTHETIC demonstration mouza (not an official land record).",
        ))
        mouza_count += 1

    db.commit()
    print(f"[OK] Seeded 3 demo mouzas + {mouza_count} synthetic mouzas (marked SYNTHETIC)")


def seed_owners(db: Session):
    """Create synthetic owner records"""
    owners_data = [
        {"name_en": "Md. Karim Ahmed", "name_bn": "মো. করিম আহমেদ", "father_name": "Md. Rahim Ahmed", "nid": "1234567890123"},
        {"name_en": "Fatema Begum", "name_bn": "ফাতেমা বেগম", "father_name": "Abdul Hamid", "nid": "2234567890124"},
        {"name_en": "Abdul Jabbar", "name_bn": "আব্দুল জব্বার", "father_name": "Habibullah", "nid": "3234567890125"},
        {"name_en": "Rahima Khatun", "name_bn": "রহিমা খাতুন", "father_name": "Kamal Uddin", "nid": "4234567890126"},
        {"name_en": "Md. Rahim Hasan", "name_bn": "মো. রহিম হাসান", "father_name": "Jamal Hasan", "nid": "5234567890127"},
        {"name_en": "Ayesha Siddika", "name_bn": "আয়েশা সিদ্দিকা", "father_name": "Siddique Ahmed", "nid": "6234567890128"},
        {"name_en": "Habibur Rahman", "name_bn": "হাবিবুর রহমান", "father_name": "Abdur Rahman", "nid": "7234567890129"},
        {"name_en": "Salma Khatun", "name_bn": "সালমা খাতুন", "father_name": "Fazlul Haque", "nid": "8234567890130"},
        {"name_en": "Md. Jamal Uddin", "name_bn": "মো. জামাল উদ্দিন", "father_name": "Nurul Islam", "nid": "9234567890131"},
        {"name_en": "Nasima Begum", "name_bn": "নাসিমা বেগম", "father_name": "Rashid Ahmed", "nid": "1034567890132"},
    ]

    created_owners = []
    for idx, owner_data in enumerate(owners_data, start=1):
        existing = db.query(Owner).filter(Owner.owner_id == f"BT-OWNER-{idx:06d}").first()
        if not existing:
            owner = Owner(
                owner_id=f"BT-OWNER-{idx:06d}",
                name_en=owner_data["name_en"],
                name_bn=owner_data["name_bn"],
                father_name=owner_data["father_name"],
                nid=owner_data["nid"],
                owner_type="individual",
                is_synthetic=True
            )
            db.add(owner)
            created_owners.append(owner)

    db.commit()
    print(f"[OK] Created {len(owners_data)} synthetic owners")
    return created_owners


def seed_land_records(db: Session):
    """Create comprehensive land records with deterministic geometry.

    NOTE: dag numbering is sequential across khatians (dag_no = 120 + counter).
    SCENARIO_IDENTIFIERS depends on this exact scheme - do not change one
    without the other.
    """

    demo_mouza = db.query(Mouza).filter(Mouza.code == "DM001").first()
    if not demo_mouza:
        print("[FAIL] Demo Mouza not found")
        return

    base_lat = 23.8583
    base_lon = 90.2667

    khatians_data = [
        {"khatian_no": "342", "survey_type": "RS", "survey_year": 2015, "dag_count": 8},
        {"khatian_no": "343", "survey_type": "RS", "survey_year": 2015, "dag_count": 6},
        {"khatian_no": "344", "survey_type": "RS", "survey_year": 2015, "dag_count": 5},
        {"khatian_no": "128", "survey_type": "SA", "survey_year": 2010, "dag_count": 4},
        {"khatian_no": "129", "survey_type": "SA", "survey_year": 2010, "dag_count": 5},
    ]

    parcel_counter = 1

    for khat_data in khatians_data:
        existing_khatian = db.query(KhatianRecord).filter(
            KhatianRecord.mouza_id == demo_mouza.id,
            KhatianRecord.khatian_no == khat_data["khatian_no"],
            KhatianRecord.survey_type == khat_data["survey_type"]
        ).first()

        if existing_khatian:
            continue

        khatian = KhatianRecord(
            mouza_id=demo_mouza.id,
            khatian_no=khat_data["khatian_no"],
            survey_type=khat_data["survey_type"],
            survey_year=khat_data["survey_year"],
            status="active"
        )
        db.add(khatian)
        db.flush()

        for dag_idx in range(1, khat_data["dag_count"] + 1):
            dag_no = str(120 + parcel_counter)
            area_decimal = 25.0 + (parcel_counter % 10) * 5  # 25-70 decimal

            dag = DagRecord(
                khatian_id=khatian.id,
                dag_no=dag_no,
                area_decimal=area_decimal,
                land_class="Agricultural",
                land_use="Paddy",
                status="active"
            )
            db.add(dag)
            db.flush()

            parcel_id = f"BT-PARCEL-{parcel_counter:06d}"
            parcel = LandParcel(
                parcel_id=parcel_id,
                dag_id=dag.id,
                area_decimal=area_decimal,
                area_sqm=area_decimal * 436.0,
                status="active"
            )
            db.add(parcel)
            db.flush()

            polygon = generate_deterministic_polygon(parcel_counter, base_lat, base_lon, area_decimal)
            centroid = polygon.centroid

            parcel.centroid_lat = centroid.y
            parcel.centroid_lon = centroid.x
            parcel.perimeter_m = polygon.length * 111000  # Approximate

            geojson = create_geojson_from_polygon(polygon)
            geometry = PlotGeometry(
                parcel_id=parcel.id,
                geometry=f"SRID=4326;{polygon.wkt}",
                geojson=geojson
            )
            db.add(geometry)

            parcel_counter += 1

    db.commit()
    print(f"[OK] Created {parcel_counter - 1} parcels with deterministic geometry")


def seed_ownership_records(db: Session):
    """Create ownership records for generic (non-scenario) parcels.
    Scenario parcels receive explicit fixtures in seed_scenario_fixtures()."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = db.query(LandParcel).order_by(LandParcel.id).all()
    owners = db.query(Owner).all()

    if not owners:
        print("[FAIL] No owners found")
        return

    created = 0
    generic_idx = 0
    for parcel in parcels:
        if parcel.id in scenario_ids:
            continue

        existing = db.query(OwnershipRecord).filter(OwnershipRecord.parcel_id == parcel.id).first()
        if existing:
            generic_idx += 1
            continue

        owner = owners[generic_idx % len(owners)]
        generic_idx += 1

        ownership = OwnershipRecord(
            parcel_id=parcel.id,
            owner_id=owner.id,
            share_decimal=parcel.area_decimal,
            share_percentage=100.0,
            ownership_type="full",
            acquisition_date=_days_ago(365 * (generic_idx % 5 + 1)),
            acquisition_mode="inheritance" if generic_idx % 3 == 0 else "purchase",
            status="active"
        )
        db.add(ownership)
        created += 1

    db.commit()
    print(f"[OK] Created ownership records for {created} generic parcels")


def seed_historical_records(db: Session):
    """Create historical ownership records for generic (non-scenario) parcels.
    Scenario parcels receive explicit fixtures in seed_scenario_fixtures()."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]
    owners = db.query(Owner).all()

    for idx, parcel in enumerate(parcels):
        num_records = (idx % 3) + 1
        base_date = _days_ago(365 * 10)

        for i in range(num_records):
            existing = db.query(HistoricalRecord).filter(
                HistoricalRecord.parcel_id == parcel.id
            ).count()

            if existing >= num_records:
                continue

            prev_owner = owners[(idx + i) % len(owners)]
            new_owner = owners[(idx + i + 1) % len(owners)]

            historical = HistoricalRecord(
                parcel_id=parcel.id,
                record_date=base_date + timedelta(days=365 * i * 2),
                record_type="ownership_change",
                previous_owner=prev_owner.name_en,
                new_owner=new_owner.name_en,
                transaction_type="sale" if i % 2 == 0 else "inheritance",
                area_decimal=float(parcel.area_decimal),
                deed_no=f"DEED-{parcel.parcel_id}-{i+1}" if i % 2 == 0 else None,
                description=f"Historical ownership transfer from {prev_owner.name_en} to {new_owner.name_en}",
                source="Synthetic Demo Data"
            )
            db.add(historical)

    db.commit()
    print("[OK] Created historical records")


def seed_mutation_records(db: Session):
    """Create mutation records for generic (non-scenario) parcels.
    Scenario parcels receive explicit fixtures in seed_scenario_fixtures()."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]
    owners = db.query(Owner).all()

    mutation_statuses = ["approved", "pending", "in_review", "pending", "approved"]
    created = 0

    for idx, parcel in enumerate(parcels):
        # Skip every 5th generic parcel so "no mutation found" cases also exist
        if idx % 5 == 0:
            continue

        existing = db.query(MutationRecord).filter(MutationRecord.parcel_id == parcel.id).first()
        if existing:
            continue

        status = mutation_statuses[idx % len(mutation_statuses)]
        prev_owner = owners[idx % len(owners)]
        new_owner = owners[(idx + 1) % len(owners)]

        application_date = _days_ago(180 + (idx * 10))
        approval_date = application_date + timedelta(days=90) if status == "approved" else None

        mutation = MutationRecord(
            parcel_id=parcel.id,
            mutation_no=f"MUT-{parcel.parcel_id}-{idx:03d}" if status != "pending" else None,
            application_date=application_date,
            approval_date=approval_date,
            status=status,
            previous_owner=prev_owner.name_en,
            new_owner=new_owner.name_en,
            area_decimal=float(parcel.area_decimal),
            mutation_type="sale" if idx % 2 == 0 else "inheritance",
            remarks=f"Mutation {status}" if status == "pending" else None
        )
        db.add(mutation)
        created += 1

    db.commit()
    print(f"[OK] Created mutation records for {created} generic parcels")


def seed_case_records(db: Session):
    """Create case/dispute records for generic (non-scenario) parcels.
    Deterministic placement: every 4th generic parcel, starting at position 2.
    Scenario parcels receive explicit fixtures in seed_scenario_fixtures()."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]
    owners = db.query(Owner).all()

    case_types = ["civil", "land_dispute", "civil", "land_dispute"]
    case_statuses = ["pending", "ongoing", "resolved", "ongoing", "pending"]
    created = 0

    for idx, parcel in enumerate(parcels):
        if idx % 4 != 2:
            continue

        existing = db.query(CaseRecord).filter(CaseRecord.parcel_id == parcel.id).first()
        if existing:
            continue

        case = CaseRecord(
            parcel_id=parcel.id,
            case_no=f"CASE-{parcel.parcel_id}-{idx:03d}",
            case_type=case_types[idx % len(case_types)],
            court_name="Synthetic District Court",
            filing_date=_days_ago(365 + (idx * 30)),
            status=case_statuses[idx % len(case_statuses)],
            plaintiff=owners[idx % len(owners)].name_en,
            defendant=owners[(idx + 1) % len(owners)].name_en,
            case_summary=f"Land dispute regarding {parcel.parcel_id}",
            judgment="Case resolved in favor of plaintiff" if idx % 5 == 2 else None,
            judgment_date=_days_ago(30) if idx % 5 == 2 else None
        )
        db.add(case)
        created += 1

    db.commit()
    print(f"[OK] Created case records for {created} generic parcels")


def seed_government_status_records(db: Session):
    """Create government/khas status records for generic (non-scenario) parcels.
    Deterministic placement: every 5th generic parcel, starting at position 3."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]

    status_types = ["khas", "government", "protected"]
    created = 0

    for idx, parcel in enumerate(parcels):
        if idx % 5 != 3:
            continue

        existing = db.query(GovernmentStatusRecord).filter(
            GovernmentStatusRecord.parcel_id == parcel.id
        ).first()
        if existing:
            continue

        status_type = status_types[idx % len(status_types)]

        gov_status = GovernmentStatusRecord(
            parcel_id=parcel.id,
            status_type=status_type,
            authority="Synthetic Land Administration" if status_type == "khas" else "Synthetic Government Department",
            designation_date=_days_ago(1000),
            area_decimal=float(parcel.area_decimal),
            restrictions="Government interest recorded" if status_type == "government" else "Khas land",
            is_active=True
        )
        db.add(gov_status)
        created += 1

    db.commit()
    print(f"[OK] Created government status records for {created} generic parcels")


def seed_acquisition_records(db: Session):
    """Create acquisition records for generic (non-scenario) parcels.
    Deterministic placement: every 6th generic parcel, starting at position 4."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]

    acquisition_statuses = ["proposed", "notified", "acquired"]
    created = 0

    for idx, parcel in enumerate(parcels):
        if idx % 6 != 4:
            continue

        existing = db.query(AcquisitionRecord).filter(
            AcquisitionRecord.parcel_id == parcel.id
        ).first()
        if existing:
            continue

        status = acquisition_statuses[idx % len(acquisition_statuses)]

        acquisition = AcquisitionRecord(
            parcel_id=parcel.id,
            acquisition_no=f"ACQ-{parcel.parcel_id}-{idx:03d}",
            acquiring_authority="Synthetic Development Authority",
            purpose="Infrastructure development project (synthetic)",
            notification_date=_days_ago(200) if status != "proposed" else None,
            acquisition_date=_days_ago(50) if status == "acquired" else None,
            status=status,
            area_decimal=float(parcel.area_decimal),
            compensation_amount=float(parcel.area_decimal) * 50000 if status == "acquired" else None,
            remarks=f"Acquisition {status}"
        )
        db.add(acquisition)
        created += 1

    db.commit()
    print(f"[OK] Created acquisition records for {created} generic parcels")


def seed_transactions(db: Session):
    """Create transaction records for generic (non-scenario) parcels.
    Scenario parcels receive explicit fixtures in seed_scenario_fixtures()."""
    scenario_ids = scenario_parcel_ids(db)
    parcels = [p for p in db.query(LandParcel).order_by(LandParcel.id).all() if p.id not in scenario_ids]
    owners = db.query(Owner).all()

    transaction_counter = 1
    created = 0

    for idx, parcel in enumerate(parcels):
        # Skip every 4th generic parcel so "no transactions" cases also exist
        if idx % 4 == 0:
            continue

        num_transactions = 1 if idx % 3 == 0 else 2

        for i in range(num_transactions):
            existing_count = db.query(Transaction).filter(
                Transaction.parcel_id == parcel.id
            ).count()

            if existing_count >= num_transactions:
                continue

            seller = owners[(idx + i) % len(owners)]
            buyer = owners[(idx + i + 1) % len(owners)]

            # NOTE: generic parcels keep areas within total; overlap signals are
            # built explicitly in scenario fixtures (SCENARIO_F).
            transaction_area = float(parcel.area_decimal) if i == 0 else float(parcel.area_decimal) * 0.4

            transaction = Transaction(
                transaction_id=f"BT-TXN-{transaction_counter:06d}",
                parcel_id=parcel.id,
                transaction_date=_days_ago(365 * (2 - i)),
                transaction_type="sale",
                seller_name=seller.name_en,
                buyer_name=buyer.name_en,
                area_decimal=transaction_area,
                sale_value=transaction_area * 100000,
                deed_no=f"DEED-{parcel.parcel_id}-TXN-{transaction_counter:03d}",
                registry_office="Synthetic Sub-Registry Office",
                status="completed"
            )
            db.add(transaction)
            transaction_counter += 1
            created += 1

    db.commit()
    print(f"[OK] Created {created} transaction records on generic parcels")


# ---------------------------------------------------------------------------
# Scenario fixtures - explicit, deterministic records per demo scenario
# ---------------------------------------------------------------------------

def seed_scenario_fixtures(db: Session):
    """Attach exact supporting records to each scenario parcel via identifier
    lookups. Each block is idempotent (skips if records already exist)."""
    print("\nScenario fixtures:")
    now = datetime.now()

    def _has_ownership(parcel) -> bool:
        return db.query(OwnershipRecord).filter(OwnershipRecord.parcel_id == parcel.id).count() > 0

    def _has_mutation(parcel) -> bool:
        return db.query(MutationRecord).filter(MutationRecord.parcel_id == parcel.id).count() > 0

    def _has_case(parcel) -> bool:
        return db.query(CaseRecord).filter(CaseRecord.parcel_id == parcel.id).count() > 0

    def _has_gov(parcel) -> bool:
        return db.query(GovernmentStatusRecord).filter(GovernmentStatusRecord.parcel_id == parcel.id).count() > 0

    def _has_acq(parcel) -> bool:
        return db.query(AcquisitionRecord).filter(AcquisitionRecord.parcel_id == parcel.id).count() > 0

    def _has_txn(parcel) -> bool:
        return db.query(Transaction).filter(Transaction.parcel_id == parcel.id).count() > 0

    def _has_history(parcel) -> bool:
        return db.query(HistoricalRecord).filter(HistoricalRecord.parcel_id == parcel.id).count() > 0

    def _add_full_ownership(parcel, owner_name: str):
        if _has_ownership(parcel):
            return
        owner = get_owner_by_name(db, owner_name)
        db.add(OwnershipRecord(
            parcel_id=parcel.id,
            owner_id=owner.id,
            share_decimal=parcel.area_decimal,
            share_percentage=100.0,
            ownership_type="full",
            acquisition_date=_days_ago(1500),
            acquisition_mode="inheritance",
            status="active"
        ))

    def _add_approved_mutation(parcel, owner_name: str):
        if _has_mutation(parcel):
            return
        db.add(MutationRecord(
            parcel_id=parcel.id,
            mutation_no=f"MUT-{parcel.parcel_id}-001",
            application_date=_days_ago(900),
            approval_date=_days_ago(800),
            status="approved",
            previous_owner="Previous Synthetic Owner",
            new_owner=owner_name,
            area_decimal=float(parcel.area_decimal),
            mutation_type="inheritance",
        ))

    area_of = lambda p: float(p.area_decimal)

    # --- A: LOW CONCERN (RS 342 / dag 121) — clean, consistent record -------
    p = get_scenario_parcel(db, "SCENARIO_A")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Md. Karim Ahmed")
        _add_approved_mutation(p, "Md. Karim Ahmed")
        if not _has_history(p):
            db.add(HistoricalRecord(
                parcel_id=p.id,
                record_date=_days_ago(1500),
                record_type="ownership_change",
                previous_owner="Nasima Begum",
                new_owner="Md. Karim Ahmed",
                transaction_type="sale",
                area_decimal=area_of(p),  # consistent area
                deed_no=f"DEED-{p.parcel_id}-H1",
                description="Historical ownership transfer from Nasima Begum to Md. Karim Ahmed",
                source="Synthetic Demo Data"
            ))
        print(f"[OK] A (clean): {p.parcel_id}")

    # --- B: OWNERSHIP MISMATCH (RS 342 / dag 122) ---------------------------
    p = get_scenario_parcel(db, "SCENARIO_B")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Fatema Begum")
        _add_approved_mutation(p, "Fatema Begum")
        print(f"[OK] B (ownership mismatch target): {p.parcel_id}")

    # --- C: MUTATION PENDING (RS 342 / dag 123) -----------------------------
    p = get_scenario_parcel(db, "SCENARIO_C")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Abdul Jabbar")
        if not _has_mutation(p):
            db.add(MutationRecord(
                parcel_id=p.id,
                mutation_no=None,
                application_date=_days_ago(60),
                approval_date=None,
                status="pending",
                previous_owner="Previous Synthetic Owner",
                new_owner="Abdul Jabbar",
                area_decimal=float(p.area_decimal),
                mutation_type="sale",
                remarks="Mutation application under process (synthetic)"
            ))
        print(f"[OK] C (mutation pending): {p.parcel_id}")

    # --- D: AREA/SHARE CONFLICT (RS 342 / dag 124) ---------------------------
    # Joint ownership 50/50; the demo claim asserts the FULL area for one
    # co-owner, which the area/share check must flag.
    p = get_scenario_parcel(db, "SCENARIO_D")
    if p and not _has_ownership(p):
        o1 = get_owner_by_name(db, "Rahima Khatun")
        o2 = get_owner_by_name(db, "Md. Rahim Hasan")
        half = float(p.area_decimal) / 2
        db.add(OwnershipRecord(
            parcel_id=p.id, owner_id=o1.id,
            share_decimal=half, share_percentage=50.0,
            ownership_type="joint", acquisition_date=_days_ago(1500),
            acquisition_mode="inheritance", status="active"
        ))
        db.add(OwnershipRecord(
            parcel_id=p.id, owner_id=o2.id,
            share_decimal=half, share_percentage=50.0,
            ownership_type="joint", acquisition_date=_days_ago(1500),
            acquisition_mode="inheritance", status="active"
        ))
        _add_approved_mutation(p, "Rahima Khatun")
        print(f"[OK] D (joint 50/50 ownership): {p.parcel_id}")

    # --- E: CASE SIGNAL (RS 342 / dag 125) -----------------------------------
    p = get_scenario_parcel(db, "SCENARIO_E")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Ayesha Siddika")
        _add_approved_mutation(p, "Ayesha Siddika")
        if not _has_case(p):
            db.add(CaseRecord(
                parcel_id=p.id,
                case_no=f"CASE-{p.parcel_id}-E01",
                case_type="land_dispute",
                court_name="Synthetic District Court",
                filing_date=_days_ago(90),
                status="pending",
                plaintiff="Third Party Synthetic Claimant",
                defendant="Ayesha Siddika",
                case_summary=f"Pending title dispute regarding {p.parcel_id}",
            ))
        print(f"[OK] E (case signal): {p.parcel_id}")

    # --- F: TRANSACTION OVERLAP (RS 342 / dag 126) ---------------------------
    # Two completed prior transactions totalling 150% of the parcel area.
    p = get_scenario_parcel(db, "SCENARIO_F")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Habibur Rahman")
        _add_approved_mutation(p, "Habibur Rahman")
        if not _has_txn(p):
            db.add(Transaction(
                transaction_id=f"BT-TXN-{p.id}01",
                parcel_id=p.id,
                transaction_date=_days_ago(730),
                transaction_type="sale",
                seller_name="Habibur Rahman",
                buyer_name="First Synthetic Buyer",
                area_decimal=area_of(p),                  # 100%
                sale_value=area_of(p) * 100000,
                deed_no=f"DEED-{p.parcel_id}-T1",
                registry_office="Synthetic Sub-Registry Office",
                status="completed"
            ))
            db.add(Transaction(
                transaction_id=f"BT-TXN-{p.id}02",
                parcel_id=p.id,
                transaction_date=_days_ago(365),
                transaction_type="sale",
                seller_name="Habibur Rahman",
                buyer_name="Second Synthetic Buyer",
                area_decimal=area_of(p) * 0.5,            # +50% -> 150% total
                sale_value=area_of(p) * 0.5 * 100000,
                deed_no=f"DEED-{p.parcel_id}-T2",
                registry_office="Synthetic Sub-Registry Office",
                status="completed"
            ))
        print(f"[OK] F (transaction overlap 150%): {p.parcel_id}")

    # --- G: ACQUISITION SIGNAL (RS 342 / dag 127) ----------------------------
    p = get_scenario_parcel(db, "SCENARIO_G")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Salma Khatun")
        _add_approved_mutation(p, "Salma Khatun")
        if not _has_acq(p):
            db.add(AcquisitionRecord(
                parcel_id=p.id,
                acquisition_no=f"ACQ-{p.parcel_id}-G01",
                acquiring_authority="Synthetic Development Authority",
                purpose="Road expansion project (synthetic)",
                notification_date=_days_ago(120),
                status="notified",
                area_decimal=float(p.area_decimal),
            ))
        print(f"[OK] G (acquisition notified): {p.parcel_id}")

    # --- H: GOVERNMENT/KHAS SIGNAL (RS 342 / dag 128, corrected) -------------
    p = get_scenario_parcel(db, "SCENARIO_H")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Md. Jamal Uddin")
        _add_approved_mutation(p, "Md. Jamal Uddin")
        if not _has_gov(p):
            db.add(GovernmentStatusRecord(
                parcel_id=p.id,
                status_type="khas",
                authority="Synthetic Land Administration",
                designation_date=_days_ago(1000),
                area_decimal=float(p.area_decimal),
                restrictions="Khas land - government interest recorded",
                is_active=True
            ))
        print(f"[OK] H (khas signal): {p.parcel_id}")

    # --- I: HISTORICAL TRANSITION (RS 343 / dag 129) -------------------------
    # Multiple transitions with an area inconsistency in the chain.
    p = get_scenario_parcel(db, "SCENARIO_I")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Nasima Begum")
        _add_approved_mutation(p, "Nasima Begum")
        if not _has_history(p):
            db.add(HistoricalRecord(
                parcel_id=p.id, record_date=_days_ago(3650),
                record_type="ownership_change",
                previous_owner="Original Synthetic Owner",
                new_owner="Second Synthetic Owner",
                transaction_type="inheritance",
                area_decimal=area_of(p),
                description="Initial recorded transition (CS-era record)",
                source="Synthetic Demo Data"
            ))
            db.add(HistoricalRecord(
                parcel_id=p.id, record_date=_days_ago(2200),
                record_type="ownership_change",
                previous_owner="Second Synthetic Owner",
                new_owner="Third Synthetic Owner",
                transaction_type="sale",
                area_decimal=area_of(p) * 0.8,  # INCONSISTENT with parcel area
                deed_no=f"DEED-{p.parcel_id}-H2",
                description="Transition recorded with reduced area (inconsistent)",
                source="Synthetic Demo Data"
            ))
            db.add(HistoricalRecord(
                parcel_id=p.id, record_date=_days_ago(900),
                record_type="ownership_change",
                previous_owner="Third Synthetic Owner",
                new_owner="Nasima Begum",
                transaction_type="sale",
                area_decimal=area_of(p),
                deed_no=f"DEED-{p.parcel_id}-H3",
                description="Most recent transition",
                source="Synthetic Demo Data"
            ))
        print(f"[OK] I (historical chain with area inconsistency): {p.parcel_id}")

    # --- J: MULTIPLE RISKS (RS 343 / dag 130) --------------------------------
    # Pending case + pending mutation simultaneously.
    p = get_scenario_parcel(db, "SCENARIO_J")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Md. Karim Ahmed")
        if not _has_case(p):
            db.add(CaseRecord(
                parcel_id=p.id,
                case_no=f"CASE-{p.parcel_id}-J01",
                case_type="civil",
                court_name="Synthetic District Court",
                filing_date=_days_ago(200),
                status="ongoing",
                plaintiff="Adjacent Synthetic Owner",
                defendant="Md. Karim Ahmed",
                case_summary=f"Boundary dispute regarding {p.parcel_id}",
            ))
        if not _has_mutation(p):
            db.add(MutationRecord(
                parcel_id=p.id,
                mutation_no=None,
                application_date=_days_ago(45),
                approval_date=None,
                status="in_review",
                previous_owner="Previous Synthetic Owner",
                new_owner="Md. Karim Ahmed",
                area_decimal=float(p.area_decimal),
                mutation_type="sale",
                remarks="Under review (synthetic)"
            ))
        print(f"[OK] J (case + mutation pending): {p.parcel_id}")

    # --- K: INSUFFICIENT DATA (RS 343 / dag 131, corrected) ------------------
    # Deliberately NO ownership, mutation, history, or transaction records.
    p = get_scenario_parcel(db, "SCENARIO_K")
    if p:
        print(f"[OK] K (no records - insufficient data): {p.parcel_id}")

    # --- L: CRITICAL COMBINED (RS 343 / dag 132, corrected) ------------------
    # Case pending + acquisition notified (+ ownership mismatch via claim).
    p = get_scenario_parcel(db, "SCENARIO_L")
    if p and not _has_ownership(p):
        _add_full_ownership(p, "Fatema Begum")
        if not _has_case(p):
            db.add(CaseRecord(
                parcel_id=p.id,
                case_no=f"CASE-{p.parcel_id}-L01",
                case_type="land_dispute",
                court_name="Synthetic District Court",
                filing_date=_days_ago(150),
                status="pending",
                plaintiff="Competing Synthetic Claimant",
                defendant="Fatema Begum",
                case_summary=f"Ownership dispute regarding {p.parcel_id}",
            ))
        if not _has_acq(p):
            db.add(AcquisitionRecord(
                parcel_id=p.id,
                acquisition_no=f"ACQ-{p.parcel_id}-L01",
                acquiring_authority="Synthetic Development Authority",
                purpose="Flood control project (synthetic)",
                notification_date=_days_ago(100),
                status="notified",
                area_decimal=float(p.area_decimal),
            ))
        print(f"[OK] L (case + acquisition + mismatch claim): {p.parcel_id}")

    db.commit()


# ---------------------------------------------------------------------------
# Demo scenario metadata
# ---------------------------------------------------------------------------

def _scenario_claims(scenario_id: str, parcel) -> dict:
    """Deterministic seller claim to enter for each scenario (used by the
    verification workflow, tests, and future scenario selector)."""
    a = float(parcel.area_decimal)
    claims = {
        "SCENARIO_A": {"claimed_owner_name": "Md. Karim Ahmed", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_B": {"claimed_owner_name": "Ghulam Sakib", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_C": {"claimed_owner_name": "Abdul Jabbar", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_D": {"claimed_owner_name": "Rahima Khatun", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a, 2)},  # claims 100% while owning 50%
        "SCENARIO_E": {"claimed_owner_name": "Ayesha Siddika", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_F": {"claimed_owner_name": "Habibur Rahman", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.25, 2)},
        "SCENARIO_G": {"claimed_owner_name": "Salma Khatun", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_H": {"claimed_owner_name": "Md. Jamal Uddin", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_I": {"claimed_owner_name": "Nasima Begum", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_J": {"claimed_owner_name": "Md. Karim Ahmed", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
        "SCENARIO_K": {"claimed_owner_name": "Unknown Claimant", "claimed_share_decimal": 10.0, "claimed_sale_area_decimal": 5.0},
        "SCENARIO_L": {"claimed_owner_name": "Dostogir Hawlader", "claimed_share_decimal": a, "claimed_sale_area_decimal": round(a * 0.5, 2)},
    }
    return claims[scenario_id]


def seed_demo_scenarios(db: Session):
    """Create/update predefined demo scenarios with corrected, verified
    land identifiers and explicit parcel links."""

    scenarios = [
        {"scenario_id": "SCENARIO_A", "name_en": "Low Concern - Clean Record", "name_bn": "স্বল্প উদ্বেগ - পরিষ্কার রেকর্ড",
         "description_en": "All records match, no issues found", "description_bn": "সব রেকর্ড মিলেছে, কোন সমস্যা পাওয়া যায়নি",
         "scenario_type": "LOW_CONCERN", "expected_risk_level": "LOW_CONCERN", "display_order": 1},
        {"scenario_id": "SCENARIO_B", "name_en": "Ownership Mismatch", "name_bn": "মালিকানা অমিল",
         "description_en": "Seller name does not match recorded owner", "description_bn": "বিক্রেতার নাম রেকর্ডকৃত মালিকের সাথে মিলছে না",
         "scenario_type": "OWNERSHIP_MISMATCH", "expected_risk_level": "HIGH_ATTENTION", "display_order": 2},
        {"scenario_id": "SCENARIO_C", "name_en": "Mutation Pending", "name_bn": "মিউটেশন মুলতুবি",
         "description_en": "Mutation application pending approval", "description_bn": "মিউটেশন আবেদন অনুমোদনের অপেক্ষায়",
         "scenario_type": "MUTATION_PENDING", "expected_risk_level": "REVIEW_REQUIRED", "display_order": 3},
        {"scenario_id": "SCENARIO_D", "name_en": "Area/Share Conflict", "name_bn": "এলাকা/শেয়ার দ্বন্দ্ব",
         "description_en": "Seller claims full area while recorded share is 50%", "description_bn": "বিক্রেতা সম্পূর্ণ এলাকা দাবি করেন যেখানে রেকর্ডকৃত শেয়ার ৫০%",
         "scenario_type": "AREA_SHARE_CONFLICT", "expected_risk_level": "HIGH_ATTENTION", "display_order": 4},
        {"scenario_id": "SCENARIO_E", "name_en": "Case Signal", "name_bn": "মামলা সংকেত",
         "description_en": "Pending legal case found", "description_bn": "মুলতুবি আইনি মামলা পাওয়া গেছে",
         "scenario_type": "CASE_SIGNAL", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 5},
        {"scenario_id": "SCENARIO_F", "name_en": "Transaction Overlap", "name_bn": "লেনদেন ওভারল্যাপ",
         "description_en": "Multiple transactions exceed total area", "description_bn": "একাধিক লেনদেন মোট এলাকা অতিক্রম করেছে",
         "scenario_type": "TRANSACTION_OVERLAP", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 6},
        {"scenario_id": "SCENARIO_G", "name_en": "Acquisition Signal", "name_bn": "অধিগ্রহণ সংকেত",
         "description_en": "Land under acquisition process", "description_bn": "জমি অধিগ্রহণ প্রক্রিয়াধীন",
         "scenario_type": "ACQUISITION_SIGNAL", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 7},
        {"scenario_id": "SCENARIO_H", "name_en": "Government/Khas Signal", "name_bn": "সরকারি/খাস সংকেত",
         "description_en": "Government interest or khas land status", "description_bn": "সরকারি স্বার্থ বা খাস জমির অবস্থা",
         "scenario_type": "GOVERNMENT_KHAS_SIGNAL", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 8},
        {"scenario_id": "SCENARIO_I", "name_en": "Historical Record Transition", "name_bn": "ঐতিহাসিক রেকর্ড পরিবর্তন",
         "description_en": "Historical chain with an area inconsistency", "description_bn": "এলাকার অসঙ্গতিসহ ঐতিহাসিক রেকর্ড চেইন",
         "scenario_type": "HISTORICAL_TRANSITION", "expected_risk_level": "REVIEW_REQUIRED", "display_order": 9},
        {"scenario_id": "SCENARIO_J", "name_en": "Multiple Risk Signals", "name_bn": "একাধিক ঝুঁকি সংকেত",
         "description_en": "Pending case and pending mutation simultaneously", "description_bn": "একইসাথে মুলতুবি মামলা ও মিউটেশন",
         "scenario_type": "MULTIPLE_RISKS", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 10},
        {"scenario_id": "SCENARIO_K", "name_en": "Insufficient Data", "name_bn": "অপর্যাপ্ত তথ্য",
         "description_en": "Missing critical records prevent complete verification", "description_bn": "গুরুত্বপূর্ণ রেকর্ড অনুপস্থিত সম্পূর্ণ যাচাইকরণ প্রতিরোধ করে",
         "scenario_type": "INSUFFICIENT_DATA", "expected_risk_level": "INSUFFICIENT_DATA", "display_order": 11},
        {"scenario_id": "SCENARIO_L", "name_en": "Critical Combined Signals", "name_bn": "গুরুতর সম্মিলিত সংকেত",
         "description_en": "Case + Acquisition + Ownership mismatch", "description_bn": "মামলা + অধিগ্রহণ + মালিকানা অমিল",
         "scenario_type": "CRITICAL_COMBINED", "expected_risk_level": "CRITICAL_SIGNAL", "display_order": 12},
    ]

    for s in scenarios:
        ident = SCENARIO_IDENTIFIERS[s["scenario_id"]]
        parcel = get_scenario_parcel(db, s["scenario_id"])
        if not parcel:
            print(f"[FAIL] {s['scenario_id']}: parcel missing for {ident}")
            continue

        existing = db.query(DemoScenario).filter(
            DemoScenario.scenario_id == s["scenario_id"]
        ).first()

        values = dict(s)
        values.update({
            "district_name": "Dhaka",
            "upazila_name": "Savar",
            "mouza_name": "Demo Mouza",
            "survey_type": ident["survey_type"],
            "khatian_no": ident["khatian_no"],
            "dag_no": ident["dag_no"],
            "parcel_id": parcel.parcel_id,
            "expected_findings": {"seller_claim": _scenario_claims(s["scenario_id"], parcel)},
            "is_active": True,
        })

        if existing:
            for key, val in values.items():
                setattr(existing, key, val)
        else:
            db.add(DemoScenario(**values))

    db.commit()
    print(f"[OK] Created/updated {len(scenarios)} demo scenarios with explicit parcel links")


def seed_system_settings(db: Session):
    """Seed application-level system settings (idempotent, no secrets)."""
    settings = [
        {
            "key": "app.maintenance_mode", "value": "false", "value_type": "boolean",
            "category": "ui",
            "description_en": "Show a maintenance banner and disable new verifications",
            "description_bn": "মেইনটেন্যান্স ব্যানার দেখান এবং নতুন যাচাইকরণ বন্ধ রাখুন",
            "is_public": True, "is_editable": True,
        },
        {
            "key": "verification.max_checks_per_hour", "value": "60", "value_type": "integer",
            "category": "security",
            "description_en": "Maximum verification checks per citizen per hour",
            "description_bn": "প্রতি ঘণ্টায় প্রতি নাগরিকের সর্বোচ্চ যাচাইকরণ সংখ্যা",
            "is_public": False, "is_editable": True,
        },
        {
            "key": "reports.default_language", "value": "en", "value_type": "string",
            "category": "ui",
            "description_en": "Default language for generated due-diligence reports (en/bn)",
            "description_bn": "তৈরি হওয়া প্রতিবেদনের ডিফল্ট ভাষা (en/bn)",
            "is_public": True, "is_editable": True,
        },
    ]
    for s in settings:
        existing = db.query(SystemSetting).filter(SystemSetting.key == s["key"]).first()
        if existing:
            continue
        db.add(SystemSetting(**s))
    db.commit()
    print("[OK] Seeded application system settings")


# ---------------------------------------------------------------------------
# Jurisdiction-aware admin, Chouhaddi, inheritance review and legal updates
# (Features #4, #7, #8, #9). All values are SYNTHETIC demonstration data.
# ---------------------------------------------------------------------------

def seed_admin_jurisdictions(db: Session):
    """Assign each demo admin ONE upazila (server-side jurisdiction scope).

    admin1 -> Savar (the demo mouzas live here); admin2 -> Dhamrai so that the
    jurisdiction isolation between administrators is demonstrable.
    """
    assignments = {
        "admin1@bhoomitech.example": "SAV",
        "admin2@bhoomitech.example": "DHM",
    }
    for email, code in assignments.items():
        user = db.query(User).filter(User.email == email).first()
        if not user:
            continue
        upazila = db.query(Upazila).filter(Upazila.code == code).first()
        if upazila and user.assigned_upazila_id != upazila.id:
            user.assigned_upazila_id = upazila.id
    db.commit()
    print("[OK] Assigned demo admin jurisdictions (admin1 -> Savar, admin2 -> Dhamrai)")


def seed_chouhaddi(db: Session):
    """Populate Chouhaddi (four-side boundary) labels for demo parcels.

    Descriptive adjacent-land labels based on synthetic neighbours. These are
    NOT a legal cadastral boundary determination and carry no legal weight.
    """
    parcels = db.query(LandParcel).order_by(LandParcel.id).all()
    north_opts = ["Adjacent RS Plot", "Road (Synthetic)", "Canal (Synthetic)", "Adjacent SA Plot"]
    south_opts = ["Adjacent RS Plot", "Open Field (Synthetic)", "Drain (Synthetic)", "Adjacent SA Plot"]
    east_opts = ["Adjacent Dag (Synthetic)", "Approach Road (Synthetic)", "Neighbour Plot", "Pond (Synthetic)"]
    west_opts = ["Adjacent Dag (Synthetic)", "Neighbour Plot", "Boundary Pillar (Synthetic)", "Pond (Synthetic)"]
    updated = 0
    for idx, parcel in enumerate(parcels):
        if parcel.chouhaddi_north and parcel.chouhaddi_south:
            continue
        parcel.chouhaddi_north = f"{north_opts[idx % len(north_opts)]} #{idx + 1}"
        parcel.chouhaddi_south = f"{south_opts[(idx + 1) % len(south_opts)]} #{idx + 1}"
        parcel.chouhaddi_east = f"{east_opts[(idx + 2) % len(east_opts)]} #{idx + 1}"
        parcel.chouhaddi_west = f"{west_opts[(idx + 3) % len(west_opts)]} #{idx + 1}"
        parcel.chouhaddi_source = "synthetic_demonstration_data"
        updated += 1
    db.commit()
    print(f"[OK] Seeded Chouhaddi for {updated} parcels (synthetic demonstration data)")


def seed_inheritance_succession(db: Session):
    """Populate succession/heirship review fields on ownership records.

    Deterministic, synthetic-only pattern. No children's or family members'
    personal data is stored - only aggregate counts and share figures used to
    detect a POTENTIAL ownership/share inconsistency (never a legal finding).
    """
    records = db.query(OwnershipRecord).order_by(OwnershipRecord.id).all()
    updated = 0
    for idx, rec in enumerate(records):
        if rec.succession_status is not None:
            continue
        if rec.acquisition_mode == "inheritance":
            # every 3rd inherited record declares a share inconsistent with the
            # declared heir count -> surfaces a POTENTIAL inconsistency.
            rec.succession_record_available = True
            rec.succession_status = "available"
            rec.declared_heir_count = 3
            rec.recorded_inherited_share = (
                rec.share_decimal if idx % 3 else round(float(rec.share_decimal) - 4.0, 4)
            )
            rec.supporting_record_reference = f"BT-SUC-{100000 + idx:06d}"
        elif rec.acquisition_mode == "purchase":
            rec.succession_record_available = False
            rec.succession_status = "not_required"
            rec.supporting_record_reference = None
        else:
            rec.succession_status = "unclear"
        updated += 1
    db.commit()
    print(f"[OK] Seeded inheritance/succession review data for {updated} ownership records")


def seed_legal_updates(db: Session):
    """Seed bilingual Land & Registration Update content (admin-managed).

    Every entry references an OFFICIAL SOURCE (a .gov.bd style source name).
    Content is demonstrative/synthetic - not a legal notice from any authority.
    """
    savar = db.query(Upazila).filter(Upazila.code == "SAV").first()
    super_admin = db.query(User).filter(User.role == "super_admin").first()
    created_by = super_admin.id if super_admin else None

    updates = [
        {
            "title_en": "e-Mutation (Online Name Transfer) Application Process",
            "title_bn": "ই-মিউটেশন (অনলাইন নামজারি) আবেদন প্রক্রিয়া",
            "summary_en": "Land owners can apply for mutation of ownership through the national land services portal. Supporting documents and fees are required.",
            "summary_bn": "ভূমি মালিকরা জাতীয় ভূমি সেবা পোর্টালের মাধ্যমে নামজারির আবেদন করতে পারেন। প্রয়োজনীয় কাগজপত্র ও ফি প্রয়োজন।",
            "category": "Mutation", "days_ago": 2, "effective_days_ago": 1,
            "official_source_name": "Land Services Portal (Bangladesh)",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "Khatian (Record of Rights) Verification Guidance",
            "title_bn": "খতিয়ান (রেকর্ড অব রাইটস) যাচাই নির্দেশনা",
            "summary_en": "Citizens are advised to verify the khatian number, survey type and owner names against the latest published record before any land transaction.",
            "summary_bn": "যেকোনো জমি লেনদেনের আগে সর্বশেষ প্রকাশিত রেকর্ডের সাথে খতিয়ান নম্বর, জরিপ ধরন ও মালিকের নাম যাচাই করার পরামর্শ দেওয়া হচ্ছে।",
            "category": "Land Records", "days_ago": 5, "effective_days_ago": 4,
            "official_source_name": "Directorate of Land Records and Surveys",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "Mouza Map Availability Notice",
            "title_bn": "মৌজা ম্যাপ প্রাপ্তির নোটিশ",
            "summary_en": "Mouza maps may be obtained from the upazila land office. Digital copies are indicative and should be confirmed with the office record.",
            "summary_bn": "উপজেলা ভূমি অফিস থেকে মৌজা ম্যাপ সংগ্রহ করা যায়। ডিজিটাল কপি নির্দেশক এবং অফিস রেকর্ডের সাথে নিশ্চিত করা উচিত।",
            "category": "Land Map", "days_ago": 8, "effective_days_ago": 8,
            "official_source_name": "Upazila Land Office",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "Land Development Tax (Khajna) Payment Reminder",
            "title_bn": "ভূমি উন্নয়ন কর (খাজনা) পরিশোধের স্মারক",
            "summary_en": "Land development tax is payable annually. Citizens should retain the receipt as proof of payment for future verification.",
            "summary_bn": "ভূমি উন্নয়ন কর বার্ষিক পরিশোধযোগ্য। ভবিষ্যৎ যাচাইয়ের জন্য পরিশোধের রসিদ সংরক্ষণ করা উচিত।",
            "category": "Land Tax", "days_ago": 12, "effective_days_ago": 10,
            "official_source_name": "Land Tax Wing",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "Non-Agricultural (NA) Permission Guidance",
            "title_bn": "অকৃষি (এনএ) অনুমোদন সংক্রান্ত নির্দেশনা",
            "summary_en": "Conversion of agricultural land for non-agricultural use requires permission from the relevant authority. Confirm the land class before purchasing.",
            "summary_bn": "কৃষি জমি অকৃষি কাজে ব্যবহারের জন্য সংশ্লিষ্ট কর্তৃপক্ষের অনুমোদন প্রয়োজন। ক্রয়ের আগে জমির শ্রেণি নিশ্চিত করুন।",
            "category": "Land Administration", "days_ago": 15, "effective_days_ago": 15,
            "official_source_name": "Ministry of Land (Government of Bangladesh)",
            "official_source_url": "https://minland.gov.bd/",
        },
        {
            "title_en": "Deed Registration Procedure Overview",
            "title_bn": "দলিল রেজিস্ট্রেশন পদ্ধতি সংক্ষিপ্ত বিবরণ",
            "summary_en": "Sale deeds must be registered at the sub-registry office with applicable stamp duty. An unregistered deed does not transfer legal title.",
            "summary_bn": "বিক্রয় দলিল প্রযোজ্য স্ট্যাম্প ডিউটিসহ সাব-রেজিস্ট্রি অফিসে রেজিস্ট্রেশন করতে হবে। অ-নিবন্ধিত দলিলে বৈধ মালিকানা হস্তান্তর হয় না।",
            "category": "Registration", "days_ago": 20, "effective_days_ago": 18,
            "official_source_name": "Department of Registration",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "General Land Service Information Desk",
            "title_bn": "সাধারণ ভূমি সেবা তথ্য ডেস্ক",
            "summary_en": "General land service information and complaint support are available through the national land helpline during office hours.",
            "summary_bn": "জাতীয় ভূমি হেল্পলাইনের মাধ্যমে অফিস চলাকালীন সাধারণ ভূমি সেবার তথ্য ও অভিযোগ সহায়তা পাওয়া যায়।",
            "category": "General Land Service", "days_ago": 25, "effective_days_ago": 25,
            "official_source_name": "Land Service Helpline",
            "official_source_url": "https://land.gov.bd/",
        },
        {
            "title_en": "[Draft] Upcoming Land Records Digitization Update",
            "title_bn": "[খসড়া] আসন্ন ভূমি রেকর্ড ডিজিটাইজেশন আপডেট",
            "summary_en": "Draft entry awaiting administrator review before publication.",
            "summary_bn": "প্রকাশের আগে প্রশাসকের পর্যালোচনার অপেক্ষায় খসড়া এন্ট্রি।",
            "category": "Land Records", "days_ago": 1, "effective_days_ago": None,
            "official_source_name": "Directorate of Land Records and Surveys",
            "official_source_url": "https://land.gov.bd/",
            "status": "draft",
        },
    ]

    created = 0
    for data in updates:
        existing = db.query(LegalUpdate).filter(LegalUpdate.title_en == data["title_en"]).first()
        if existing:
            continue
        db.add(LegalUpdate(
            title_en=data["title_en"], title_bn=data["title_bn"],
            summary_en=data["summary_en"], summary_bn=data["summary_bn"],
            category=data["category"],
            publication_date=_days_ago(data["days_ago"]),
            effective_date=_days_ago(data["effective_days_ago"]) if data.get("effective_days_ago") is not None else None,
            official_source_name=data["official_source_name"],
            official_source_url=data["official_source_url"],
            language="both", status=data.get("status", "published"),
            upazila_id=savar.id if savar else None, created_by=created_by,
        ))
        created += 1
    db.commit()
    print(f"[OK] Seeded {created} Land & Registration Updates (admin-managed content)")


def seed_complete_database(db: Session):
    """Seed complete database with all synthetic data"""
    print("\n" + "=" * 60)
    print("BHOOMITECH - SEEDING SYNTHETIC DEMONSTRATION DATA")
    print("=" * 60 + "\n")

    try:
        print("1. Creating users...")
        seed_super_admin(db)
        seed_admin_users(db)
        seed_citizen_users(db)
        db.commit()

        print("\n2. Creating locations...")
        seed_locations(db)

        print("\n3. Creating owners...")
        seed_owners(db)

        print("\n4. Creating land records with geometry...")
        seed_land_records(db)

        print("\n5. Creating scenario fixtures (explicit records)...")
        seed_scenario_fixtures(db)

        print("\n6. Creating generic ownership records...")
        seed_ownership_records(db)

        print("\n7. Creating generic historical records...")
        seed_historical_records(db)

        print("\n8. Creating generic mutation records...")
        seed_mutation_records(db)

        print("\n9. Creating generic case records...")
        seed_case_records(db)

        print("\n10. Creating generic government status records...")
        seed_government_status_records(db)

        print("\n11. Creating generic acquisition records...")
        seed_acquisition_records(db)

        print("\n12. Creating generic transaction records...")
        seed_transactions(db)

        print("\n13. Creating demo scenarios...")
        seed_demo_scenarios(db)

        print("\n14. Creating application system settings...")
        seed_system_settings(db)

        print("\n15. Assigning admin jurisdictions...")
        seed_admin_jurisdictions(db)

        print("\n16. Creating Chouhaddi (four-side boundary) data...")
        seed_chouhaddi(db)

        print("\n17. Creating inheritance/succession review data...")
        seed_inheritance_succession(db)

        print("\n18. Creating Land & Registration Updates...")
        seed_legal_updates(db)

        print("\n" + "=" * 60)
        print("[OK] SYNTHETIC DATA SEEDING COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nDemo Accounts Created:")
        print("  Super Admin: superadmin@bhoomitech.example / SuperAdmin@2026")
        print("  Admin: admin1@bhoomitech.example / Admin@2026")
        print("  Citizen: citizen1@example.com / Citizen@2026")
        print("\nDemo Scenarios (Dhaka > Savar > Demo Mouza > RS):")
        print("  A. LOW CONCERN          - Khatian 342, Dag 121")
        print("  B. OWNERSHIP MISMATCH   - Khatian 342, Dag 122")
        print("  C. MUTATION PENDING     - Khatian 342, Dag 123")
        print("  D. AREA/SHARE CONFLICT  - Khatian 342, Dag 124")
        print("  E. CASE SIGNAL          - Khatian 342, Dag 125")
        print("  F. TRANSACTION OVERLAP  - Khatian 342, Dag 126")
        print("  G. ACQUISITION SIGNAL   - Khatian 342, Dag 127")
        print("  H. GOV/KHAS SIGNAL      - Khatian 342, Dag 128")
        print("  I. HISTORICAL TRANSITION- Khatian 343, Dag 129")
        print("  J. MULTIPLE RISK SIGNALS- Khatian 343, Dag 130")
        print("  K. INSUFFICIENT DATA    - Khatian 343, Dag 131")
        print("  L. CRITICAL COMBINED    - Khatian 343, Dag 132")
        print("\n")

    except Exception as e:
        print(f"\n[FAIL] Error during seeding: {e}")
        db.rollback()
        raise
