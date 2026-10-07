from fastapi import HTTPException, UploadFile

from app.services.face_recognition import (
    compare_faces,
    generate_face_encoding,
)
from app.services.vector_db import (
    find_similar_face,
    get_face_by_email,
    store_face_encoding,
    delete_face_by_email
)
from app.services.jwt import create_access_token

FACE_MATCH_THRESHOLD = 0.6


async def signup_user(
    name: str,
    email: str,
    image: UploadFile,
):
    existing_user = get_face_by_email(email)

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )

    image_bytes = await image.read()

    try:
        face_encoding = generate_face_encoding(image_bytes)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    similar_face = find_similar_face(face_encoding)

    if similar_face is not None:
        stored_encoding = similar_face.vector

        distance = compare_faces(
            known_encoding=stored_encoding,
            face_encoding=face_encoding,
        )

        print("Duplicate face distance:", distance)

        if distance <= FACE_MATCH_THRESHOLD:
            raise HTTPException(
                status_code=409,
                detail="Face is already registered.",
            )

    store_face_encoding(
        name=name,
        email=email,
        face_encoding=face_encoding,
    )

    return {
        "success": True,
        "message": "User registered successfully.",
        "name": name,
        "email": email,
    }

async def login_user(
    email: str,
    image: UploadFile,
):
    image_bytes = await image.read()

    try:
        face_encoding = generate_face_encoding(image_bytes)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    user = get_face_by_email(email)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or face.",
        )

    stored_encoding = user.vector

    distance = compare_faces(
        known_encoding=stored_encoding,
        face_encoding=face_encoding,
    )

    if distance > FACE_MATCH_THRESHOLD:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or face.",
        )
    access_token = create_access_token(email)
    return {
        "success": True,
        "message": "Login successful.",
        "email": email,
        "access_token": access_token,
        "token_type": "bearer",
    }

def delete_user(email: str):
    user = get_face_by_email(email)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    delete_face_by_email(email)

    return {
        "success": True,
        "message": "User account deleted successfully.",
        "email": email,
    }