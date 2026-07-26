from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(email=data.email, username=data.username, password_hash=hash_password(data.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    default_profile = Profile(account_id=user.id, name=user.username)
    db.add(default_profile)
    await db.commit()

    return TokenResponse(access_token=create_access_token(user.id, user.role))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id, user.role))