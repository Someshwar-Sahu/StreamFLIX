from pydantic import BaseModel, field_validator

class RatingIn(BaseModel):
    content_id: int
    value: int

    @field_validator("value")
    @classmethod
    def value_must_be_valid(cls, v):
        if v not in (1, -1):
            raise ValueError("value must be 1 (like) or -1 (dislike)")

        return v
    
class RatingSummary(BaseModel):
    content_id: int
    likes: int
    dislikes: int
    my_rating: int | None