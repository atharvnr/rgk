from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field


class AppConfig(Document):
    key: Indexed(str, unique=True)  # type: ignore[valid-type]
    value: dict
    description: str | None = None
    updated_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "app_configs"
