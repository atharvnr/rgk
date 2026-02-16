from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    actor_role: str
    action: str
    target_type: str
    target_id: str
    details: dict | None = None
    timestamp: datetime
