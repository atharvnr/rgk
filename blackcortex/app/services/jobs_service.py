import logging
from datetime import UTC, datetime, timedelta

from app.models.school_association_request import (
    AssociationStatus,
    SchoolAssociationRequest,
)
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession

logger = logging.getLogger(__name__)


async def expire_stale_associations() -> int:
    now = datetime.now(UTC)
    # W10: Use update_many instead of per-document loop
    result = await SchoolAssociationRequest.find(
        SchoolAssociationRequest.status == AssociationStatus.PENDING,
        SchoolAssociationRequest.expires_at <= now,
    ).update_many(
        {"$set": {"status": AssociationStatus.EXPIRED, "updated_at": now}}
    )
    count = result.modified_count if result else 0
    logger.info("expire_stale_associations: expired %d", count)
    return count


async def expire_unconfirmed_sessions() -> int:
    cutoff = datetime.now(UTC) - timedelta(days=7)
    now = datetime.now(UTC)
    # W10: Use update_many instead of per-document loop
    result = await VolunteerSession.find(
        VolunteerSession.status == SessionStatus.PENDING_ELDER_CONFIRMATION,
        VolunteerSession.created_at <= cutoff,
    ).update_many(
        {
            "$set": {
                "status": SessionStatus.REJECTED,
                "rejection_reason": "Auto-expired: elder did not confirm within 7 days",
                "updated_at": now,
            }
        }
    )
    count = result.modified_count if result else 0
    logger.info("expire_unconfirmed_sessions: expired %d", count)
    return count


async def notify_stale_requests() -> int:
    # Placeholder: in MVP, this would send emails to needy users
    # with requests open for 14+ days. For now, just count them.
    cutoff = datetime.now(UTC) - timedelta(days=14)
    return await VolunteerRequest.find(
        VolunteerRequest.status == RequestStatus.OPEN,
        VolunteerRequest.created_at <= cutoff,
    ).count()
