from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.resume import ResumeAnalysis
from app.models.job_match import JobMatch
from app.models.roadmap import LearningRoadmap
from app.models.interview import MockInterviewSession
from app.models.application import JobApplication
from app.schemas.dashboard import DashboardSummary, UpcomingDeadlineItem, RecentActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Computes and aggregates authentic placement preparedness metrics for the authenticated user.
    Pulls directly from saved PostgreSQL records with zero fabricated statistics.
    """
    # 1. Latest Resume Score
    latest_analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .first()
    )
    latest_resume_score = latest_analysis.overall_score if latest_analysis else None

    # 2. Latest Job Match Score
    latest_match = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == current_user.id)
        .order_by(JobMatch.created_at.desc())
        .first()
    )
    latest_job_match_score = latest_match.match_score if latest_match else None

    # 3. Latest Roadmap Progress
    latest_roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.created_at.desc())
        .first()
    )
    roadmap_progress = latest_roadmap.progress_percentage if latest_roadmap else None
    roadmap_target_role = latest_roadmap.target_role if latest_roadmap else None

    # 4. Mock Interview Averages
    completed_interviews = (
        db.query(MockInterviewSession)
        .filter(
            MockInterviewSession.user_id == current_user.id,
            MockInterviewSession.status == "completed",
            MockInterviewSession.overall_score.isnot(None),
        )
        .all()
    )
    interview_scores = [i.overall_score for i in completed_interviews if i.overall_score is not None]
    interview_avg = round(sum(interview_scores) / len(interview_scores)) if interview_scores else None

    # 5. Active Applications & Deadlines
    applications = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .all()
    )
    active_apps = [
        app for app in applications
        if app.status not in ("Rejected", "Withdrawn")
    ]

    upcoming_deadlines: list[UpcomingDeadlineItem] = []
    for app in applications:
        if app.deadline:
            upcoming_deadlines.append(
                UpcomingDeadlineItem(
                    id=app.id,
                    company=app.company,
                    role=app.role,
                    deadline=app.deadline,
                    status=app.status,
                )
            )
    upcoming_deadlines.sort(key=lambda x: x.deadline)

    # 6. Recent Activity compilation
    recent_activity: list[RecentActivityItem] = []

    if latest_analysis:
        recent_activity.append(
            RecentActivityItem(
                id=f"analysis-{latest_analysis.id}",
                type="resume",
                title=f"Resume Evaluated: {latest_analysis.overall_score}/100",
                description=f"Target: {latest_analysis.target_role or 'General'}",
                timestamp=latest_analysis.created_at.isoformat(),
                score=latest_analysis.overall_score,
                link="/resume-analyzer",
            )
        )

    if latest_match:
        recent_activity.append(
            RecentActivityItem(
                id=f"match-{latest_match.id}",
                type="match",
                title=f"Job Matched: {latest_match.job_title}",
                description=f"{latest_match.company_name or 'General Posting'} ({latest_match.match_score}%)",
                timestamp=latest_match.created_at.isoformat(),
                score=latest_match.match_score,
                link="/job-match",
            )
        )

    if latest_roadmap:
        recent_activity.append(
            RecentActivityItem(
                id=f"roadmap-{latest_roadmap.id}",
                type="roadmap",
                title=f"Roadmap Updated: {latest_roadmap.target_role}",
                description=f"{latest_roadmap.progress_percentage}% completed",
                timestamp=latest_roadmap.updated_at.isoformat(),
                link="/roadmap",
            )
        )

    for i in completed_interviews[:2]:
        recent_activity.append(
            RecentActivityItem(
                id=f"interview-{i.id}",
                type="interview",
                title=f"Interview Completed: {i.target_role}",
                description=f"{i.interview_type.upper()} round ({i.overall_score} pts)",
                timestamp=i.updated_at.isoformat(),
                score=i.overall_score,
                link="/mock-interview",
            )
        )

    recent_activity.sort(key=lambda x: x.timestamp, reverse=True)

    return DashboardSummary(
        greeting_name=current_user.name,
        latest_resume_score=latest_resume_score,
        latest_job_match_score=latest_job_match_score,
        roadmap_progress_percentage=roadmap_progress,
        roadmap_target_role=roadmap_target_role,
        mock_interview_average_score=interview_avg,
        completed_interviews_count=len(completed_interviews),
        active_applications_count=len(active_apps),
        upcoming_deadlines=upcoming_deadlines[:5],
        recent_activity=recent_activity[:6],
    )
