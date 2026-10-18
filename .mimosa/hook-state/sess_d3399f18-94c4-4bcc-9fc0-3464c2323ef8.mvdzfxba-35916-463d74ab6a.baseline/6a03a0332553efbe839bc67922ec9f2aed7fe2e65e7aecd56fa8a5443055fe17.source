from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


LEGAL_UPDATE_STATUSES = ["draft", "published", "archived"]
LEGAL_UPDATE_CATEGORIES = [
    "Mutation", "Land Records", "Land Map", "Land Tax",
    "Acquisition", "Registration", "Land Administration", "General Land Service",
]


class LegalUpdateBase(BaseModel):
    title_en: str
    title_bn: Optional[str] = None
    summary_en: str
    summary_bn: Optional[str] = None
    category: str
    publication_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    official_source_name: Optional[str] = None
    official_source_url: Optional[str] = None
    language: str = "both"
    status: str = "draft"
    upazila_id: Optional[int] = None


class LegalUpdateCreate(LegalUpdateBase):
    pass


class LegalUpdateUpdate(BaseModel):
    title_en: Optional[str] = None
    title_bn: Optional[str] = None
    summary_en: Optional[str] = None
    summary_bn: Optional[str] = None
    category: Optional[str] = None
    publication_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    official_source_name: Optional[str] = None
    official_source_url: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None
    upazila_id: Optional[int] = None


class LegalUpdateResponse(LegalUpdateBase):
    id: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
