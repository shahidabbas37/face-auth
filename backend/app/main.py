from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routes.auth import router as auth_router
from app.services.vector_db import create_collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_collection()
    yield


app = FastAPI(
    title="Face Auth API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}