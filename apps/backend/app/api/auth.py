import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.db import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.email import send_otp_email
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing_email = await db.execute(select(User).where(User.email == data.email))
    user_by_email = existing_email.scalar_one_or_none()

    if user_by_email and user_by_email.is_verified:
        raise HTTPException(400, "Email address is already registered")

    existing_username = await db.execute(select(User).where(User.username == data.username))
    user_by_username = existing_username.scalar_one_or_none()

    if user_by_username and (not user_by_email or user_by_email.id != user_by_username.id):
        raise HTTPException(400, "Username is already taken")

    otp_code = f"{random.randint(100000, 999999)}"
    now = datetime.utcnow()

    if user_by_email and not user_by_email.is_verified:
        user_by_email.username = data.username
        user_by_email.password_hash = hash_password(data.password)
        user_by_email.verification_otp = otp_code
        user_by_email.last_otp_sent_at = now
        await db.commit()
        await db.refresh(user_by_email)
        user = user_by_email
    else:
        user_count_res = await db.execute(select(func.count()).select_from(User))
        user_count = user_count_res.scalar() or 0
        assigned_role = "admin" if user_count == 0 else "viewer"

        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
            role=assigned_role,
            is_verified=False,
            verification_otp=otp_code,
            last_otp_sent_at=now,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        default_profile = Profile(account_id=user.id, name=user.username)
        db.add(default_profile)
        await db.commit()

    try:
        send_otp_email(user.email, otp_code)
    except Exception as err:
        print(f"[AUTH ERROR] send_otp_email failed: {err}")

    return {
        "status": "otp_required",
        "email": user.email,
        "message": f"Security code sent to {user.email}",
    }



@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    email: str = Form(...),
    code: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User account not found")

    if user.is_verified:
        return TokenResponse(access_token=create_access_token(user.id, user.role))

    if user.verification_otp != code:
        raise HTTPException(400, "Invalid 6-digit verification code")

    user.is_verified = True
    user.verification_otp = None
    await db.commit()

    return TokenResponse(access_token=create_access_token(user.id, user.role))


@router.post("/resend-otp")
async def resend_otp(
    email: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "Account not found")

    if user.is_verified:
        return {"status": "success", "message": "Account is already verified"}

    now = datetime.utcnow()
    COOLDOWN_SECONDS = 60

    if user.last_otp_sent_at:
        elapsed = (now - user.last_otp_sent_at).total_seconds()
        if elapsed < COOLDOWN_SECONDS:
            remaining = int(COOLDOWN_SECONDS - elapsed)
            raise HTTPException(429, f"Please wait {remaining} seconds before requesting a new verification code.")

    otp_code = f"{random.randint(100000, 999999)}"
    user.verification_otp = otp_code
    user.last_otp_sent_at = now
    await db.commit()

    send_otp_email(user.email, otp_code)
    return {"status": "success", "message": f"New verification code sent to {email}"}


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    if getattr(user, "is_verified", None) is None or user.is_verified is False and user.verification_otp is None:
        user.is_verified = True
        await db.commit()

    if not user.is_verified and user.verification_otp is not None:
        raise HTTPException(400, "Your email is not verified yet. Please check your email for the 6-digit code.")

    return TokenResponse(access_token=create_access_token(user.id, user.role))