from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent  # -> streamflix/ root

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    media_storage_path: Path = BASE_DIR / "media_storage"

    access_token_expire_minutes: int = 43200  # 30 days
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    emails_from_name: str = "StreamFlix Verification"

    class Config:
        env_file = [str(BASE_DIR / ".env"), ".env"]
        extra = "ignore"

settings = Settings()