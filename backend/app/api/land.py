from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
import json

from app.db.session import get_db
from app.models import (
    LandParcel, PlotGeometry, DagRecord, KhatianRecord, Mouza, Upazila, District,
    OwnershipRecord, Owner, HistoricalRecord, MutationRecord, CaseRecord,
    GovernmentStatusRecord, AcquisitionRecord, Transaction
)
from app.schemas.land import (
    LandSearchRequest, LandParcelResponse, LandParcelDetailResponse,
    PlotGeometryResponse, OwnershipResponse, OwnerResponse,
    HistoricalRecordResponse, MutationRecordResponse, CaseRecordResponse,
    GovernmentStatusResponse, AcquisitionRecordResponse, TransactionResponse,
    ChouhaddiBoundaries, ChouhaddiResponse, InheritanceReviewResponse,
)

router = APIRouter()


@router.post("/search", response_model=LandParcelDetailResponse)
def search_land(search_data: LandSearchRequest, db: Session = Depends(get_db)):
    """
    Search for land parcel by administrative identifiers
    Returns parcel details with geometry and ownership
    """
    
    # Find District
    district = db.query(District).filter(
        (District.name_en == search_data.district) | (District.name_bn == search_data.district)
    ).first()
    
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{search_data.district}' not found"
        )
    
    # Find Upazila
    upazila = db.query(Upazila).filter(
        Upazila.district_id == district.id,
        (Upazila.name_en == search_data.upazila) | (Upazila.name_bn == search_data.upazila)
    ).first()
    
    if not upazila:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upazila '{search_data.upazila}' not found in {district.name_en}"
        )
    
    # Find Mouza
    mouza = db.query(Mouza).filter(
        Mouza.upazila_id == upazila.id,
        (Mouza.name_en == search_data.mouza) | (Mouza.name_bn == search_data.mouza)
    ).first()
    
    if not mouza:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mouza '{search_data.mouza}' not found in {upazila.name_en}"
        )
    
    # Find Khatian
    khatian = db.query(KhatianRecord).filter(
        KhatianRecord.mouza_id == mouza.id,
        KhatianRecord.khatian_no == search_data.khatian_no,
        KhatianRecord.survey_type == search_data.survey_type
    ).first()
    
    if not khatian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Khatian {search_data.khatian_no} ({search_data.survey_type}) not found"
        )
    
    # Find Dag
    dag = db.query(DagRecord).filter(
        DagRecord.khatian_id == khatian.id,
        DagRecord.dag_no == search_data.dag_no
    ).first()
    
    if not dag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dag {search_data.dag_no} not found in Khatian {search_data.khatian_no}"
        )
    
    # Find Land Parcel
    parcel = db.query(LandParcel).filter(LandParcel.dag_id == dag.id).first()
    
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found for specified dag"
        )
    
    # Get geometry
    plot_geometry = db.query(PlotGeometry).filter(PlotGeometry.parcel_id == parcel.id).first()
    geometry_json = plot_geometry.geojson if plot_geometry else None
    
    # Get ownership records with owner details
    ownership_records = db.query(OwnershipRecord).options(
        joinedload(OwnershipRecord.owner)
    ).filter(OwnershipRecord.parcel_id == parcel.id).all()
    
    # Build response
    parcel_response = LandParcelResponse(
        id=parcel.id,
        parcel_id=parcel.parcel_id,
        area_decimal=parcel.area_decimal,
        area_sqm=parcel.area_sqm,
        centroid_lat=parcel.centroid_lat,
        centroid_lon=parcel.centroid_lon,
        status=parcel.status,
        district=district.name_en,
        upazila=upazila.name_en,
        mouza=mouza.name_en,
        survey_type=khatian.survey_type,
        khatian_no=khatian.khatian_no,
        dag_no=dag.dag_no,
        land_class=dag.land_class
    )
    
    ownership_response = [
        OwnershipResponse(
            owner=OwnerResponse(
                id=o.owner.id,
                name_en=o.owner.name_en,
                name_bn=o.owner.name_bn,
                father_name=o.owner.father_name
            ),
            share_decimal=o.share_decimal,
            share_percentage=o.share_percentage,
            ownership_type=o.ownership_type,
            acquisition_date=o.acquisition_date,
            status=o.status
        )
        for o in ownership_records
    ]
    
    return LandParcelDetailResponse(
        parcel=parcel_response,
        ownership=ownership_response,
        geometry=geometry_json
    )


