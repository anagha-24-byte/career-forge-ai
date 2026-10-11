from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field


class InterviewQuestionItem(BaseModel):
    question_number: int
    question_text: str
    expected_topics: List[str] = Field(default_factory=list)
    evaluation_criteria: str = ""


class InterviewAnswerFeedback(BaseModel):
    clarity_score: int = Field(ge=0, le=100)
    technical_depth_score: int = Field(ge=0, le=100)
    communication_score: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    sample_strong_answer: str
    overall_feedback: str


class InterviewStartRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=150)
    interview_type: Literal["technical", "hr", "behavioral", "mixed"] = "technical"
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    question_count: int = Field(default=3, ge=1, le=10)
    resume_id: str | None = None


class AnswerSubmitRequest(BaseModel):
    question_number: int = Field(ge=1, le=10)
    answer_text: str = Field(..., min_length=3, max_length=10000)


class InterviewAnswerRead(BaseModel):
    id: str
    session_id: str
    question_number: int
    question_text: str
    user_answer_text: str
    feedback_json: InterviewAnswerFeedback | None = None
    score: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MockInterviewSessionRead(BaseModel):
    id: str
    user_id: str
    target_role: str
    interview_type: str
    difficulty: str
    total_questions: int
    current_question_index: int
    status: str
    overall_score: int | None = None
    overall_feedback: str | None = None
    questions_json: List[InterviewQuestionItem]
    answers: List[InterviewAnswerRead] = Field(default_factory=list)
    is_demo_mode: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
