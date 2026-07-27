from pydantic import BaseModel, model_validator, field_validator

class RatingIn(BaseModel):
    content_id: int | None = None
    series_id: int | None = None
    value: int

    @field_validator("value")
    @classmethod
    def value_must_be_valid(cls, v):
        if v not in (1, -1):
            raise ValueError("value must be 1 (like) or -1 (dislike)")
        return v

    @model_validator(mode="after")
    def exactly_one(self):
        if (self.content_id is None) == (self.series_id is None):
            raise ValueError("Provide exactly one of content_id or series_id")
        return self

class RatingSummary(BaseModel):
    type: str
    id: int
    likes: int
    dislikes: int
    my_rating: int | None