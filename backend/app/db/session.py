import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("careerforge.db")


def create_app_engine():
    """
    Attempts to initialize the configured primary PostgreSQL database engine.
    If PostgreSQL is unreachable or invalid during local development/tests,
    it falls back to SQLite, logging an explicit advisory.
    """
    primary_url = settings.DATABASE_URL
    try:
        if primary_url.startswith("postgresql"):
            # Use quick connect_timeout for initial probe so local execution is fast
            engine = create_engine(
                primary_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 2},
            )
            # Test connectivity
            with engine.connect() as conn:
                pass
            logger.info("Successfully connected to primary PostgreSQL database.")
            return engine
        else:
            engine = create_engine(
                primary_url,
                connect_args={"check_same_thread": False} if "sqlite" in primary_url else {},
            )
            return engine
    except Exception as exc:
        logger.warning(
            f"Primary database connection to '{primary_url}' failed: {exc}. "
            f"Falling back to local development SQLite database: '{settings.SQLITE_FALLBACK_URL}'."
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
        )


engine = create_app_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a SQLAlchemy database session for API requests."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
