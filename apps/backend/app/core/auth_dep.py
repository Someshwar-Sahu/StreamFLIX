from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from app.core.config import settings

def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return int (payload["sub"])

    except JWTError:
        raise HTTPException(401, "Invalid or expired token")