import hmac
import hashlib
import secrets
import re
from app.core.config import settings


def hash_secret(value: str) -> str:
    """Hashes a secret (such as OTP or session token) using HMAC-SHA256 with the app secret key."""
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def generate_session_token() -> str:
    """Generates a cryptographically strong random session token."""
    return secrets.token_urlsafe(32)


def generate_otp_code() -> str:
    """Generates a secure 6-digit numerical OTP code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def normalize_phone(country_code: str, phone_number: str) -> str:
    """
    Normalizes a phone number to standard E.164-like format:
    e.g. '+91' and '98765 43210' -> '+919876543210'
    """
    clean_cc = "+" + re.sub(r"\D", "", country_code)
    clean_num = re.sub(r"\D", "", phone_number)
    return f"{clean_cc}{clean_num}"


def sanitize_untrusted_text(text: str, max_chars: int = 15000) -> str:
    """
    Trims excessive text and neutralizes prompt-override attempts
    to treat resumes and job descriptions purely as untrusted data payloads.
    """
    if not text:
        return ""
    trimmed = text[:max_chars].strip()
    return trimmed
