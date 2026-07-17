from pydantic import BaseModel
from datetime import datetime

class ContentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ContentStatusResponse(BaseModel):
    id: int 
    status: str