from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from models.db_models import Base

# Create SQLite or PostgreSQL engine with connect timeout
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "postgresql" in settings.DATABASE_URL or "postgres" in settings.DATABASE_URL:
    connect_args["connect_timeout"] = 10

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    # Safe fallback to SQLite if connection fails
    engine = create_engine("sqlite:///./blindspot.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
