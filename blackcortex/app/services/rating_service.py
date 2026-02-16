from beanie.operators import In

from app.models.rating import Rating
from app.models.user import User, UserRole
from app.models.volunteer_session import VolunteerSession
from app.schemas.rating import RatingCreate
from app.services.proxy_service import verify_elder_access
from app.utils.exceptions import BadRequestError, ForbiddenError


async def create_rating(
    session: VolunteerSession, data: RatingCreate, user: User
) -> Rating:
    # Only needy or needy_proxy can rate
    if user.role not in (UserRole.NEEDY, UserRole.NEEDY_PROXY):
        raise ForbiddenError("Only needy or needy_proxy users can rate")

    # Session must be elder-confirmed
    if not session.elder_confirmed:
        raise BadRequestError("Session must be elder-confirmed before rating")

    # Check 1 rating per session
    existing = await Rating.find_one(Rating.session_id == str(session.id))
    if existing:
        raise BadRequestError("Session already rated")

    # D4: Use centralized verify_elder_access
    await verify_elder_access(user, session.elder_id)

    rating = Rating(
        session_id=str(session.id),
        request_id=session.request_id,
        volunteer_id=session.student_id,
        rated_by=str(user.id),
        rated_by_role=user.role,
        score=data.score,
        comment=data.comment,
    )
    await rating.insert()
    return rating


async def get_ratings_for_volunteer(volunteer_id: str) -> list[Rating]:
    return await Rating.find(Rating.volunteer_id == volunteer_id).to_list()


async def get_ratings_for_school(school_id: str) -> list[Rating]:
    # Get all volunteer IDs in this school
    volunteers = await User.find(
        User.school_id == school_id,
        User.role == UserRole.VOLUNTEER,
    ).to_list()
    volunteer_ids = [str(v.id) for v in volunteers]
    if not volunteer_ids:
        return []

    return await Rating.find(
        In(Rating.volunteer_id, volunteer_ids)
    ).to_list()
