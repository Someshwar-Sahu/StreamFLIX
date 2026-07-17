from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent  # -> streamflix/ root

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    media_storage_path: Path = BASE_DIR / "media_storage"

    class Config:
        env_file = ".env"

settings = Settings()