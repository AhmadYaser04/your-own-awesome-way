"""SQLAlchemy database connection."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import config

engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
