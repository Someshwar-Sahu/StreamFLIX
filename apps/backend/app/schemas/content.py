from pydantic import BaseModel
from datetime import datetime
from app.schemas.category import CategoryResponse

class ContentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    categories: list[CategoryResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ContentStatusResponse(BaseModel):
    id: int 
    status: str