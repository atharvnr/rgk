from datetime import datetime

from pydantic import BaseModel, Field

from app.models.proxy_link import ProxyLinkStatus


class ProxyLinkCreate(BaseModel):
    needy_user_id: str


class ProxyLinkRejectBody(BaseModel):
    rejection_reason: str = Field(max_length=500)


class ProxyLinkResponse(BaseModel):
    id: str
    proxy_user_id: str
    needy_user_id: str
    status: ProxyLinkStatus
    rejection_reason: str | None = None
    requested_at: datetime
    confirmed_at: datetime | None = None
    confirmed_by: str | None = None
    revoked_at: datetime | None = None
    revoked_by: str | None = None
    created_at: datetime
    updated_at: datetime
