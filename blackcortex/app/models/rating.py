from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field


class Rating(Document):
    session_id: Indexed(str, unique=True)  # type: ignore[valid-type]
    request_id: Indexed(str)  # type: ignore[valid-type]
    volunteer_id: Indexed(str)  # type: ignore[valid-type]
    rated_by: str
    rated_by_role: str
    score: int = Field(ge=1, le=5)
    comment: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "ratings"
