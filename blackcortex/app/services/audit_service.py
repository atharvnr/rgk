from app.models.audit_log import AuditLog
from app.models.user import User


async def log_action(
    actor: User,
    action: str,
    target_type: str,
    target_id: str,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor_id=str(actor.id),
        actor_role=actor.role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )
    await entry.insert()
    return entry


async def list_audit_logs(
    skip: int = 0,
    limit: int = 20,
    action: str | None = None,
    actor_id: str | None = None,
) -> tuple[list[AuditLog], int]:
    filters = []
    if action:
        filters.append(AuditLog.action == action)
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)

    query = AuditLog.find(*filters) if filters else AuditLog.find()
    total = await query.count()
    # W12: Reuse query instead of rebuilding
    items = await query.sort(-AuditLog.timestamp).skip(skip).limit(limit).to_list()
    return items, total
