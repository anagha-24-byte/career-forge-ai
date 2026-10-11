import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import generate_session_token, hash_secret
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, SessionToken

# Use a clean test SQLite database
TEST_DB_URL = "sqlite:///./test_careerforge.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a(db) -> User:
    user = User(
        name="Student Alpha",
        phone_country_code="+91",
        phone_number="9876543210",
        normalized_phone="+919876543210",
        target_role="Software Engineer Intern",
        experience_level="Second Year Student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_b(db) -> User:
    user = User(
        name="Student Beta",
        phone_country_code="+91",
        phone_number="9123456789",
        normalized_phone="+919123456789",
        target_role="Data Analyst",
        experience_level="Third Year Student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_client_a(client, user_a, db) -> TestClient:
    token = generate_session_token()
    token_hash = hash_secret(token)
    session_rec = SessionToken(
        user_id=user_a.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(session_rec)
    db.commit()

    client.cookies.set(settings.COOKIE_NAME, token)
    return client


@pytest.fixture
def auth_client_b(user_b, db) -> TestClient:
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        token = generate_session_token()
        token_hash = hash_secret(token)
        session_rec = SessionToken(
            user_id=user_b.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(session_rec)
        db.commit()

        c.cookies.set(settings.COOKIE_NAME, token)
        yield c
    app.dependency_overrides.clear()
