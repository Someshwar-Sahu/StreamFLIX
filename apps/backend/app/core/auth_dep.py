from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from app.core.config import settings

def get_current_user_id(authorization: str = Header(None)) -> int:
    payload = _decode(authorization)
    return int(payload["sub"])

def get_current_user_role(authorization: str = Header(None)) -> str:
    payload = _decode(authorization)
    return payload.get("role", "viewer")

def get_current_profile_id(authorization: str = Header(None)) -> int:
    payload = _decode(authorization)
    if "profile_id" not in payload:
        raise HTTPException(400, "No profile selected — call POST /profiles/{id}/select first")
    return int(payload["profile_id"])

def require_uploader(authorization: str = Header(None)):
    payload = _decode(authorization)
    if payload.get("role") not in ("uploader", "admin"):
        raise HTTPException(403, "Uploader role required")
    return int(payload["sub"])

def require_admin(authorization: str = Header(None)):
    payload = _decode(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin role required")
    return int(payload["sub"])

def _decode(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")