@router.get("/{parcel_id}", response_model=LandParcelDetailResponse)
def get_land_parcel(parcel_id: str, db: Session = Depends(get_db)):
    """Get land parcel by parcel ID"""
    
    parcel = db.query(LandParcel).options(
        joinedload(LandParcel.dag).joinedload(DagRecord.khatian).joinedload(KhatianRecord.mouza).joinedload(Mouza.upazila).joinedload(Upazila.district)
    ).filter(LandParcel.parcel_id == parcel_id).first()
    
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    # Get related data
    dag = parcel.dag
    khatian = dag.khatian
    mouza = khatian.mouza
    upazila = mouza.upazila
    district = upazila.district
    
    # Get geometry
    plot_geometry = db.query(PlotGeometry).filter(PlotGeometry.parcel_id == parcel.id).first()
    geometry_json = plot_geometry.geojson if plot_geometry else None
    
    # Get ownership
    ownership_records = db.query(OwnershipRecord).options(
        joinedload(OwnershipRecord.owner)
    ).filter(OwnershipRecord.parcel_id == parcel.id).all()
    
    parcel_response = LandParcelResponse(
        id=parcel.id,
        parcel_id=parcel.parcel_id,
        area_decimal=parcel.area_decimal,
        area_sqm=parcel.area_sqm,
        centroid_lat=parcel.centroid_lat,
        centroid_lon=parcel.centroid_lon,
        status=parcel.status,
        district=district.name_en,
        upazila=upazila.name_en,
        mouza=mouza.name_en,
        survey_type=khatian.survey_type,
        khatian_no=khatian.khatian_no,
        dag_no=dag.dag_no,
        land_class=dag.land_class
    )
    
    ownership_response = [
        OwnershipResponse(
            owner=OwnerResponse(
                id=o.owner.id,
                name_en=o.owner.name_en,
                name_bn=o.owner.name_bn,
                father_name=o.owner.father_name
            ),
            share_decimal=o.share_decimal,
            share_percentage=o.share_percentage,
            ownership_type=o.ownership_type,
            acquisition_date=o.acquisition_date,
            status=o.status
        )
        for o in ownership_records
    ]
    
    return LandParcelDetailResponse(
        parcel=parcel_response,
        ownership=ownership_response,
        geometry=geometry_json
    )


@router.get("/{parcel_id}/geometry")
def get_plot_geometry(parcel_id: str, db: Session = Depends(get_db)):
    """Get plot geometry as GeoJSON"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    plot_geometry = db.query(PlotGeometry).filter(PlotGeometry.parcel_id == parcel.id).first()
    
    if not plot_geometry or not plot_geometry.geojson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geometry not found for this parcel"
        )
    
    return plot_geometry.geojson


@router.get("/{parcel_id}/ownership", response_model=List[OwnershipResponse])
def get_ownership(parcel_id: str, db: Session = Depends(get_db)):
    """Get ownership records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    ownership_records = db.query(OwnershipRecord).options(
        joinedload(OwnershipRecord.owner)
    ).filter(OwnershipRecord.parcel_id == parcel.id).all()
    
    return [
        OwnershipResponse(
            owner=OwnerResponse(
                id=o.owner.id,
                name_en=o.owner.name_en,
                name_bn=o.owner.name_bn,
                father_name=o.owner.father_name
            ),
            share_decimal=o.share_decimal,
            share_percentage=o.share_percentage,
            ownership_type=o.ownership_type,
            acquisition_date=o.acquisition_date,
            status=o.status
        )
        for o in ownership_records
    ]


@router.get("/{parcel_id}/history", response_model=List[HistoricalRecordResponse])
def get_history(parcel_id: str, db: Session = Depends(get_db)):
    """Get historical records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(HistoricalRecord).filter(
        HistoricalRecord.parcel_id == parcel.id
    ).order_by(HistoricalRecord.record_date.desc()).all()
    
    return records


@router.get("/{parcel_id}/mutation", response_model=List[MutationRecordResponse])
def get_mutation(parcel_id: str, db: Session = Depends(get_db)):
    """Get mutation records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(MutationRecord).filter(
        MutationRecord.parcel_id == parcel.id
    ).order_by(MutationRecord.application_date.desc()).all()
    
    return records


