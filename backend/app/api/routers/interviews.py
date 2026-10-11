from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.rate_limit import ai_rate_limiter
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import MockInterviewSession, InterviewAnswer
from app.schemas.interview import (
    InterviewStartRequest,
    MockInterviewSessionRead,
    AnswerSubmitRequest,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/interviews", tags=["Mock Interviews"])


@router.post("", response_model=MockInterviewSessionRead)
async def start_interview(
    payload: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initializes a new mock interview session and synthesizes targeted questions
    based on the user's role, interview type, and difficulty level.
    """
    ai_rate_limiter.check(f"ai_user:{current_user.id}")

    resume_text = ""
    if payload.resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
            .first()
        )
        if resume:
            resume_text = resume.extracted_text

    questions = await ai_service.generate_interview_questions(
        target_role=payload.target_role.strip(),
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        count=payload.question_count,
        resume_text=resume_text,
    )

    is_demo = not ai_service.has_api_key

    session = MockInterviewSession(
        user_id=current_user.id,
        target_role=payload.target_role.strip(),
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        total_questions=len(questions),
        current_question_index=0,
        status="in_progress",
        questions_json=[q.model_dump() for q in questions],
        is_demo_mode=is_demo,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return MockInterviewSessionRead.model_validate(session)


@router.get("", response_model=List[MockInterviewSessionRead])
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all mock interview sessions for the authenticated user."""
    sessions = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.user_id == current_user.id)
        .order_by(MockInterviewSession.created_at.desc())
        .all()
    )
    return [MockInterviewSessionRead.model_validate(s) for s in sessions]


@router.get("/{interview_id}", response_model=MockInterviewSessionRead)
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a specific interview session by ID with user isolation."""
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == interview_id, MockInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )
    return MockInterviewSessionRead.model_validate(session)


@router.post("/{interview_id}/answers", response_model=MockInterviewSessionRead)
async def submit_interview_answer(
    interview_id: str,
    payload: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a student's answer to the current interview question.
    Calls Claude to evaluate clarity, technical depth, strengths, and areas to improve.
    """
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == interview_id, MockInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    ai_rate_limiter.check(f"ai_user:{current_user.id}")

    questions = session.questions_json
    q_num = payload.question_number
    if q_num < 1 or q_num > len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question number for this session.",
        )

    question_item = questions[q_num - 1]
    question_text = question_item.get("question_text", "")

    feedback = await ai_service.evaluate_interview_answer(
        target_role=session.target_role,
        question=question_text,
        user_answer=payload.answer_text.strip(),
    )

    avg_score = round(
        (feedback.clarity_score + feedback.technical_depth_score + feedback.communication_score) / 3
    )

    answer_record = InterviewAnswer(
        session_id=session.id,
        question_number=q_num,
        question_text=question_text,
        user_answer_text=payload.answer_text.strip(),
        feedback_json=feedback.model_dump(),
        score=avg_score,
    )
    db.add(answer_record)

    # Advance current question index
    session.current_question_index = min(len(questions), session.current_question_index + 1)
    db.commit()
    db.refresh(session)

    return MockInterviewSessionRead.model_validate(session)


@router.post("/{interview_id}/complete", response_model=MockInterviewSessionRead)
async def complete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finalizes an interview session, calculates the overall session score,
    and updates session status.
    """
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == interview_id, MockInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    answers = session.answers
    if answers:
        scores = [a.score for a in answers if a.score is not None]
        overall = round(sum(scores) / len(scores)) if scores else 70
        session.overall_score = overall
        session.overall_feedback = (
            f"Candidate completed {len(answers)} interview questions. "
            f"Achieved an overall score of {overall}/100 across technical depth, clarity, and communication."
        )
    else:
        session.overall_score = 0
        session.overall_feedback = "Session completed with no answered questions."

    session.status = "completed"
    db.commit()
    db.refresh(session)

    return MockInterviewSessionRead.model_validate(session)


@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a mock interview session and its answered records."""
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == interview_id, MockInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )

    db.delete(session)
    db.commit()
    return {"message": "Mock interview session deleted successfully."}
