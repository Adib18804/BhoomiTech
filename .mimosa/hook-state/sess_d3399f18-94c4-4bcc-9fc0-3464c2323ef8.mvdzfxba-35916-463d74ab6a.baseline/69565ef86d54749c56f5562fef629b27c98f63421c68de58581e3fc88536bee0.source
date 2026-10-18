from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    mobile: Optional[str] = None
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    preferred_language: str = "en"
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('mobile')
    def validate_mobile(cls, v):
        if v:
            # Bangladesh mobile validation
            v = v.replace(' ', '').replace('-', '')
            if not v.startswith('+880') and not v.startswith('880') and not v.startswith('01'):
                raise ValueError('Invalid Bangladesh mobile number format')
            if len(v) < 11:
                raise ValueError('Mobile number too short')
        return v
    
    @validator('preferred_language')
    def validate_language(cls, v):
        if v not in ['en', 'bn']:
            raise ValueError('Language must be "en" or "bn"')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    mobile: Optional[str]
    full_name: str
    role: str
    is_active: bool
    preferred_language: str
    
    class Config:
        from_attributes = True
