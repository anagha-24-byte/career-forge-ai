import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class MockInterviewSession(Base):
    __tablename__ = "mock_interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    target_role: Mapped[str] = mapped_column(String(150), nullable=False)
    interview_type: Mapped[str] = mapped_column(String(40), default="technical", nullable=False)
    difficulty: Mapped[str] = mapped_column(String(40), default="intermediate", nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="in_progress", nullable=False)  # in_progress, completed
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    questions_json: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    is_demo_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="interviews")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan", order_by="InterviewAnswer.question_number")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("mock_interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    feedback_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    session = relationship("MockInterviewSession", back_populates="answers")
