from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.auth_dep import get_current_user_id, get_current_user_role
from app.core.security import create_access_token
from app.models.profile import Profile 
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut, ProfileSelectResponse

router = APIRouter(prefix="/profiles", tags=["profiles"])

MAX_PROFILES = {"viewer": 3, "uploader": 1, "admin": 1}

@router.get("", response_model=list[ProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db), account_id: int = Depends(get_current_user_id)):
    result = await db.execute(select(Profile).where(Profile.account_id == account_id))
    return result.scalars().all()

@router.post("", response_model=ProfileOut)
async def create_profile(payload: ProfileCreate, db: AsyncSession = Depends(get_db), account_id: int = Depends(get_current_user_id), role: str = Depends(get_current_user_role)):
    result = await db.execute(select(Profile).where(Profile.account_id == account_id))
    existing = result.scalars().all()

    limit = MAX_PROFILES.get(role, 1)
    if len(existing) >= limit:
        raise HTTPException(400, f"{role} accounts are limited to {limit} profile(s)")

    profile = Profile(account_id=account_id, name=payload.name, avatar_url=payload.avatar_url)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.patch("/{profile_id}", response_model=ProfileOut)
async def update_profile(
    profile_id: int,
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    account_id: int = Depends(get_current_user_id),
):
    profile = await db.get(Profile, profile_id)
    if not profile or profile.account_id != account_id:
        raise HTTPException(404, "Profile not found")

    if payload.name is not None:
        profile.name = payload.name
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(profile)
    return profile

@router.post("/{profile_id}/select", response_model=ProfileSelectResponse)
async def select_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    account_id: int = Depends(get_current_user_id),
    role: str = Depends(get_current_user_role)
):
    profile = await db.get(Profile, profile_id)
    if not profile or profile.account_id != account_id:
        raise HTTPException(404, "Profile not found")

    token = create_access_token(account_id, role, profile_id=profile.id)
    return ProfileSelectResponse(access_token=token)

@router.delete("/{profile_id}")
async def delete_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    account_id: int = Depends(get_current_user_id),
):
    profile = await db.get(Profile, profile_id)
    if not profile or profile.account_id != account_id:
        raise HTTPException(404, "Profile not found")

    await db.delete(profile)
    await db.commit()
    return {"status": "deleted"}