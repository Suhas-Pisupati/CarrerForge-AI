from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# Use DATABASE_URL from environment if available.
# Otherwise, use SQLite for local development.

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./resume_analyzer.db"
)

# Render/Heroku PostgreSQL URLs may start with postgres://
# SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )

# ==========================================
# DATABASE ENGINE
# ==========================================

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )

# ==========================================
# DATABASE SESSION
# ==========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# ==========================================
# DATABASE SESSION DEPENDENCY
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()