"""Seed a realistic demo world.

Usage (from the blackcortex dir):
    python -m app.seed.demo [--reset] [--admin ID:EMAIL] [--volunteer ID:EMAIL] [--elder ID:EMAIL]

Idempotency comes from markers: every demo user has an auth0_id starting with `demo|` and the
demo school is named "Lincoln High School".
"""

import argparse
import asyncio
import re
import sys
from datetime import UTC, datetime, timedelta

from app.models.proxy_link import ProxyLink, ProxyLinkStatus
from app.models.rating import Rating
from app.models.school import School
from app.models.user import User, UserRole, VerificationStatus
from app.models.volunteer_request import RequestCategory, RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession

DEMO_PREFIX = "demo|"
DEMO_EMAIL_DOMAIN = "demo.rentgrandkids.org"
DEMO_SCHOOL_NAME = "Lincoln High School"
STATS_CACHE_KEY = "public:stats"

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# (name, school_email local part)
VOLUNTEERS = [
    "Marcus Johnson",
    "Priya Patel",
    "Sofia Ramirez",
    "Tyler Nguyen",
    "Aaliyah Brooks",
    "Jake Kowalski",
    "Mei-Ling Chen",
    "Omar Hassan",
]

# (name, address, phone)
ELDERS = [
    ("Dorothy Hendricks", "412 Maple Ave, Springfield, IL 62704", "(217) 555-0142"),
    ("Walter Briggs", "88 Oak Street, Springfield, IL 62702", "(217) 555-0178"),
    ("Ruth Alvarez", "1507 S 5th Street, Springfield, IL 62703", "(217) 555-0163"),
    ("Harold Fitzgerald", "230 Edwards Street, Springfield, IL 62704", "(217) 555-0119"),
    ("Eleanor Whitaker", "975 Lawrence Avenue, Springfield, IL 62704", "(217) 555-0136"),
]

# (elder, category, title, description, status, volunteer or None, days_ago created, time slot)
REQUESTS = [
    (
        0,
        RequestCategory.TECH_HELP,
        "Set up video calls with my grandkids",
        "My grandchildren live in Denver and Austin. I have a tablet but can't figure out how to "
        "make video calls. I'd love someone patient to set it up and show me how.",
        RequestStatus.COMPLETED,
        0,
        118,
        "Afternoons",
    ),
    (
        0,
        RequestCategory.OTHER,
        "Help sorting a year of mail and bills",
        "I've let the mail pile up since my hip surgery. I need help sorting it, filing what "
        "matters, and setting up a simple system I can keep up with.",
        RequestStatus.COMPLETED,
        0,
        76,
        "Weekday mornings",
    ),
    (
        0,
        RequestCategory.COMPANIONSHIP,
        "Weekly visit and a game of gin rummy",
        "I live alone and the afternoons get quiet. Looking for someone to visit once a week, "
        "have tea, and play cards.",
        RequestStatus.IN_PROGRESS,
        0,
        45,
        "Thursday afternoons",
    ),
    (
        0,
        RequestCategory.YARD_WORK,
        "Rake leaves before the first frost",
        "The maple in my front yard drops a lot of leaves and I can't bend down like I used to. "
        "Rake and bag, please. Bags are in the garage.",
        RequestStatus.ASSIGNED,
        6,
        20,
        "Weekend mornings",
    ),
    (
        0,
        RequestCategory.TRANSPORTATION,
        "Ride to Tuesday physical therapy",
        "I have physical therapy every Tuesday at 10am on Wabash Avenue and no longer drive. "
        "Need a ride there and back for the next six weeks.",
        RequestStatus.OPEN,
        None,
        5,
        "Tuesdays 9:30am",
    ),
    (
        0,
        RequestCategory.ERRANDS,
        "Return library books and pick up large-print ones",
        "I have a stack of books due at the Lincoln Library. I'd also love help picking out "
        "large-print mysteries.",
        RequestStatus.OPEN,
        None,
        3,
        "Any weekday",
    ),
    (
        1,
        RequestCategory.YARD_WORK,
        "Trim the overgrown hedges out front",
        "The hedges along the walk have gotten out of hand and the neighbors have started to "
        "notice. I have shears but my shoulders won't let me use them.",
        RequestStatus.COMPLETED,
        1,
        100,
        "Saturday mornings",
    ),
    (
        1,
        RequestCategory.ERRANDS,
        "Weekly grocery run to Kroger",
        "Need someone to take me to the store on Saturdays and help carry bags in. I have a "
        "short list and can pay for my own groceries.",
        RequestStatus.ASSIGNED,
        4,
        30,
        "Saturday 10am",
    ),
    (
        2,
        RequestCategory.TECH_HELP,
        "Help me set up my new tablet",
        "My daughter sent me a tablet for my birthday and it is still in the box. I want to read "
        "email, see photos, and maybe listen to old radio shows.",
        RequestStatus.COMPLETED,
        2,
        95,
        "Weekday afternoons",
    ),
    (
        2,
        RequestCategory.COMPANIONSHIP,
        "Someone to read the paper with me on Sundays",
        "My eyes tire easily. I'd enjoy company on Sunday afternoons to read the paper aloud "
        "and talk about the news.",
        RequestStatus.OPEN,
        None,
        8,
        "Sunday afternoons",
    ),
    (
        3,
        RequestCategory.YARD_WORK,
        "Clear the gutters and haul storm branches",
        "A storm brought down several branches and the gutters are full of leaves. I need them "
        "cleared before the rain comes in. Ladder is in the shed.",
        RequestStatus.IN_PROGRESS,
        3,
        40,
        "Weekend mornings",
    ),
    (
        3,
        RequestCategory.TRANSPORTATION,
        "Ride to the VFW pancake breakfast",
        "I'd like to go to the VFW breakfast on the first Sunday of the month but don't like "
        "driving in the dark.",
        RequestStatus.CANCELLED,
        None,
        50,
        "First Sunday",
    ),
    (
        4,
        RequestCategory.COMPANIONSHIP,
        "Cook together and write down my mother's recipes",
        "I want to get my mother's recipes written down for my grandchildren before I forget "
        "them. Help me cook and take notes.",
        RequestStatus.ASSIGNED,
        5,
        25,
        "Wednesday afternoons",
    ),
    (
        4,
        RequestCategory.TRANSPORTATION,
        "Ride to church on Sunday mornings",
        "My church is only ten minutes away but my car is in the shop for good. Looking for a "
        "ride to the 9am service.",
        RequestStatus.OPEN,
        None,
        6,
        "Sundays 8:45am",
    ),
]

