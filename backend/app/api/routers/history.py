from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume, ResumeAnalysis
from app.models.job_match import JobMatch
from app.models.roadmap import LearningRoadmap
from app.models.interview import MockInterviewSession
from app.models.application import JobApplication
from app.schemas.resume import ResumeRead, ResumeAnalysisRead
from app.schemas.job_match import JobMatchRead
from app.schemas.roadmap import LearningRoadmapRead
from app.schemas.interview import MockInterviewSessionRead
from app.schemas.application import JobApplicationRead

router = APIRouter(prefix="/history", tags=["History"])


@router.get("")
async def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns unified placement history records for the authenticated user,
    including resumes, evaluations, job matches, learning roadmaps,
    mock interview feedback, and application records.
    """
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )

    analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )

    matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == current_user.id)
        .order_by(JobMatch.created_at.desc())
        .all()
    )

    roadmaps = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.created_at.desc())
        .all()
    )

    interviews = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.user_id == current_user.id)
        .order_by(MockInterviewSession.created_at.desc())
        .all()
    )

    applications = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )

    return {
        "resumes": [ResumeRead.model_validate(r) for r in resumes],
        "analyses": [ResumeAnalysisRead.model_validate(a) for a in analyses],
        "matches": [JobMatchRead.model_validate(m) for m in matches],
        "roadmaps": [LearningRoadmapRead.model_validate(rd) for rd in roadmaps],
        "interviews": [MockInterviewSessionRead.model_validate(i) for i in interviews],
        "applications": [JobApplicationRead.model_validate(app) for app in applications],
    }
