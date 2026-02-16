from datetime import UTC, datetime, timedelta

import pytest

from app.models.school_association_request import (
    AssociationStatus,
    SchoolAssociationRequest,
)
from app.models.volunteer_session import SessionStatus, VolunteerSession


@pytest.mark.asyncio
async def test_expire_associations(client):
    """Expire stale association requests older than 14 days."""
    req = SchoolAssociationRequest(
        user_id="user_stale",
        school_id="school_stale",
        role="volunteer",
        school_issued_id="STU-001",
        school_email="stale@school.edu",
        status=AssociationStatus.PENDING,
        expires_at=datetime.now(UTC) - timedelta(days=1),
    )
    await req.insert()

    resp = await client.post(
        "/api/v1/internal/jobs/expire-associations",
        headers={"Authorization": "Bearer test-internal-key"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["expired"] >= 1

    # Verify status changed
    updated = await SchoolAssociationRequest.get(req.id)
    assert updated.status == AssociationStatus.EXPIRED


@pytest.mark.asyncio
async def test_expire_sessions(client):
    """Expire unconfirmed sessions older than 7 days."""
    session = VolunteerSession(
        request_id="req_stale",
        student_id="vol_stale",
        elder_id="elder_stale",
        school_id="school_stale",
        hours_logged=2.0,
        date="2026-02-01",
        status=SessionStatus.PENDING_ELDER_CONFIRMATION,
        created_at=datetime.now(UTC) - timedelta(days=8),
    )
    await session.insert()

    resp = await client.post(
        "/api/v1/internal/jobs/expire-sessions",
        headers={"Authorization": "Bearer test-internal-key"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["expired"] >= 1

    # Verify status changed
    updated = await VolunteerSession.get(session.id)
    assert updated.status == SessionStatus.REJECTED
    assert "Auto-expired" in updated.rejection_reason


@pytest.mark.asyncio
async def test_notify_stale_requests(client):
    resp = await client.post(
        "/api/v1/internal/jobs/notify-stale-requests",
        headers={"Authorization": "Bearer test-internal-key"},
    )
    assert resp.status_code == 200
    assert "stale_count" in resp.json()


@pytest.mark.asyncio
async def test_internal_endpoints_require_key(client):
    resp = await client.post("/api/v1/internal/jobs/expire-associations")
    assert resp.status_code == 422  # Missing header

    resp = await client.post(
        "/api/v1/internal/jobs/expire-associations",
        headers={"Authorization": "Bearer wrong-key"},
    )
    assert resp.status_code == 401
