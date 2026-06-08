from app.models.verification_request import VerificationRequest


async def create_verification_request(user_id: str, email: str, name: str | None, phone: str | None, message: str | None) -> VerificationRequest:
    req = VerificationRequest(
        user_id=user_id,
        user_email=email,
        user_name=name,
        phone=phone,
        message=message,
    )
    await req.insert()
    return req


async def list_verification_requests(skip: int = 0, limit: int = 50):
    q = VerificationRequest.find().sort(-VerificationRequest.created_at)
    total = await q.count()
    items = await q.skip(skip).limit(limit).to_list()
    return items, total


async def resolve_verification_request(request_id: str, admin_id: str, notes: str | None = None):
    req = await VerificationRequest.get(request_id)
    if not req:
        return None
    await req.set({"status": "resolved", "resolved_by": admin_id, "resolved_at": req.created_at, "admin_notes": notes})
    return req
