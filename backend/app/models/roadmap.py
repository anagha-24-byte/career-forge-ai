import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    target_role: Mapped[str] = mapped_column(String(150), nullable=False)
    target_domain: Mapped[str | None] = mapped_column(String(150), nullable=True)
    skill_gaps_json: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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

    user = relationship("User", back_populates="roadmaps")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapTask.order_index")


class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    roadmap_id: Mapped[str] = mapped_column(String(36), ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), index=True, nullable=False)
    milestone_title: Mapped[str] = mapped_column(String(150), nullable=False)
    task_title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    difficulty_level: Mapped[str] = mapped_column(String(30), default="Intermediate", nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_hours: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    resource_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resource_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    roadmap = relationship("LearningRoadmap", back_populates="tasks")
