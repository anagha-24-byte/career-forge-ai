from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.rate_limit import otp_rate_limiter
from app.core.security import generate_session_token, hash_secret, normalize_phone
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, SessionToken
from app.schemas.auth import SendOtpRequest, OtpChallengeResponse, VerifyOtpRequest, AuthResponse
from app.schemas.user import UserRead
from app.services.sms_service import sms_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=OtpChallengeResponse)
async def send_otp(payload: SendOtpRequest, request: Request, db: Session = Depends(get_db)):
    """
    Validates mobile phone number and issues an OTP challenge via Twilio Verify
    or in secure local development challenge mode.
    """
    normalized = normalize_phone(payload.phone_country_code, payload.phone_number)

    # Rate limiting by IP and by phone number
    client_ip = request.client.host if request.client else "127.0.0.1"
    otp_rate_limiter.check(f"ip:{client_ip}")
    otp_rate_limiter.check(f"phone:{normalized}")

    result = await sms_service.send_otp(db, payload.name.strip(), normalized)
    return OtpChallengeResponse(**result)


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    payload: VerifyOtpRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Verifies the submitted 6-digit OTP code.
    If valid, finds or creates the student account and initializes a secure session.
    Sets an HttpOnly, SameSite session cookie and returns the access token.
    """
    normalized = normalize_phone(payload.phone_country_code, payload.phone_number)

    success, captured_name = await sms_service.verify_otp(db, normalized, payload.otp_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification failed. Please ensure the code is correct.",
        )

    # Find or create user
    user = db.query(User).filter(User.normalized_phone == normalized).first()
    is_new_user = False

    if not user:
        is_new_user = True
        user = User(
            name=captured_name or "Student",
            phone_country_code=payload.phone_country_code,
            phone_number=payload.phone_number,
            normalized_phone=normalized,
            target_role="Software Engineering Intern",
            experience_level="Second Year Student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate session token
    session_token = generate_session_token()
    token_hash = hash_secret(session_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session_record = SessionToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(session_record)
    db.commit()

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=session_token,
        httponly=True,
        max_age=settings.SESSION_EXPIRE_DAYS * 24 * 3600,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return AuthResponse(
        message="Authentication successful.",
        user=UserRead.model_validate(user),
        access_token=session_token,
        token_type="bearer",
        is_new_user=is_new_user,
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Terminates the user session, revokes the session token in the database,
    and removes the session cookie.
    """
    token = request.cookies.get(settings.COOKIE_NAME)
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()

    if token:
        token_hash = hash_secret(token)
        db.query(SessionToken).filter(SessionToken.token_hash == token_hash).delete()
        db.commit()

    # Clear cookie
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )

    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user details for the active session."""
    return UserRead.model_validate(current_user)
