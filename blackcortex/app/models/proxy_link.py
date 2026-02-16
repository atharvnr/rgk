from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field


class ProxyLinkStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    REVOKED = "revoked"


class ProxyLink(Document):
    proxy_user_id: Indexed(str)  # type: ignore[valid-type]
    needy_user_id: Indexed(str)  # type: ignore[valid-type]
    status: ProxyLinkStatus = ProxyLinkStatus.PENDING
    rejection_reason: str | None = None
    requested_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    confirmed_at: datetime | None = None
    confirmed_by: str | None = None
    revoked_at: datetime | None = None
    revoked_by: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "proxy_links"
