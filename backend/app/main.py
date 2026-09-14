from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Automatically create database tables on startup if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IR-AIS API")

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

from app.routers.auth_router import router as auth_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

from app.routers.blocks_router import router as blocks_router

app.include_router(blocks_router, prefix="/api", tags=["blocks"])

from app.routers.trains_router import router as trains_router

app.include_router(trains_router, prefix="/api", tags=["trains"])

from app.routers.conflicts_router import router as conflicts_router

app.include_router(conflicts_router, prefix="/api", tags=["conflicts"])

from app.routers.simulator_router import router as simulator_router

app.include_router(simulator_router, prefix="/api", tags=["simulator"])