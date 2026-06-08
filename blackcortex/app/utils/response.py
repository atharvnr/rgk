from app.models.user import User


def user_to_response(user: User) -> dict:
    """Single source of truth for User -> response dict."""
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "verification_status": user.verification_status,
        "school_id": user.school_id,
        "school_issued_id": user.school_issued_id,
        "school_email": user.school_email,
        "address": user.address,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def rating_to_response(r) -> dict:
    """Single source of truth for Rating -> response dict."""
    return {
        "id": str(r.id),
        "session_id": r.session_id,
        "request_id": r.request_id,
        "volunteer_id": r.volunteer_id,
        "rated_by": r.rated_by,
        "rated_by_role": r.rated_by_role,
        "score": r.score,
        "comment": r.comment,
        "created_at": r.created_at,
    }


def paginated_response(
    items: list, total: int, skip: int, limit: int, mapper=None
) -> dict:
    """Single source of truth for paginated response shape."""
    return {
        "items": [mapper(i) for i in items] if mapper else items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


def model_to_response(model):
    d = model.model_dump()
    d["id"] = str(model.id)
    return d
