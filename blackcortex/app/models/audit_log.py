from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field


class AuditLog(Document):
    actor_id: Indexed(str)  # type: ignore[valid-type]
    actor_role: str
    action: str
    target_type: str
    target_id: str
    details: dict | None = None
    timestamp: Indexed(datetime) = Field(  # type: ignore[valid-type]
        default_factory=lambda: datetime.now(UTC)
    )

    class Settings:
        name = "audit_logs"
        indexes = [
            [("action", 1), ("timestamp", -1)],
        ]
