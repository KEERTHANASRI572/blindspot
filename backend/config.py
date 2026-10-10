import os
from typing import Optional

class Settings:
    APP_NAME: str = "BLINDSPOT"
    API_V1_STR: str = "/api"
    
    # AI & Model Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./blindspot.db")
    
    # Security & Authentication
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "blindspot-forgehacks-super-secure-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

settings = Settings()