A = SessionStatus.APPROVED
PA = SessionStatus.PENDING_APPROVAL
PE = SessionStatus.PENDING_ELDER_CONFIRMATION
RJ = SessionStatus.REJECTED

# (request idx, days ago, hours, status, notes, (rating score, comment) or None)
SESSIONS = [
    (
        0,
        112,
        2.0,
        A,
        "Installed the video chat app and made a first call to her grandson.",
        (5, "Marcus was so patient. I talked to my grandson for an hour!"),
    ),
    (
        0,
        98,
        1.5,
        A,
        "Practiced calling on her own. Wrote step-by-step instructions in large print.",
        (5, "He even wrote the steps down big enough for me to read."),
    ),
    (0, 84, 1.0, A, "Set up a second contact for her granddaughter in Austin.", None),
    (
        1,
        70,
        3.0,
        A,
        "Sorted mail by month and separated bills from junk.",
        (5, "Finally I can see my kitchen table again. Wonderful young man."),
    ),
    (1, 55, 2.5, A, "Filed bills in a folder system and set up a simple payment calendar.", None),
    (
        2,
        41,
        2.0,
        A,
        "Tea and gin rummy. She won two of three games.",
        (5, "I look forward to Thursdays now."),
    ),
    (
        2,
        27,
        2.0,
        A,
        "Looked through old photo albums together and played cards.",
        (4, "Lovely visit, and he is learning to lose gracefully at cards."),
    ),
    (
        2,
        12,
        2.5,
        A,
        "Played cards and helped her organize the pill box for the week.",
        (5, "Always on time and always kind."),
    ),
    (2, 4, 2.0, PA, "Visit and card game. She taught me a new variation.", None),
    (
        6,
        90,
        3.5,
        A,
        "Trimmed both front hedges and bagged all the clippings.",
        (5, "The hedges look better than they have in years."),
    ),
    (6, 75, 2.0, A, "Second pass to even out the top and clean up the walkway.", None),
    (
        6,
        60,
        1.5,
        A,
        "Pulled weeds along the front path while we chatted about his Navy days.",
        (5, "Priya listened to all my old stories. A treasure."),
    ),
    (
        8,
        80,
        2.0,
        A,
        "Unboxed the tablet, connected to wifi, and set up email.",
        (5, "Sofia explained everything twice without making me feel silly."),
    ),
    (
        8,
        50,
        1.5,
        A,
        "Added family photos and showed her how to enlarge text.",
        (4, "Very helpful. I wish she could come back every week."),
    ),
    (8, 33, 1.0, RJ, "Quick check-in on the tablet.", None),
    (
        10,
        38,
        3.0,
        A,
        "Hauled storm branches to the curb and cleared the back gutters.",
        (5, "Tyler worked all afternoon without a complaint."),
    ),
    (
        10,
        22,
        2.5,
        A,
        "Cleared the front gutters and checked the downspouts.",
        (5, "Everything is draining properly now. Thank you!"),
    ),
    (10, 9, 2.0, PA, "Cut the last of the fallen limbs into pieces for the curb pickup.", None),
    (7, 18, 2.0, A, "Weekly Kroger trip. Carried bags in and put the cold items away.", None),
    (7, 6, 2.0, PE, "Grocery run plus picked up his pharmacy order.", None),
    (12, 15, 2.5, PA, "Made her mother's pierogi and wrote down the recipe card.", None),
    (12, 3, 2.0, PE, "Baked apple kuchen together and wrote up the instructions.", None),
    (3, 10, 3.0, PA, "Raked the front yard and filled eight bags with leaves.", None),
    (3, 2, 1.5, PE, "Finished the back corner of the yard.", None),
]
REJECTION_REASON = "Hours do not match the visit described; please resubmit with more detail."


