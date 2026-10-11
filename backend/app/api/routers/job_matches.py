from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.rate_limit import ai_rate_limiter
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job_match import JobMatch
from app.schemas.job_match import JobMatchCreate, JobMatchRead
from app.services.ai_service import ai_service

router = APIRouter(prefix="/job-matches", tags=["Job Matches"])


@router.post("", response_model=JobMatchRead)
async def create_job_match(
    payload: JobMatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compares the student's resume against a targeted job description.
    Diagnoses matching skills, missing skills, keyword gaps, and interview prep suggestions.
    """
    ai_rate_limiter.check(f"ai_user:{current_user.id}")

    resume_text = ""
    if payload.resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
            .first()
        )
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected resume document not found.",
            )
        resume_text = resume.extracted_text
    else:
        # Check if user has any existing resume
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )
        if latest_resume:
            resume_text = latest_resume.extracted_text
            payload.resume_id = latest_resume.id

    match_result = await ai_service.match_job(
        extracted_resume=resume_text,
        job_title=payload.job_title.strip(),
        job_description=payload.job_description.strip(),
    )

    job_match = JobMatch(
        user_id=current_user.id,
        resume_id=payload.resume_id,
        job_title=payload.job_title.strip(),
        company_name=payload.company_name.strip() if payload.company_name else None,
        job_description=payload.job_description.strip(),
        match_score=match_result.match_score,
        result_json=match_result.model_dump(),
    )
    db.add(job_match)
    db.commit()
    db.refresh(job_match)

    return JobMatchRead.model_validate(job_match)


@router.get("", response_model=List[JobMatchRead])
async def list_job_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all saved job matches for the authenticated user."""
    matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == current_user.id)
        .order_by(JobMatch.created_at.desc())
        .all()
    )
    return [JobMatchRead.model_validate(m) for m in matches]


@router.get("/{match_id}", response_model=JobMatchRead)
async def get_job_match(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a specific job match record by ID with user isolation."""
    match = (
        db.query(JobMatch)
        .filter(JobMatch.id == match_id, JobMatch.user_id == current_user.id)
        .first()
    )
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match record not found.",
        )
    return JobMatchRead.model_validate(match)


@router.delete("/{match_id}")
async def delete_job_match(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a job match record."""
    match = (
        db.query(JobMatch)
        .filter(JobMatch.id == match_id, JobMatch.user_id == current_user.id)
        .first()
    )
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match record not found.",
        )

    db.delete(match)
    db.commit()
    return {"message": "Job match record deleted successfully."}
