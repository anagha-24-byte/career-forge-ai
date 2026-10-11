from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field


class LearningResource(BaseModel):
    title: str
    url: str | None = None
    type: str = "tutorial"


class SkillGapItem(BaseModel):
    skill_name: str
    current_evidence: str
    target_proficiency: Literal["Beginner", "Intermediate", "Advanced"]
    priority: Literal["High", "Medium", "Low"]
    importance_reason: str
    suggested_learning_sequence: str
    practical_project: str
    estimated_hours: int = 10
    recommended_resources: List[LearningResource] = Field(default_factory=list)


class RoadmapTaskCreate(BaseModel):
    milestone_title: str = Field(..., max_length=150)
    task_title: str = Field(..., max_length=200)
    description: str = Field(default="", max_length=2000)
    difficulty_level: Literal["Beginner", "Intermediate", "Advanced"] = "Intermediate"
    estimated_hours: int = Field(default=10, ge=1, le=200)
    resource_name: str | None = None
    resource_url: str | None = None


class RoadmapTaskUpdate(BaseModel):
    task_title: str | None = None
    description: str | None = None
    difficulty_level: Literal["Beginner", "Intermediate", "Advanced"] | None = None
    is_completed: bool | None = None


class RoadmapTaskRead(BaseModel):
    id: str
    roadmap_id: str
    milestone_title: str
    task_title: str
    description: str
    difficulty_level: str
    order_index: int
    is_completed: bool
    completed_at: datetime | None = None
    estimated_hours: int
    resource_name: str | None = None
    resource_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RoadmapCreate(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=150)
    target_domain: str | None = Field(default=None, max_length=150)
    resume_id: str | None = None
    job_description: str | None = None


class LearningRoadmapRead(BaseModel):
    id: str
    user_id: str
    target_role: str
    target_domain: str | None = None
    skill_gaps_json: List[SkillGapItem]
    progress_percentage: int
    is_demo_mode: bool
    tasks: List[RoadmapTaskRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
