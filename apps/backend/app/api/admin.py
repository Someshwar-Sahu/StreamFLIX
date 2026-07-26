from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.auth_dep import require_admin
from app.models.user import User
from app.schemas.user import UserOut, RoleUpdate

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_ROLES = {"viewer", "uploader", "admin"}

@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()

@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(require_admin)
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(400, f"Role must be one of {VALID_ROLES}")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    if user.id == admin_id and payload.role != "admin":
        raise HTTPException(400, "Cannot demote your own adminn account")

    user.role = payload.role 
    await db.commit()
    await db.refresh(user)

    return user