def parse_binding(value: str | None, flag: str) -> tuple[str, str] | None:
    """Parse an `auth0_id:email` binding; raise ValueError with a clear message if malformed."""
    if value is None:
        return None
    auth0_id, sep, email = value.partition(":")
    auth0_id, email = auth0_id.strip(), email.strip()
    if not sep or not auth0_id or not email or re.search(r"\s", auth0_id):
        raise ValueError(f"{flag}: expected 'auth0_id:email', got {value!r}")
    if not _EMAIL_RE.match(email):
        raise ValueError(f"{flag}: invalid email {email!r} (expected 'auth0_id:email')")
    return auth0_id, email


def _at(now: datetime, days_ago: int, hour: int = 17) -> datetime:
    when = (now - timedelta(days=days_ago)).replace(hour=hour, minute=0, second=0, microsecond=0)
    return min(when, now - timedelta(minutes=1))


def _demo_email(slug: str) -> str:
    return f"{slug}@{DEMO_EMAIL_DOMAIN}"


def _sid(doc) -> str:
    return str(doc.id)


async def _reset() -> None:
    """Delete every document created by a previous seed run."""
    schools = await School.find(School.name == DEMO_SCHOOL_NAME).to_list()
    school_ids = {_sid(s) for s in schools}

    found: dict[str, User] = {}
    for u in await User.find({"auth0_id": {"$regex": f"^{re.escape(DEMO_PREFIX)}"}}).to_list():
        found[_sid(u)] = u
    # Users bound to real Auth0 logins on a previous run carry no `demo|` prefix; find them via
    # their school membership or as the elder of a demo request.
    if school_ids:
        for u in await User.find({"school_id": {"$in": list(school_ids)}}).to_list():
            found[_sid(u)] = u
    titles = [r[2] for r in REQUESTS]
    demo_reqs = await VolunteerRequest.find({"title": {"$in": titles}}).to_list()
    elder_ids = {r.elder_id for r in demo_reqs}
    for u in await User.find(User.role == UserRole.NEEDY).to_list():
        if _sid(u) in elder_ids:
            found[_sid(u)] = u
    user_ids = set(found)

    ids = list(user_ids)
    sch = list(school_ids)
    requests = await VolunteerRequest.find(
        {"$or": [{"elder_id": {"$in": ids}}, {"assigned_student_id": {"$in": ids}}]}
    ).to_list()
    request_ids = [_sid(r) for r in requests]
    sessions = await VolunteerSession.find(
        {
            "$or": [
                {"student_id": {"$in": ids}},
                {"elder_id": {"$in": ids}},
                {"school_id": {"$in": sch}},
                {"request_id": {"$in": request_ids}},
            ]
        }
    ).to_list()
    session_ids = [_sid(s) for s in sessions]
    ratings = await Rating.find(
        {
            "$or": [
                {"volunteer_id": {"$in": ids}},
                {"session_id": {"$in": session_ids}},
                {"request_id": {"$in": request_ids}},
            ]
        }
    ).to_list()
    links = await ProxyLink.find(
        {"$or": [{"proxy_user_id": {"$in": ids}}, {"needy_user_id": {"$in": ids}}]}
    ).to_list()

    for group in (ratings, sessions, requests, links, schools, list(found.values())):
        for doc in group:
            await doc.delete()


