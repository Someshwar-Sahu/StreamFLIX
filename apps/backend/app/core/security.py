import bcrypt
from jose import jwt 
from datetime import datetime, timedelta
from app.core.config import settings

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(account_id: int, role: str, profile_id: int | None = None) -> str:
    payload = {"sub": str(account_id), "role": role, "exp": datetime.utcnow() + timedelta(hours=1)}
    if profile_id is not None:
        payload["profile_id"] = profile_id
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)