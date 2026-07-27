from pydantic import BaseModel
from datetime import datetime
from app.schemas.category import CategoryResponse

class SeriesCreate(BaseModel):
    title: str
    description: str | None = None

class SeriesOut(BaseModel):
    id: int
    title: str
    description: str | None
    poster_url: str | None
    categories: list[CategoryResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class SeasonOut(BaseModel):
    id: int
    season_number: int

    class Config:
        from_attributes = True

class EpisodeOut(BaseModel):
    id: int
    episode_number: int
    title: str | None
    content_id: int

    class Config:
        from_attributes = True

class SeasonWithEpisodesOut(BaseModel):
    id: int
    season_number: int
    episodes: list[EpisodeOut] = []

    class Config:
        from_attributes = True

class SeriesDetailOut(SeriesOut):
    seasons: list[SeasonWithEpisodesOut] = []