from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    SignupRequest,
    SignupResponse,
)
from app.services.auth import (
    login_user as login_user_service,
    signup_user as signup_user_service,
    delete_user as delete_user_service,
)
from app.services.dependencies import get_current_user


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=SignupResponse,
)
async def signup_user(
    data: Annotated[SignupRequest, Depends(SignupRequest.as_form)],
    image: UploadFile = File(...),
):
    return await signup_user_service(
        name=data.name,
        email=data.email,
        image=image,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login_user(
    data: Annotated[LoginRequest, Depends(LoginRequest.as_form)],
    image: UploadFile = File(...),
):
    return await login_user_service(
        email=data.email,
        image=image,
    )


@router.get(
    "/me",
    response_model=MeResponse,
)
async def get_me(
    email: str = Depends(get_current_user),
):
    return {
        "success": True,
        "email": email,
    }
@router.delete("/me")
async def delete_me(
    email: str = Depends(get_current_user),
):
    return delete_user_service(email)