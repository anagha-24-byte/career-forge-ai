from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class ResumeRubricItem(BaseModel):
    category: str
    score: int = Field(ge=0, le=100)
    weight: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class AtsCheckItem(BaseModel):
    check: str
    passed: bool
    recommendation: str


class BulletImprovement(BaseModel):
    original: str
    improved: str
    reason: str
    measurable_impact: str


class ResumeAnalysisResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    summary: str
    rubric_breakdown: List[ResumeRubricItem]
    ats_readability: List[AtsCheckItem]
    missing_information: List[str] = Field(default_factory=list)
    weak_bullet_points: List[BulletImprovement] = Field(default_factory=list)
    priority_recommendations: List[str] = Field(default_factory=list)
    target_roles_fit: List[str] = Field(default_factory=list)
    is_demo_mode: bool = False


class AnalyzeResumeRequest(BaseModel):
    target_role: str | None = Field(default="Software Engineer", max_length=120)


class ResumeRead(BaseModel):
    id: str
    user_id: str
    filename: str
    file_size: int
    extracted_text: str
    char_count: int
    created_at: datetime
    analyses_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ResumeAnalysisRead(BaseModel):
    id: str
    resume_id: str
    user_id: str
    target_role: str | None = None
    overall_score: int
    analysis_json: ResumeAnalysisResult
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
