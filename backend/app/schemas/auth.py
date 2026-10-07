from typing import Annotated

from fastapi import Form
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr

    @classmethod
    def as_form(
        cls,
        name: Annotated[str, Form(...)],
        email: Annotated[EmailStr, Form(...)],
    ):
        return cls(name=name, email=email)


class LoginRequest(BaseModel):
    email: EmailStr

    @classmethod
    def as_form(
        cls,
        email: Annotated[EmailStr, Form(...)],
    ):
        return cls(email=email)


class SignupResponse(BaseModel):
    success: bool
    message: str
    name: str
    email: EmailStr


class LoginResponse(BaseModel):
    success: bool
    message: str
    email: EmailStr
    access_token: str
    token_type: str


class MeResponse(BaseModel):
    success: bool
    email: EmailStr