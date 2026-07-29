from pydantic import BaseModel

class ProfileCreate(BaseModel):
    name: str
    avatar_url: str | None = None

class ProfileUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None

class ProfileOut(BaseModel):
    id: int
    name: str
    avatar_url: str | None = None

    class Config:
        from_attributes = True

class ProfileSelectResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"