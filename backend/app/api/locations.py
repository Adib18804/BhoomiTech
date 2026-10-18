from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.location import Division, District, Upazila, Mouza
from app.schemas.location import (
    DivisionResponse, DistrictResponse, UpazilaResponse, MouzaResponse
)

router = APIRouter()


@router.get("/divisions", response_model=List[DivisionResponse])
def get_divisions(db: Session = Depends(get_db)):
    """Get all divisions (bibhag) - top level of the administrative hierarchy"""
    divisions = db.query(Division).order_by(Division.name_en).all()
    return divisions


@router.get("/districts", response_model=List[DistrictResponse])
def get_districts(division_id: int = None, db: Session = Depends(get_db)):
    """Get districts, optionally filtered by division (cascading selection)"""
    query = db.query(District)
    if division_id:
        query = query.filter(District.division_id == division_id)
    districts = query.order_by(District.name_en).all()
    return districts


@router.get("/districts/{district_id}", response_model=DistrictResponse)
def get_district(district_id: int, db: Session = Depends(get_db)):
    """Get specific district"""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    return district


@router.get("/upazilas", response_model=List[UpazilaResponse])
def get_upazilas(district_id: int = None, db: Session = Depends(get_db)):
    """Get upazilas, optionally filtered by district"""
    query = db.query(Upazila)
    if district_id:
        query = query.filter(Upazila.district_id == district_id)
    upazilas = query.order_by(Upazila.name_en).all()
    return upazilas


@router.get("/upazilas/{upazila_id}", response_model=UpazilaResponse)
def get_upazila(upazila_id: int, db: Session = Depends(get_db)):
    """Get specific upazila"""
    upazila = db.query(Upazila).filter(Upazila.id == upazila_id).first()
    if not upazila:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upazila not found"
        )
    return upazila


@router.get("/mouzas", response_model=List[MouzaResponse])
def get_mouzas(upazila_id: int = None, db: Session = Depends(get_db)):
    """Get mouzas, optionally filtered by upazila"""
    query = db.query(Mouza)
    if upazila_id:
        query = query.filter(Mouza.upazila_id == upazila_id)
    mouzas = query.order_by(Mouza.name_en).all()
    return mouzas


@router.get("/mouzas/{mouza_id}", response_model=MouzaResponse)
def get_mouza(mouza_id: int, db: Session = Depends(get_db)):
    """Get specific mouza"""
    mouza = db.query(Mouza).filter(Mouza.id == mouza_id).first()
    if not mouza:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mouza not found"
        )
    return mouza
