from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class School(Document):
    name: Indexed(str)  # type: ignore[valid-type]
    address: str
    city: str
    state: str
    zip_code: str
    contact_email: EmailStr
    contact_phone: str | None = None
    admin_ids: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "schools"