async def seed(args) -> dict:
    """Insert the demo world. Returns a dict of counts (and bindings) for the summary."""
    admin_bind = parse_binding(getattr(args, "admin", None), "--admin")
    vol_bind = parse_binding(getattr(args, "volunteer", None), "--volunteer")
    elder_bind = parse_binding(getattr(args, "elder", None), "--elder")

    existing = await School.find_one(School.name == DEMO_SCHOOL_NAME)
    if existing and not getattr(args, "reset", False):
        return {"skipped": True}

    if getattr(args, "reset", False):
        await _reset()

    for flag, bind in (("--admin", admin_bind), ("--volunteer", vol_bind), ("--elder", elder_bind)):
        if bind is None:
            continue
        clash = await User.find_one({"$or": [{"auth0_id": bind[0]}, {"email": bind[1]}]})
        if clash:
            raise ValueError(
                f"{flag}: a user with auth0_id {clash.auth0_id!r} / email {clash.email!r} "
                "already exists and is not part of the demo data"
            )
    if len({b[0] for b in (admin_bind, vol_bind, elder_bind) if b}) != len(
        [b for b in (admin_bind, vol_bind, elder_bind) if b]
    ):
        raise ValueError("--admin, --volunteer and --elder must use different auth0_ids")

    now = datetime.now(UTC)
    start = _at(now, 125)

    school = School(
        name=DEMO_SCHOOL_NAME,
        address="2300 W Governor Street",
        city="Springfield",
        state="IL",
        zip_code="62704",
        contact_email=_demo_email("office-lincolnhs"),
        contact_phone="(217) 555-0100",
        created_at=start,
        updated_at=start,
    )
    await school.insert()
    school_id = _sid(school)

    async def make_user(slug, name, role, bind=None, **kwargs) -> User:
        auth0_id, email = bind if bind else (f"{DEMO_PREFIX}{slug}", _demo_email(slug))
        user = User(
            auth0_id=auth0_id,
            email=email,
            name=name,
            role=role,
            created_at=kwargs.pop("created_at", start),
            updated_at=start,
            **kwargs,
        )
        await user.insert()
        return user

    admin = await make_user(
        "admin-01",
        "Ms. Dana Whitfield",
        UserRole.SCHOOL_ADMIN,
        admin_bind,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=school_id,
        phone="(217) 555-0101",
        bio="Service learning coordinator at Lincoln High School.",
    )
    school.admin_ids = [_sid(admin)]
    await school.save()
    await make_user(
        "teacher-01",
        "Mr. Brian Okafor",
        UserRole.SCHOOL_USER,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=school_id,
        bio="Social studies teacher; reviews volunteer hours.",
    )

    volunteers: list[User] = []
    for i, name in enumerate(VOLUNTEERS):
        volunteers.append(
            await make_user(
                f"volunteer-{i + 1:02d}",
                name,
                UserRole.VOLUNTEER,
                vol_bind if i == 0 else None,
                verification_status=VerificationStatus.VERIFIED,
                school_id=school_id,
                school_issued_id=f"STU-{1041 + i * 7}",
                school_email=f"{name.split()[-1].lower()}{1041 + i * 7}@lincolnhs.example",
                created_at=_at(now, 120 - i * 3),
            )
        )

    elders: list[User] = []
    for i, (name, address, phone) in enumerate(ELDERS):
        elders.append(
            await make_user(
                f"elder-{i + 1:02d}",
                name,
                UserRole.NEEDY,
                elder_bind if i == 0 else None,
                verification_status=VerificationStatus.VERIFIED,
                address=address,
                phone=phone,
                created_at=_at(now, 122 - i * 2),
            )
        )

    proxy = await make_user(
        "proxy-01",
        "Karen Briggs",
        UserRole.NEEDY_PROXY,
        verification_status=VerificationStatus.VERIFIED,
        phone="(217) 555-0184",
        bio="Walter's daughter; helps manage his requests.",
        created_at=_at(now, 110),
    )
    link_at = _at(now, 108)
    await ProxyLink(
        proxy_user_id=_sid(proxy),
        needy_user_id=_sid(elders[1]),
        status=ProxyLinkStatus.ACTIVE,
        requested_at=_at(now, 109),
        confirmed_at=link_at,
        confirmed_by=_sid(admin),
        created_at=_at(now, 109),
        updated_at=link_at,
    ).insert()

    requests: list[VolunteerRequest] = []
    for elder_i, category, title, desc, status, vol_i, days, slot in REQUESTS:
        created = _at(now, days, 9)
        req = VolunteerRequest(
            elder_id=_sid(elders[elder_i]),
            title=title,
            description=desc,
            category=category,
            status=status,
            location=ELDERS[elder_i][1],
            preferred_time_slot=slot,
            assigned_student_id=_sid(volunteers[vol_i]) if vol_i is not None else None,
            created_at=created,
            updated_at=created + timedelta(days=1),
        )
        await req.insert()
        requests.append(req)

    session_count = rating_count = 0
    last_activity: dict[int, datetime] = {}
    for req_i, days, hours, sess_status, notes, rating in SESSIONS:
        req = requests[req_i]
        student_id = req.assigned_student_id
        assert student_id is not None
        when = _at(now, days)
        confirmed = sess_status != PE
        approved = sess_status == A
        session = VolunteerSession(
            request_id=_sid(req),
            student_id=student_id,
            elder_id=req.elder_id,
            school_id=school_id,
            hours_logged=hours,
            date=when.date().isoformat(),
            notes=notes,
            status=sess_status,
            elder_confirmed=confirmed,
            elder_confirmed_at=min(when + timedelta(days=1), now) if confirmed else None,
            elder_confirmed_by=req.elder_id if confirmed else None,
            approved_by=_sid(admin) if approved else None,
            approved_at=min(when + timedelta(days=2), now) if approved else None,
            rejection_reason=REJECTION_REASON if sess_status == RJ else None,
            created_at=when,
            updated_at=min(when + timedelta(days=2), now),
        )
        await session.insert()
        session_count += 1
        last_activity[req_i] = max(last_activity.get(req_i, when), session.updated_at)
        if rating and approved:
            await Rating(
                session_id=_sid(session),
                request_id=_sid(req),
                volunteer_id=student_id,
                rated_by=req.elder_id,
                rated_by_role=UserRole.NEEDY.value,
                score=rating[0],
                comment=rating[1],
                created_at=min(when + timedelta(days=3), now),
            ).insert()
            rating_count += 1

    for req_i, when in last_activity.items():
        if requests[req_i].status == RequestStatus.COMPLETED:
            requests[req_i].updated_at = when
            await requests[req_i].save()

    return {
        "skipped": False,
        "schools": 1,
        "users": 2 + len(volunteers) + len(elders) + 1,
        "proxy_links": 1,
        "requests": len(requests),
        "sessions": session_count,
        "ratings": rating_count,
        "bound": {
            k: v[1]
            for k, v in (("admin", admin_bind), ("volunteer", vol_bind), ("elder", elder_bind))
            if v
        },
    }


