from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class JobMatchCreate(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=150)
    company_name: str | None = Field(default=None, max_length=120)
    job_description: str = Field(..., min_length=10, max_length=15000)
    resume_id: str | None = None


class JobMatchAnalysisResult(BaseModel):
    match_score: int = Field(ge=0, le=100)
    matching_skills: List[str] = Field(default_factory=list)
    missing_or_weak_skills: List[str] = Field(default_factory=list)
    matching_qualifications: List[str] = Field(default_factory=list)
    important_keywords_found: List[str] = Field(default_factory=list)
    important_keywords_missing: List[str] = Field(default_factory=list)
    concrete_recommendations: List[str] = Field(default_factory=list)
    interview_prep_topics: List[str] = Field(default_factory=list)
    score_explanation: str
    is_demo_mode: bool = False


class JobMatchRead(BaseModel):
    id: str
    user_id: str
    resume_id: str | None = None
    job_title: str
    company_name: str | None = None
    job_description: str
    match_score: int
    result_json: JobMatchAnalysisResult
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
