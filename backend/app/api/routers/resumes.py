from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.rate_limit import ai_rate_limiter
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume, ResumeAnalysis
from app.schemas.resume import (
    ResumeRead,
    ResumeAnalysisRead,
    AnalyzeResumeRequest,
)
from app.services.extractor import extract_text_from_file
from app.services.ai_service import ai_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("", response_model=ResumeRead)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Uploads and safely extracts text from PDF and DOCX resume files.
    Enforces format validation, size checks, and stores text for AI evaluation.
    """
    extracted_text, file_size = await extract_text_from_file(file)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume.pdf",
        file_size=file_size,
        extracted_text=extracted_text,
        char_count=len(extracted_text),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    res = ResumeRead.model_validate(resume)
    res.analyses_count = 0
    return res


@router.get("", response_model=List[ResumeRead])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all uploaded resumes belonging to the authenticated user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    result = []
    for r in resumes:
        item = ResumeRead.model_validate(r)
        item.analyses_count = len(r.analyses)
        result.append(item)
    return result


@router.get("/analyses/all", response_model=List[ResumeAnalysisRead])
async def get_all_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all resume analyses across all documents for the authenticated user."""
    analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )
    return [ResumeAnalysisRead.model_validate(a) for a in analyses]


@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a specific resume document by ID with user isolation checks."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume document not found.",
        )
    res = ResumeRead.model_validate(resume)
    res.analyses_count = len(resume.analyses)
    return res


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes an uploaded resume and all associated evaluation iterations."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume document not found.",
        )

    db.delete(resume)
    db.commit()
    return {"message": "Resume and associated analyses deleted successfully."}


@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisRead)
async def analyze_resume(
    resume_id: str,
    payload: AnalyzeResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Executes Claude AI rubric analysis on the resume's extracted text.
    Evaluates impact, formatting, skills, ATS pass rate, and bullet enhancements.
    """
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume document not found.",
        )

    ai_rate_limiter.check(f"ai_user:{current_user.id}")

    target_role = (payload.target_role or current_user.target_role or "Software Engineering Intern").strip()
    analysis_result = await ai_service.analyze_resume(resume.extracted_text, target_role)

    analysis_record = ResumeAnalysis(
        resume_id=resume.id,
        user_id=current_user.id,
        target_role=target_role,
        overall_score=analysis_result.overall_score,
        analysis_json=analysis_result.model_dump(),
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return ResumeAnalysisRead.model_validate(analysis_record)


@router.get("/{resume_id}/analyses", response_model=List[ResumeAnalysisRead])
async def get_resume_analyses(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves all historical evaluations for a specific resume document."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume document not found.",
        )

    analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.resume_id == resume_id, ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )
    return [ResumeAnalysisRead.model_validate(a) for a in analyses]
