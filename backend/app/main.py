from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}