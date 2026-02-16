from beanie import Document, PydanticObjectId

from app.utils.exceptions import NotFoundError


async def get_document_by_id(
    model: type[Document], doc_id: str, label: str = "Resource"
) -> Document:
    """Generic get-by-id with consistent error handling."""
    try:
        doc = await model.get(PydanticObjectId(doc_id))
    except Exception:
        raise NotFoundError(f"{label} not found")
    if doc is None:
        raise NotFoundError(f"{label} not found")
    return doc
