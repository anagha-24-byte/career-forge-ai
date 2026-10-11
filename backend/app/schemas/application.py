from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class JobApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, max_length=150)
    role: str = Field(..., min_length=1, max_length=150)
    application_date: str = Field(..., max_length=30)
    deadline: str | None = Field(default=None, max_length=30)
    status: str = Field(default="Applied", max_length=40)
    job_description: str | None = None
    job_posting_url: str | None = None
    notes: str | None = None
    next_action: str | None = None


class JobApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    application_date: str | None = None
    deadline: str | None = None
    status: str | None = None
    job_description: str | None = None
    job_posting_url: str | None = None
    notes: str | None = None
    next_action: str | None = None


class JobApplicationRead(BaseModel):
    id: str
    user_id: str
    company: str
    role: str
    application_date: str
    deadline: str | None = None
    status: str
    job_description: str | None = None
    job_posting_url: str | None = None
    notes: str | None = None
    next_action: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
