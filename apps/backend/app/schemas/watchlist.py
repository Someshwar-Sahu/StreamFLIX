from pydantic import BaseModel
from datetime import datetime

class WatchlistAddIn(BaseModel):
    content_id: int

class WatchlistOut(BaseModel):
    content_id: int
    title: str
    added_at: datetime

    class Config:
        from_attributes = True