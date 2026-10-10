import os
from typing import Optional

class Settings:
    APP_NAME: str = "BLINDSPOT"
    API_V1_STR: str = "/api"
    
    # Server configuration
    PORT: int = int(os.getenv("PORT", "8000"))

    # AI & Model Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Database: SQLite only when DATABASE_URL is not set
    # Automatically convert postgres:// to postgresql:// for SQLAlchemy 2 compatibility
    _raw_db = os.getenv("DATABASE_URL", "").strip()
    if not _raw_db:
        DATABASE_URL: str = "sqlite:///./blindspot.db"
    elif _raw_db.startswith("postgres://"):
        DATABASE_URL: str = _raw_db.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL: str = _raw_db
    
    # Security & Authentication
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "blindspot-forgehacks-super-secure-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    
    # CORS: explicitly allow FRONTEND_URL and local dev
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()
