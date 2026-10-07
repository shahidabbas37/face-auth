import io

import face_recognition


def generate_face_encoding(image_bytes: bytes):
    try:
        image = face_recognition.load_image_file(
            io.BytesIO(image_bytes)
        )
    except Exception:
        raise ValueError("Invalid or unsupported image.")

    face_encodings = face_recognition.face_encodings(image)

    if len(face_encodings) == 0:
        raise ValueError("No face detected in the image.")

    if len(face_encodings) > 1:
        raise ValueError(
            "Multiple faces detected. Please use an image with one face."
        )

    return face_encodings[0]


def compare_faces(known_encoding, face_encoding):
    distance = face_recognition.face_distance(
        [known_encoding],
        face_encoding,
    )[0]

    return distance