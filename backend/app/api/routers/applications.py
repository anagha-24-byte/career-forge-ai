from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.application import JobApplication
from app.schemas.application import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationRead,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=JobApplicationRead)
async def create_application(
    payload: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new job application record for the authenticated user."""
    application = JobApplication(
        user_id=current_user.id,
        company=payload.company.strip(),
        role=payload.role.strip(),
        application_date=payload.application_date,
        deadline=payload.deadline,
        status=payload.status,
        job_description=payload.job_description,
        job_posting_url=payload.job_posting_url,
        notes=payload.notes,
        next_action=payload.next_action,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return JobApplicationRead.model_validate(application)


@router.get("", response_model=List[JobApplicationRead])
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all job applications tracked by the authenticated user."""
    applications = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    return [JobApplicationRead.model_validate(app) for app in applications]


@router.patch("/{application_id}", response_model=JobApplicationRead)
async def update_application(
    application_id: str,
    payload: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates an existing job application with user isolation checks."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application record not found.",
        )

    if payload.company is not None:
        app.company = payload.company.strip()
    if payload.role is not None:
        app.role = payload.role.strip()
    if payload.application_date is not None:
        app.application_date = payload.application_date
    if payload.deadline is not None:
        app.deadline = payload.deadline
    if payload.status is not None:
        app.status = payload.status
    if payload.job_description is not None:
        app.job_description = payload.job_description
    if payload.job_posting_url is not None:
        app.job_posting_url = payload.job_posting_url
    if payload.notes is not None:
        app.notes = payload.notes
    if payload.next_action is not None:
        app.next_action = payload.next_action

    db.commit()
    db.refresh(app)
    return JobApplicationRead.model_validate(app)


@router.delete("/{application_id}")
async def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a job application record."""
    app = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application record not found.",
        )

    db.delete(app)
    db.commit()
    return {"message": "Job application deleted successfully."}
