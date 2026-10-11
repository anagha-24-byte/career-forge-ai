from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UserRead(BaseModel):
    id: str
    name: str
    phone_country_code: str
    phone_number: str
    email: str | None = None
    target_role: str | None = None
    experience_level: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    target_role: str | None = Field(default=None, max_length=120)
    experience_level: str | None = Field(default=None, max_length=80)
