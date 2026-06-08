from fastapi import APIRouter, Depends, HTTPException

from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.verification import VerificationRequestCreate, VerificationRequestResponse
from app.services.verification_service import create_verification_request
from app.utils.response import model_to_response

router = APIRouter(prefix="/verification-requests", tags=["verification"])


@router.post("", response_model=VerificationRequestResponse, status_code=201)
async def create_request(data: VerificationRequestCreate, user: User = Depends(get_current_user)):
    # Only needy/needy_proxy/volunteer may request verification assistance
    req = await create_verification_request(str(user.id), user.email, user.name, user.phone, data.message)
    return model_to_response(req)
