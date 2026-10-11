from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.rate_limit import ai_rate_limiter
from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.roadmap import LearningRoadmap, RoadmapTask
from app.schemas.roadmap import (
    RoadmapCreate,
    LearningRoadmapRead,
    RoadmapTaskCreate,
    RoadmapTaskUpdate,
    RoadmapTaskRead,
)
from app.services.ai_service import ai_service

router = APIRouter(tags=["Roadmaps & Gaps"])


@router.post("/roadmaps", response_model=LearningRoadmapRead)
async def generate_roadmap(
    payload: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a structured learning roadmap and skill gaps analysis
    based on the candidate's resume and target role.
    Creates ordered milestones with interactive completion tasks.
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
    else:
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )
        if latest_resume:
            resume_text = latest_resume.extracted_text

    roadmap_data = await ai_service.generate_roadmap(
        target_role=payload.target_role.strip(),
        target_domain=payload.target_domain.strip() if payload.target_domain else "",
        resume_text=resume_text,
    )

    roadmap = LearningRoadmap(
        user_id=current_user.id,
        target_role=payload.target_role.strip(),
        target_domain=payload.target_domain.strip() if payload.target_domain else None,
        skill_gaps_json=roadmap_data.get("skill_gaps", []),
        progress_percentage=0,
        is_demo_mode=roadmap_data.get("is_demo_mode", False),
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # Insert generated tasks
    tasks_raw = roadmap_data.get("tasks", [])
    for idx, t in enumerate(tasks_raw):
        task = RoadmapTask(
            roadmap_id=roadmap.id,
            milestone_title=t.get("milestone_title", f"Milestone {idx + 1}"),
            task_title=t.get("task_title", "Practical Exercise"),
            description=t.get("description", ""),
            difficulty_level=t.get("difficulty_level", "Intermediate"),
            order_index=t.get("order_index", idx + 1),
            is_completed=False,
            estimated_hours=t.get("estimated_hours", 10),
            resource_name=t.get("resource_name"),
            resource_url=t.get("resource_url"),
        )
        db.add(task)

    db.commit()
    db.refresh(roadmap)
    return LearningRoadmapRead.model_validate(roadmap)


@router.get("/roadmaps/latest", response_model=LearningRoadmapRead | None)
async def get_latest_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves the most recently created learning roadmap for the user."""
    roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.created_at.desc())
        .first()
    )
    if not roadmap:
        return None
    return LearningRoadmapRead.model_validate(roadmap)


@router.get("/roadmaps", response_model=List[LearningRoadmapRead])
async def list_roadmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all saved roadmaps for the authenticated user."""
    roadmaps = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.created_at.desc())
        .all()
    )
    return [LearningRoadmapRead.model_validate(r) for r in roadmaps]


@router.get("/roadmaps/{roadmap_id}", response_model=LearningRoadmapRead)
async def get_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a specific learning roadmap by ID with user isolation."""
    roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.id == roadmap_id, LearningRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning roadmap not found.",
        )
    return LearningRoadmapRead.model_validate(roadmap)


@router.post("/roadmaps/{roadmap_id}/tasks", response_model=RoadmapTaskRead)
async def add_task_to_roadmap(
    roadmap_id: str,
    payload: RoadmapTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adds a custom student task to the roadmap."""
    roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.id == roadmap_id, LearningRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found.",
        )

    order_index = len(roadmap.tasks) + 1
    task = RoadmapTask(
        roadmap_id=roadmap.id,
        milestone_title=payload.milestone_title,
        task_title=payload.task_title,
        description=payload.description,
        difficulty_level=payload.difficulty_level,
        order_index=order_index,
        is_completed=False,
        estimated_hours=payload.estimated_hours,
        resource_name=payload.resource_name,
        resource_url=payload.resource_url,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Recalculate progress
    all_tasks = roadmap.tasks
    completed = [t for t in all_tasks if t.is_completed]
    roadmap.progress_percentage = round((len(completed) / len(all_tasks)) * 100) if all_tasks else 0
    db.commit()

    return RoadmapTaskRead.model_validate(task)


@router.patch("/roadmap-tasks/{task_id}", response_model=RoadmapTaskRead)
async def update_roadmap_task(
    task_id: str,
    payload: RoadmapTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates completion status or details of a roadmap task.
    Automatically re-calculates the roadmap's overall progress percentage.
    """
    task = (
        db.query(RoadmapTask)
        .join(LearningRoadmap)
        .filter(RoadmapTask.id == task_id, LearningRoadmap.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap task not found.",
        )

    if payload.task_title is not None:
        task.task_title = payload.task_title
    if payload.description is not None:
        task.description = payload.description
    if payload.difficulty_level is not None:
        task.difficulty_level = payload.difficulty_level
    if payload.is_completed is not None:
        task.is_completed = payload.is_completed
        task.completed_at = datetime.now(timezone.utc) if payload.is_completed else None

    db.commit()

    # Recalculate parent roadmap progress
    roadmap = task.roadmap
    all_tasks = roadmap.tasks
    completed_count = sum(1 for t in all_tasks if t.is_completed)
    roadmap.progress_percentage = (
        round((completed_count / len(all_tasks)) * 100) if all_tasks else 0
    )
    db.commit()
    db.refresh(task)

    return RoadmapTaskRead.model_validate(task)


@router.delete("/roadmaps/{roadmap_id}")
async def delete_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a learning roadmap and all its milestone tasks."""
    roadmap = (
        db.query(LearningRoadmap)
        .filter(LearningRoadmap.id == roadmap_id, LearningRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found.",
        )

    db.delete(roadmap)
    db.commit()
    return {"message": "Learning roadmap deleted successfully."}
