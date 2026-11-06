import argparse

import pytest

from app.models.proxy_link import ProxyLink
from app.models.rating import Rating
from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.seed.demo import parse_binding, seed
from tests.factories import create_test_school, create_test_user


def _args(**kwargs) -> argparse.Namespace:
    defaults = {"reset": False, "admin": None, "volunteer": None, "elder": None}
    return argparse.Namespace(**{**defaults, **kwargs})


@pytest.mark.asyncio
async def test_seed_counts_and_markers():
    result = await seed(_args())
    assert result["skipped"] is False
    assert await School.find_all().count() == 1
    assert await User.find_all().count() == 16
    assert await User.find(User.role == UserRole.VOLUNTEER).count() == 8
    assert await User.find(User.role == UserRole.NEEDY).count() == 5
    assert await ProxyLink.find_all().count() == 1
    assert await VolunteerRequest.find_all().count() == 14
    for status, n in [("open", 4), ("assigned", 3), ("in_progress", 2), ("completed", 4)]:
        assert await VolunteerRequest.find(VolunteerRequest.status == status).count() == n
    assert await VolunteerRequest.find(VolunteerRequest.status == "cancelled").count() == 1
    assert await VolunteerSession.find_all().count() == 24
    assert await VolunteerSession.find(VolunteerSession.status == "approved").count() == 16
    assert await VolunteerSession.find(VolunteerSession.status == "pending_approval").count() == 4
    assert await VolunteerSession.find(VolunteerSession.status == "rejected").count() == 1
    assert await Rating.find_all().count() == 12

    async for user in User.find_all():
        assert user.auth0_id.startswith("demo|")
        assert user.email.endswith("@demo.rentgrandkids.org")


@pytest.mark.asyncio
async def test_seed_session_integrity():
    await seed(_args())
    requests = {str(r.id): r for r in await VolunteerRequest.find_all().to_list()}
    sessions = await VolunteerSession.find_all().to_list()
    for s in sessions:
        req = requests[s.request_id]
        assert s.elder_id == req.elder_id
        assert s.student_id == req.assigned_student_id
        assert 1.0 <= s.hours_logged <= 3.5
        if s.status == SessionStatus.APPROVED:
            assert s.elder_confirmed is True
            assert s.approved_by and s.approved_at
            assert req.status in (
                RequestStatus.COMPLETED,
                RequestStatus.IN_PROGRESS,
                RequestStatus.ASSIGNED,
            )
        if s.status == SessionStatus.REJECTED:
            assert s.rejection_reason


@pytest.mark.asyncio
async def test_seed_second_run_is_noop():
    await seed(_args())
    before = await User.find_all().count()
    result = await seed(_args())
    assert result == {"skipped": True}
    assert await User.find_all().count() == before
    assert await School.find_all().count() == 1


@pytest.mark.asyncio
async def test_seed_reset_leaves_one_school_and_keeps_other_data():
    other_school = await create_test_school(name="Other School")
    other = await create_test_user(auth0_id="auth0|real", email="real@example.com")
    await seed(_args())
    await seed(_args(reset=True))
    assert await School.find(School.name == "Lincoln High School").count() == 1
    assert await School.find_all().count() == 2
    assert await User.find_all().count() == 17
    assert await VolunteerSession.find_all().count() == 24
    assert await Rating.find_all().count() == 12
    assert await School.get(other_school.id) is not None
    assert await User.get(other.id) is not None


@pytest.mark.asyncio
async def test_seed_bindings_and_rebind_on_reset():
    args = _args(
        admin="auth0|admin1:dana@real.org",
        volunteer="auth0|vol1:vol@real.org",
        elder="auth0|elder1:elder@real.org",
    )
    result = await seed(args)
    assert result["bound"] == {
        "admin": "dana@real.org",
        "volunteer": "vol@real.org",
        "elder": "elder@real.org",
    }
    vol = await User.find_one(User.auth0_id == "auth0|vol1")
    elder = await User.find_one(User.auth0_id == "auth0|elder1")
    assert vol and elder
    counts: dict[str, int] = {}
    for s in await VolunteerSession.find_all().to_list():
        counts[s.student_id] = counts.get(s.student_id, 0) + 1
    assert max(counts, key=lambda k: counts[k]) == str(vol.id)
    req_counts: dict[str, int] = {}
    for r in await VolunteerRequest.find_all().to_list():
        req_counts[r.elder_id] = req_counts.get(r.elder_id, 0) + 1
    assert max(req_counts, key=lambda k: req_counts[k]) == str(elder.id)

    await seed(args.__class__(**{**vars(args), "reset": True}))
    assert await User.find_all().count() == 16
    assert await School.find_all().count() == 1


@pytest.mark.asyncio
async def test_seed_binding_clash_with_real_user_fails():
    await create_test_user(auth0_id="auth0|vol1", email="x@real.org")
    with pytest.raises(ValueError, match="already exists"):
        await seed(_args(volunteer="auth0|vol1:vol@real.org"))
    assert await School.find_all().count() == 0


@pytest.mark.parametrize("value", ["nocolon", ":a@b.co", "id:", "id:notanemail", "a b:c@d.org"])
def test_parse_binding_rejects_bad_input(value):
    with pytest.raises(ValueError, match="--admin"):
        parse_binding(value, "--admin")


def test_parse_binding_ok():
    assert parse_binding("auth0|abc:me@x.org", "--admin") == ("auth0|abc", "me@x.org")
    assert parse_binding(None, "--admin") is None
