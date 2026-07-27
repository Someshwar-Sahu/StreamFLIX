from pydantic import BaseModel

class DiscoverItem(BaseModel):
    type: str
    id: int
    title: str
    poster_url: str | None

class TrendingResponse(BaseModel):
    movies: list[DiscoverItem]
    series: list[DiscoverItem]
    overall: list[DiscoverItem]

class LatestResponse(BaseModel):
    movies: list[DiscoverItem]
    series: list[DiscoverItem]
    overall: list[DiscoverItem]