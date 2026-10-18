from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

# Project root (backend/app/core/config.py -> parents[3] = repository root).
# The start scripts keep .env at the repository root; resolve it explicitly so
# configuration loads regardless of the process working directory.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "BhoomiTech"
    API_V1_PREFIX: str = "/api"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/bhoomitech"
    
    # Security
    JWT_SECRET: str = "change-this-to-a-secure-random-secret"
    AUTH_SECRET: str = "change-this-to-another-secure-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Rate Limiting (Phase 9): in-memory sliding window, per client IP.
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10          # login / admin login / register / forgot-password
    RATE_LIMIT_VERIFICATION_PER_MINUTE: int = 20  # verification check and detail endpoints

    # Account lockout (Phase 8): after LOGIN_MAX_FAILED_ATTEMPTS consecutive
    # failed logins the account is temporarily locked for LOGIN_LOCKOUT_MINUTES.
    LOGIN_MAX_FAILED_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # NOTE: CORS_ORIGINS is List[str]; pydantic-settings parses dotenv values for
    # complex types as JSON, so it must be set as: CORS_ORIGINS=["url1","url2"]

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True


settings = Settings()