async def invalidate_public_stats_cache() -> None:
    """Best-effort: drop the cached public stats so the new data shows up. Ignores errors."""
    try:
        from app.database import get_redis

        await get_redis().delete(STATS_CACHE_KEY)
    except Exception:
        pass


def _print_summary(result: dict) -> None:
    rows = [
        (k, result[k])
        for k in ("schools", "users", "proxy_links", "requests", "sessions", "ratings")
    ]
    print(f"{'collection':<14}{'count':>6}")
    print("-" * 20)
    for name, count in rows:
        print(f"{name:<14}{count:>6}")
    for role, email in result["bound"].items():
        print(f"bound {role}: {email}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed demo data for RentGrandKids.")
    parser.add_argument("--reset", action="store_true", help="delete existing demo data first")
    parser.add_argument("--admin", metavar="AUTH0_ID:EMAIL", help="bind the school admin")
    parser.add_argument("--volunteer", metavar="AUTH0_ID:EMAIL", help="bind the top volunteer")
    parser.add_argument("--elder", metavar="AUTH0_ID:EMAIL", help="bind the top elder")
    return parser


async def _run(args) -> int:
    from app.database import close_db, init_db

    await init_db()
    try:
        result = await seed(args)
        if result["skipped"]:
            print("Demo data already present (use --reset to recreate)")
            return 0
        await invalidate_public_stats_cache()
        _print_summary(result)
        return 0
    finally:
        await close_db()


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    for flag in ("admin", "volunteer", "elder"):
        try:
            parse_binding(getattr(args, flag), f"--{flag}")
        except ValueError as exc:
            parser.error(str(exc))
    try:
        code = asyncio.run(_run(args))
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        code = 1
    sys.exit(code)


if __name__ == "__main__":
    main()
