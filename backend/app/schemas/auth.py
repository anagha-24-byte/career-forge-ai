from pydantic import BaseModel, Field
from app.schemas.user import UserRead


class SendOtpRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone_country_code: str = Field(default="+91", min_length=2, max_length=10)
    phone_number: str = Field(..., min_length=7, max_length=15)


class OtpChallengeResponse(BaseModel):
    message: str
    phone_number: str
    expires_in_seconds: int
    dev_mode: bool
    dev_otp: str | None = None


class VerifyOtpRequest(BaseModel):
    phone_country_code: str = Field(default="+91", min_length=2, max_length=10)
    phone_number: str = Field(..., min_length=7, max_length=15)
    otp_code: str = Field(..., min_length=6, max_length=6)


class AuthResponse(BaseModel):
    message: str
    user: UserRead
    access_token: str | None = None
    token_type: str = "bearer"
    is_new_user: bool
