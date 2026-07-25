from pydantic import BaseModel
from datetime import datetime

class WatchProgressIn(BaseModel):
    content_id: int
    progress_seconds: int
    duration_seconds: int | None = None

class WatchHistoryOut(BaseModel):
    content_id: int
    title: str
    progress_seconds: int
    duration_seconds: int | None
    last_watched_at: datetime

    class Config: 
        from_attributes = True