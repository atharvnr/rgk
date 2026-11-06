from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.auth.jwt import get_current_user
from app.auth.root_users import is_root_email, normalize_email
from app.models.user import UserRole, VerificationStatus
from tests.factories import create_test_user


def test_normalize_basic():
    assert normalize_email("  Foo@Example.COM ") == "foo@example.com"
    assert normalize_email("a.b+c@example.com") == "a.b+c@example.com"


def test_normalize_gmail():
    assert normalize_email("A.B+tag@Gmail.com") == "ab@gmail.com"
    assert normalize_email("a.b@googlemail.com") == "ab@googlemail.com"


def test_is_root_email_gmail_dots():
    with patch("app.auth.root_users.settings") as s:
        s.rgk_root_users = ["atharvnithinravanikar@gmail.com"]
        assert is_root_email("atharv.nithinravanikar@gmail.com")
        assert is_root_email("Atharv.Nithinravanikar+x@gmail.com")
        assert not is_root_email("other@gmail.com")


def test_is_root_email_empty():
    with patch("app.auth.root_users.settings") as s:
        s.rgk_root_users = []
        assert not is_root_email("a@b.com")


CREDS = SimpleNamespace(credentials="tok")


@pytest.mark.asyncio
async def test_get_current_user_promotes_to_root():
    user = await create_test_user(
        auth0_id="auth0|promo",
        email="promo.user@gmail.com",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.UNVERIFIED,
    )
    with (
        patch("app.auth.root_users.settings") as s,
        patch("app.auth.jwt.decode_token", return_value={"sub": "auth0|promo"}),
    ):
        s.rgk_root_users = ["promouser@gmail.com"]
        got = await get_current_user(CREDS)
    assert got.role == UserRole.ROOT
    assert got.verification_status == VerificationStatus.NOT_REQUIRED
    await user.sync()
    assert user.role == UserRole.ROOT


@pytest.mark.asyncio
async def test_get_current_user_never_demotes():
    await create_test_user(auth0_id="auth0|r", email="r@example.com", role=UserRole.ROOT)
    with (
        patch("app.auth.root_users.settings") as s,
        patch("app.auth.jwt.decode_token", return_value={"sub": "auth0|r"}),
    ):
        s.rgk_root_users = []
        got = await get_current_user(CREDS)
    assert got.role == UserRole.ROOT


@pytest.mark.asyncio
async def test_get_current_user_non_configured_unchanged():
    await create_test_user(auth0_id="auth0|v", email="v@example.com")
    with (
        patch("app.auth.root_users.settings") as s,
        patch("app.auth.jwt.decode_token", return_value={"sub": "auth0|v"}),
    ):
        s.rgk_root_users = ["x@example.com"]
        got = await get_current_user(CREDS)
    assert got.role == UserRole.VOLUNTEER
