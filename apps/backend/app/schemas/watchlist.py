from pydantic import BaseModel, model_validator
from datetime import datetime

class WatchlistAddIn(BaseModel):
    content_id: int | None = None
    series_id: int | None = None

    @model_validator(mode="after")
    def exactly_one(self):
        if (self.content_id is None) == (self.series_id is None):
            raise ValueError("Provide exactly one of content_id or series_id")
        return self
    
class WatchlistOut(BaseModel):
    type: str
    id: int
    title: str
    poster_url: str | None
    added_at: datetime