from pydantic import BaseModel
from typing import Optional


class DivisionResponse(BaseModel):
    id: int
    name_en: str
    name_bn: str
    code: str

    class Config:
        from_attributes = True


class DistrictResponse(BaseModel):
    id: int
    division_id: Optional[int] = None
    name_en: str
    name_bn: str
    code: str
    
    class Config:
        from_attributes = True


class UpazilaResponse(BaseModel):
    id: int
    district_id: int
    name_en: str
    name_bn: str
    code: str
    
    class Config:
        from_attributes = True


class MouzaResponse(BaseModel):
    id: int
    upazila_id: int
    name_en: str
    name_bn: str
    jl_no: Optional[str]
    code: str
    
    class Config:
        from_attributes = True
