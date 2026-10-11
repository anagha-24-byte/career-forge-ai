import logging
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import generate_otp_code, hash_secret
from app.models.user import OtpChallenge

logger = logging.getLogger("careerforge.sms")


class SmsOtpService:
    @property
    def has_twilio_credentials(self) -> bool:
        return bool(
            settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and settings.TWILIO_VERIFY_SERVICE_SID
        )

    async def send_otp(self, db: Session, name: str, normalized_phone: str) -> dict:
        """
        Sends an SMS OTP or creates a local dev challenge if Twilio is not configured.
        """
        # Invalidate previous unused challenges for this phone
        existing_challenges = (
            db.query(OtpChallenge)
            .filter(OtpChallenge.phone_number == normalized_phone, OtpChallenge.is_used == False)
            .all()
        )
        for ch in existing_challenges:
            ch.is_used = True

        if self.has_twilio_credentials:
            # Twilio Verify API
            url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_VERIFY_SERVICE_SID}/Verifications"
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    url,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    data={"To": normalized_phone, "Channel": "sms"},
                    timeout=10.0,
                )
                if res.status_code not in (200, 201):
                    logger.error(f"Twilio Verify error: {res.text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Failed to dispatch SMS verification via Twilio provider.",
                    )

            db.commit()
            return {
                "message": f"Verification code sent to {normalized_phone}",
                "phone_number": normalized_phone,
                "expires_in_seconds": settings.OTP_EXPIRE_SECONDS,
                "dev_mode": False,
                "dev_otp": None,
            }
        else:
            # Local Development Mode
            otp_code = generate_otp_code()
            otp_hash = hash_secret(otp_code)
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)

            challenge = OtpChallenge(
                phone_number=normalized_phone,
                name=name,
                otp_code_hash=otp_hash,
                attempts=0,
                max_attempts=settings.OTP_MAX_ATTEMPTS,
                is_used=False,
                expires_at=expires_at,
            )
            db.add(challenge)
            db.commit()

            logger.info(
                f"[DEVELOPMENT OTP] Phone: {normalized_phone} | Name: {name} | OTP: {otp_code} (Valid for {settings.OTP_EXPIRE_SECONDS}s)"
            )

            return {
                "message": f"Dev mode: Verification code generated for {normalized_phone}",
                "phone_number": normalized_phone,
                "expires_in_seconds": settings.OTP_EXPIRE_SECONDS,
                "dev_mode": True,
                "dev_otp": otp_code,
            }

    async def verify_otp(self, db: Session, normalized_phone: str, otp_code: str) -> tuple[bool, str]:
        """
        Verifies the provided OTP code against Twilio Verify or local database challenge.
        Returns: (success: bool, user_name: str)
        """
        if self.has_twilio_credentials:
            url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck"
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    url,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    data={"To": normalized_phone, "Code": otp_code},
                    timeout=10.0,
                )
                if res.status_code == 200:
                    payload = res.json()
                    if payload.get("status") == "approved":
                        return True, ""
            return False, ""
        else:
            challenge = (
                db.query(OtpChallenge)
                .filter(
                    OtpChallenge.phone_number == normalized_phone,
                    OtpChallenge.is_used == False,
                )
                .order_by(OtpChallenge.created_at.desc())
                .first()
            )

            if not challenge:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active OTP challenge found for this phone number. Please request a new code.",
                )

            if challenge.attempts >= challenge.max_attempts:
                challenge.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum verification attempts exceeded. Please request a new code.",
                )

            now_utc = datetime.now(timezone.utc)
            # Ensure timezone awareness
            exp = challenge.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)

            if now_utc > exp:
                challenge.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The OTP code has expired. Please request a new code.",
                )

            challenge.attempts += 1
            expected_hash = hash_secret(otp_code)

            if challenge.otp_code_hash != expected_hash:
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid OTP code. Please check and try again.",
                )

            challenge.is_used = True
            user_name = challenge.name
            db.commit()
            return True, user_name


sms_service = SmsOtpService()
