from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str | None = Field(None, max_length=1000)


class RatingResponse(BaseModel):
    id: str
    session_id: str
    request_id: str
    volunteer_id: str
    rated_by: str
    rated_by_role: str
    score: int
    comment: str | None = None
    created_at: datetime
