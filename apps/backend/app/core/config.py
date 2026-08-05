from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent  # -> streamflix/ root

class Settings(BaseSettings):
    cors_origins: str = "*"
    database_url: str = "postgresql+asyncpg://postgres.kgkfpmjbnkwnwqntlsbg:-2idRPq9UWtyp9R@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change_this_to_random_string_later"
    jwt_algorithm: str = "HS256"
    media_storage_path: Path = BASE_DIR / "media_storage"

    access_token_expire_minutes: int = 43200  # 30 days
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_user: str = "a93767093@gmail.com"
    smtp_password: str = "bmezkdvylxzrurau"
    emails_from_name: str = "StreamFlix"
    resend_api_key: str = ""
    brevo_api_key: str = ""

    b2_acc1_endpoint: str = "https://s3.us-east-005.backblazeb2.com"
    b2_acc1_access_key: str = ""
    b2_acc1_secret_key: str = ""
    b2_acc1_bucket: str = "streamflix-b2-1"
    b2_acc1_max_gb: float = 9.5

    class Config:
        env_file = [str(BASE_DIR / ".env"), ".env"]
        extra = "ignore"

settings = Settings()