from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_secret
from app.db.session import get_db
from app.models.user import User, SessionToken


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Validates authenticated user session from HttpOnly session cookie OR Bearer authorization header.
    Enforces expiration checks and per-user database isolation.
    """
    token = request.cookies.get(settings.COOKIE_NAME)

    # Check Authorization header fallback
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in with your phone number.",
        )

    token_hash = hash_secret(token)
    now_utc = datetime.now(timezone.utc)

    session_record = (
        db.query(SessionToken)
        .filter(SessionToken.token_hash == token_hash)
        .first()
    )

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
        )

    # Verify expiration
    exp = session_record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if now_utc > exp:
        db.delete(session_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
        )

    user = db.query(User).filter(User.id == session_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this session was not found.",
        )

    return user
