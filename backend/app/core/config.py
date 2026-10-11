import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerForge AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database: configured PostgreSQL primary URL, with fallback logic in session.py
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/careerforge"
    SQLITE_FALLBACK_URL: str = "sqlite:///./careerforge_dev.db"

    # Security & Session
    SECRET_KEY: str = "change-this-in-production-super-secret-key-careerforge-2026"
    SESSION_EXPIRE_DAYS: int = 14
    COOKIE_NAME: str = "careerforge_session"
    COOKIE_SECURE: bool = False  # Set to True in HTTPS production
    COOKIE_SAMESITE: str = "lax"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # SMS OTP
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""
    OTP_EXPIRE_SECONDS: int = 300  # 5 minutes
    OTP_MAX_ATTEMPTS: int = 5
    ALLOW_DEV_OTP: bool = True  # Allows dev simulated OTP when Twilio credentials are missing

    # AI (Anthropic Claude)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    AI_TIMEOUT_SECONDS: int = 35

    # Uploads
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
