from typing import List
from pydantic import BaseModel


class UpcomingDeadlineItem(BaseModel):
    id: str
    company: str
    role: str
    deadline: str
    status: str


class RecentActivityItem(BaseModel):
    id: str
    type: str  # resume, match, roadmap, interview, application
    title: str
    description: str
    timestamp: str
    score: int | None = None
    link: str


class DashboardSummary(BaseModel):
    greeting_name: str
    latest_resume_score: int | None = None
    latest_job_match_score: int | None = None
    roadmap_progress_percentage: int | None = None
    roadmap_target_role: str | None = None
    mock_interview_average_score: int | None = None
    completed_interviews_count: int = 0
    active_applications_count: int = 0
    upcoming_deadlines: List[UpcomingDeadlineItem] = []
    recent_activity: List[RecentActivityItem] = []
