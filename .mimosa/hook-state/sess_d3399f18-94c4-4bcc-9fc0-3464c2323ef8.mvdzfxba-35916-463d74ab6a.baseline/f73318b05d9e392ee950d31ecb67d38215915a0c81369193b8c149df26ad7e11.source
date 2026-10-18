from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal


class LandSearchRequest(BaseModel):
    district: str
    upazila: str
    mouza: str
    survey_type: str
    khatian_no: str
    dag_no: str


class PlotGeometryResponse(BaseModel):
    parcel_id: str
    geometry: dict  # GeoJSON
    centroid_lat: Optional[float]
    centroid_lon: Optional[float]
    area_decimal: Decimal
    area_sqm: Optional[Decimal]
    
    class Config:
        from_attributes = True


class OwnerResponse(BaseModel):
    id: int
    name_en: str
    name_bn: Optional[str]
    father_name: Optional[str]
    
    class Config:
        from_attributes = True


class OwnershipResponse(BaseModel):
    owner: OwnerResponse
    share_decimal: Decimal
    share_percentage: Optional[Decimal]
    ownership_type: str
    acquisition_date: Optional[datetime]
    status: str
    
    class Config:
        from_attributes = True


class HistoricalRecordResponse(BaseModel):
    id: int
    record_date: datetime
    record_type: str
    previous_owner: Optional[str]
    new_owner: Optional[str]
    transaction_type: Optional[str]
    area_decimal: Optional[Decimal]
    deed_no: Optional[str]
    description: Optional[str]
    
    class Config:
        from_attributes = True


class MutationRecordResponse(BaseModel):
    id: int
    mutation_no: Optional[str]
    application_date: Optional[datetime]
    approval_date: Optional[datetime]
    status: str
    previous_owner: Optional[str]
    new_owner: Optional[str]
    area_decimal: Optional[Decimal]
    mutation_type: Optional[str]
    
    class Config:
        from_attributes = True


class CaseRecordResponse(BaseModel):
    id: int
    case_no: Optional[str]
    case_type: str
    court_name: Optional[str]
    filing_date: Optional[datetime]
    status: str
    plaintiff: Optional[str]
    defendant: Optional[str]
    case_summary: Optional[str]
    
    class Config:
        from_attributes = True


class GovernmentStatusResponse(BaseModel):
    id: int
    status_type: str
    authority: Optional[str]
    designation_date: Optional[datetime]
    area_decimal: Optional[Decimal]
    restrictions: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class AcquisitionRecordResponse(BaseModel):
    id: int
    acquisition_no: Optional[str]
    acquiring_authority: str
    purpose: Optional[str]
    notification_date: Optional[datetime]
    acquisition_date: Optional[datetime]
    status: str
    area_decimal: Optional[Decimal]
    
    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    transaction_date: datetime
    transaction_type: str
    seller_name: Optional[str]
    buyer_name: Optional[str]
    area_decimal: Decimal
    sale_value: Optional[Decimal]
    deed_no: Optional[str]
    
    class Config:
        from_attributes = True


class LandParcelResponse(BaseModel):
    id: int
    parcel_id: str
    area_decimal: Decimal
    area_sqm: Optional[Decimal]
    centroid_lat: Optional[Decimal]
    centroid_lon: Optional[Decimal]
    status: str
    
    # Related data
    district: str
    upazila: str
    mouza: str
    survey_type: str
    khatian_no: str
    dag_no: str
    land_class: Optional[str]
    
    class Config:
        from_attributes = True


class LandParcelDetailResponse(BaseModel):
    parcel: LandParcelResponse
    ownership: List[OwnershipResponse]
    geometry: Optional[dict]  # GeoJSON
    
    class Config:
        from_attributes = True


class ChouhaddiBoundaries(BaseModel):
    north: Optional[str] = None
    south: Optional[str] = None
    east: Optional[str] = None
    west: Optional[str] = None


class ChouhaddiResponse(BaseModel):
    """Chouhaddi / four-side boundary information for a parcel.

    Sourced from synthetic demonstration data. This is descriptive neighbour
    information only - it is NOT a legal cadastral boundary determination.
    """
    parcel_id: str
    district: str
    upazila: str
    mouza: str
    survey_type: str
    khatian_no: str
    dag_no: str
    area_decimal: Optional[Decimal] = None
    chouhaddi: ChouhaddiBoundaries
    source: str = "synthetic_demonstration_data"
    note: str = "Synthetic demonstration data - not a legal cadastral boundary."

    class Config:
        from_attributes = True


class InheritanceReviewResponse(BaseModel):
    """Inheritance / heirship review (land-ownership consistency).

    Deterministic comparison of recorded ownership share against available
    synthetic succession data. This is NOT a legal conclusion and never
    exposes children's or family members' personal information.
    """
    parcel_id: str
    ownership_type: Optional[str] = None            # Purchased/Inherited/Gift-Heba/Transfer/Other
    acquisition_mode: Optional[str] = None
    succession_record_available: Optional[bool] = None
    declared_heir_count: Optional[int] = None
    recorded_inherited_share: Optional[Decimal] = None
    recorded_owner_share: Optional[Decimal] = None
    total_area_decimal: Optional[Decimal] = None
    expected_share_decimal: Optional[Decimal] = None
    seller_recorded_share: Optional[Decimal] = None
    succession_status: Optional[str] = None
    supporting_record_reference: Optional[str] = None
    result: str                                      # result code
    result_label_en: str
    result_label_bn: str
    reason_en: str
    reason_bn: str
    is_legal_conclusion: bool = False
    source: str = "synthetic_demonstration_data"

    class Config:
        from_attributes = True
