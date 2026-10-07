from uuid import uuid4
import os

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "face_embeddings")

client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT,
)


def create_collection():
    collections = client.get_collections()

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections.collections
    )

    if not exists:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=128,
                distance=Distance.COSINE,
            ),
        )


def store_face_encoding(
    name: str,
    email: str,
    face_encoding,
):
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=str(uuid4()),
                vector=face_encoding.tolist(),
                payload={
                    "name": name,
                    "email": email,
                },
            )
        ],
    )

def get_face_by_email(email: str):
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter={
            "must": [
                {
                    "key": "email",
                    "match": {
                        "value": email,
                    },
                }
            ]
        },
        limit=1,
        with_vectors=True,
    )

    if not points:
        return None

    return points[0]


def find_similar_face(face_encoding):
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=face_encoding.tolist(),
        limit=1,
        with_payload=True,
        with_vectors=True,
    )

    if not results.points:
        return None

    return results.points[0]

def delete_face_by_email(email: str):
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="email",
                    match=MatchValue(value=email),
                )
            ]
        ),
    )