@router.get("/{parcel_id}/cases", response_model=List[CaseRecordResponse])
def get_cases(parcel_id: str, db: Session = Depends(get_db)):
    """Get case records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(CaseRecord).filter(
        CaseRecord.parcel_id == parcel.id
    ).order_by(CaseRecord.filing_date.desc()).all()
    
    return records


@router.get("/{parcel_id}/government-status", response_model=List[GovernmentStatusResponse])
def get_government_status(parcel_id: str, db: Session = Depends(get_db)):
    """Get government/khas status records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(GovernmentStatusRecord).filter(
        GovernmentStatusRecord.parcel_id == parcel.id
    ).all()
    
    return records


@router.get("/{parcel_id}/acquisition", response_model=List[AcquisitionRecordResponse])
def get_acquisition(parcel_id: str, db: Session = Depends(get_db)):
    """Get acquisition records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(AcquisitionRecord).filter(
        AcquisitionRecord.parcel_id == parcel.id
    ).order_by(AcquisitionRecord.notification_date.desc()).all()
    
    return records


@router.get("/{parcel_id}/transactions", response_model=List[TransactionResponse])
def get_transactions(parcel_id: str, db: Session = Depends(get_db)):
    """Get transaction records for a parcel"""
    
    parcel = db.query(LandParcel).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    
    records = db.query(Transaction).filter(
        Transaction.parcel_id == parcel.id
    ).order_by(Transaction.transaction_date.desc()).all()
    
    return records


# ---------------------------------------------------------------------------
# Chouhaddi / four-side boundaries (synthetic demonstration data)
# ---------------------------------------------------------------------------
def _resolve_parcel_hierarchy(db: Session, parcel_id: str):
    parcel = db.query(LandParcel).options(
        joinedload(LandParcel.dag).joinedload(DagRecord.khatian)
        .joinedload(KhatianRecord.mouza).joinedload(Mouza.upazila)
        .joinedload(Upazila.district)
    ).filter(LandParcel.parcel_id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land parcel not found"
        )
    dag = parcel.dag
    khatian = dag.khatian
    mouza = khatian.mouza
    upazila = mouza.upazila
    district = upazila.district
    return parcel, dag, khatian, mouza, upazila, district


@router.get("/{parcel_id}/chouhaddi", response_model=ChouhaddiResponse)
def get_chouhaddi(parcel_id: str, db: Session = Depends(get_db)):
    """Chouhaddi / four-side boundary information for a parcel.

    Values come from synthetic demonstration data only. This endpoint does NOT
    determine a legal cadastral boundary and does not use any external map or
    government portal.
    """
    parcel, dag, khatian, mouza, upazila, district = _resolve_parcel_hierarchy(db, parcel_id)
    return ChouhaddiResponse(
        parcel_id=parcel.parcel_id,
        district=district.name_en,
        upazila=upazila.name_en,
        mouza=mouza.name_en,
        survey_type=khatian.survey_type,
        khatian_no=khatian.khatian_no,
        dag_no=dag.dag_no,
        area_decimal=parcel.area_decimal,
        chouhaddi=ChouhaddiBoundaries(
            north=parcel.chouhaddi_north,
            south=parcel.chouhaddi_south,
            east=parcel.chouhaddi_east,
            west=parcel.chouhaddi_west,
        ),
        source=parcel.chouhaddi_source or "synthetic_demonstration_data",
    )


# ---------------------------------------------------------------------------
# Inheritance / heirship review (land-ownership consistency)
# ---------------------------------------------------------------------------
_ACQUISITION_LABELS = {
    "inheritance": "Inherited",
    "purchase": "Purchased",
    "gift": "Gift/Heba",
    "mutation": "Transfer",
}


@router.get("/{parcel_id}/inheritance", response_model=InheritanceReviewResponse)
def get_inheritance_review(parcel_id: str, db: Session = Depends(get_db)):
    """Inheritance / heirship review based on available synthetic records.

    Deterministic comparison of the recorded ownership share against the share
    represented by the available succession record. This is a land-ownership
    consistency review ONLY - not a legal conclusion. No internet, social
    media, family or children data is ever consulted.
    """
    parcel, dag, khatian, mouza, upazila, district = _resolve_parcel_hierarchy(db, parcel_id)

    ownership = (
        db.query(OwnershipRecord)
        .filter(OwnershipRecord.parcel_id == parcel.id,
                OwnershipRecord.status == "active")
        .order_by(OwnershipRecord.id)
        .first()
    )

    total_area = parcel.area_decimal
    acquisition_mode = ownership.acquisition_mode if ownership else None
    ownership_type = _ACQUISITION_LABELS.get(acquisition_mode, "Other") if acquisition_mode else None
    recorded_owner_share = ownership.share_decimal if ownership else None

    def build(result: str, label_en: str, label_bn: str,
              reason_en: str, reason_bn: str, expected=None):
        return InheritanceReviewResponse(
            parcel_id=parcel.parcel_id,
            ownership_type=ownership_type,
            acquisition_mode=acquisition_mode,
            succession_record_available=(ownership.succession_record_available if ownership else None),
            declared_heir_count=(ownership.declared_heir_count if ownership else None),
            recorded_inherited_share=(ownership.recorded_inherited_share if ownership else None),
            recorded_owner_share=recorded_owner_share,
            total_area_decimal=total_area,
            expected_share_decimal=expected,
            seller_recorded_share=recorded_owner_share,
            succession_status=(ownership.succession_status if ownership else None),
            supporting_record_reference=(ownership.supporting_record_reference if ownership else None),
            result=result,
            result_label_en=label_en,
            result_label_bn=label_bn,
            reason_en=reason_en,
            reason_bn=reason_bn,
        )

    if not ownership:
        return build(
            "insufficient_data",
            "Insufficient data",
            "অপর্যাপ্ত তথ্য",
            "No recorded ownership record is available for this parcel in the dataset.",
            "এই দাগের জন্য ডেটাসেটে কোনো রেকর্ডকৃত মালিকানা তথ্য পাওয়া যায়নি।",
        )

    # Non-inherited ownership: succession review is not applicable.
    if acquisition_mode != "inheritance":
        return build(
            "no_matching_inconsistency",
            "No matching inconsistency found in available synthetic data",
            "প্রাপ্ত সিন্থেটিক তথ্যে মিলে যাওয়া কোনো অসঙ্গতি পাওয়া যায়নি",
            "Recorded ownership does not indicate an inherited acquisition; no succession inconsistency was identified in the available data.",
            "রেকর্ডকৃত মালিকানা উত্তরাধিকারসূত্রে পাওয়া বোঝায় না; প্রাপ্ত তথ্যে কোনো উত্তরাধিকার-সংক্রান্ত অসঙ্গতি পাওয়া যায়নি।",
        )

    # Inherited but no succession record -> insufficient data.
    if not ownership.succession_record_available or not ownership.declared_heir_count:
        return build(
            "insufficient_data",
            "Insufficient data",
            "অপর্যাপ্ত তথ্য",
            "Ownership is recorded as inherited, but no matching succession record is available in the dataset to review the share.",
            "মালিকানা উত্তরাধিকারসূত্রে নেওয়া হিসেবে রেকর্ডকৃত, তবে শেয়ার যাচাইয়ের জন্য ডেটাসেটে কোনো উত্তরাধিকার রেকর্ড পাওয়া যায়নি।",
        )

    if total_area and ownership.declared_heir_count > 0:
        expected = total_area / ownership.declared_heir_count
        tolerance = Decimal("0.50")
        if recorded_owner_share is not None and abs(recorded_owner_share - expected) > tolerance:
            return build(
                "potential_inheritance_share_inconsistency",
                "Potential inheritance/share inconsistency",
                "উত্তরাধিকার/শেয়ারে সম্ভাব্য অসঙ্গতি",
                "The recorded ownership share differs from the share represented by the available succession record.",
                "রেকর্ডকৃত মালিকানা শেয়ার প্রাপ্ত উত্তরাধিকার রেকর্ডে উল্লিখিত শেয়ার থেকে ভিন্ন।",
                expected=expected,
            )
        return build(
            "no_matching_inconsistency",
            "No matching inconsistency found in available synthetic data",
            "প্রাপ্ত সিন্থেটিক তথ্যে মিলে যাওয়া কোনো অসঙ্গতি পাওয়া যায়নি",
            "The recorded ownership share is consistent with the available succession record.",
            "রেকর্ডকৃত মালিকানা শেয়ার প্রাপ্ত উত্তরাধিকার রেকর্ডের সাথে সঙ্গতিপূর্ণ।",
            expected=expected,
        )

    return build(
        "insufficient_data",
        "Insufficient data",
        "অপর্যাপ্ত তথ্য",
        "The available data is not sufficient to review the inheritance share.",
        "উত্তরাধিকার শেয়ার যাচাইয়ের জন্য প্রাপ্ত তথ্য যথেষ্ট নয়।",
    )
