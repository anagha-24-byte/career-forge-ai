from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserRead)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile information."""
    return UserRead.model_validate(current_user)


@router.patch("", response_model=UserRead)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates target role, academic level, email, or full name."""
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.email is not None:
        current_user.email = payload.email.strip() or None
    if payload.target_role is not None:
        current_user.target_role = payload.target_role.strip() or None
    if payload.experience_level is not None:
        current_user.experience_level = payload.experience_level.strip() or None

    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)
