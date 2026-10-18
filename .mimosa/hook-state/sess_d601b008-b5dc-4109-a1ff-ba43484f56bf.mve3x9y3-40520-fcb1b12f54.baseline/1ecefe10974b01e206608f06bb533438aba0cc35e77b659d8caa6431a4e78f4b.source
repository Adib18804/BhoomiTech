from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class SellerClaimRequest(BaseModel):
    claimed_owner_name: str
    claimed_share_decimal: float
    claimed_sale_area_decimal: float
    claimed_khatian: Optional[str] = None
    claimed_dag: Optional[str] = None
    claimed_survey_type: Optional[str] = None


class VerificationRequest(BaseModel):
    parcel_id: str
    seller_claim: SellerClaimRequest


class VerificationFindingResponse(BaseModel):
    check_type: str
    finding_type: str  # issue, warning, info, success
    severity: str  # low, medium, high, critical
    title_en: str
    title_bn: Optional[str] = None
    description_en: str
    description_bn: Optional[str] = None
    explanation_en: Optional[str] = None
    explanation_bn: Optional[str] = None
    recommendation_en: Optional[str] = None
    recommendation_bn: Optional[str] = None
    related_data: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class VerificationCheckResult(BaseModel):
    check_name: str
    status: str  # passed, warning, attention, critical, insufficient_data
    findings: List[VerificationFindingResponse]


class VerificationResultResponse(BaseModel):
    case_id: str
    parcel_id: str
    overall_risk_level: str  # LOW_CONCERN, REVIEW_REQUIRED, HIGH_ATTENTION, CRITICAL_SIGNAL, INSUFFICIENT_DATA
    risk_score: Optional[int]

    # Individual check results
    checks: List[VerificationCheckResult]

    # Summary
    total_checks: int
    passed_checks: int
    warnings: int
    critical_issues: int

    # Recommendations
    recommendations: List[str]

    # Metadata
    generated_at: datetime
    data_note: str = "SYNTHETIC DEMONSTRATION DATA"

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Verification case detail (GET /verification/{case_id})
# Explicit response schema - only safe fields required by the client.
# Never exposes: internal DB ids, user_id, the user relationship (which would
# leak password_hash / credentials), or verification metadata.
# ---------------------------------------------------------------------------

class SellerClaimDetailResponse(BaseModel):
    """Seller-supplied claim stored with the case (safe fields only)."""
    claimed_owner_name: str
    claimed_share_decimal: float
    claimed_sale_area_decimal: float
    claimed_khatian: Optional[str] = None
    claimed_dag: Optional[str] = None
    claimed_survey_type: Optional[str] = None

    class Config:
        from_attributes = True


class VerificationResultSummaryResponse(BaseModel):
    """Aggregated result stored for the case (safe fields only)."""
    overall_risk_level: str
    risk_score: Optional[int] = None
    total_checks: int = 0
    passed_checks: int = 0
    warnings: int = 0
    critical_issues: int = 0

    class Config:
        from_attributes = True


class VerificationFindingDetailResponse(BaseModel):
    """Single finding attached to the case (safe fields only, bilingual)."""
    check_type: str
    finding_type: str
    severity: str
    title_en: str
    title_bn: Optional[str] = None
    description_en: str
    description_bn: Optional[str] = None
    explanation_en: Optional[str] = None
    explanation_bn: Optional[str] = None
    recommendation_en: Optional[str] = None
    recommendation_bn: Optional[str] = None
    related_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class VerificationCaseDetailResponse(BaseModel):
    """Full verification case detail. Whitelist of safe fields."""
    case_id: str
    status: str
    overall_risk_level: Optional[str] = None

    # Land identifiers as recorded on the case
    district_name: str
    upazila_name: str
    mouza_name: str
    survey_type: str
    khatian_no: str
    dag_no: str

    # Public parcel identifier (BT-PARCEL-XXXXXX), not the internal FK
    parcel_id: Optional[str] = None

    initiated_at: datetime
    completed_at: Optional[datetime] = None

    seller_claim: Optional[SellerClaimDetailResponse] = None
    result: Optional[VerificationResultSummaryResponse] = None
    findings: List[VerificationFindingDetailResponse] = []

    data_note: str = "SYNTHETIC DEMONSTRATION DATA"

    class Config:
        from_attributes = True
