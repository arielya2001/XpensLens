from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.routes.auth import router as auth_router
from app.routes.expenses import router as expenses_router


def _configure_frontend(app: FastAPI) -> None:
    frontend_dist = Path(__file__).resolve().parents[2] / "dist"
    frontend_index = frontend_dist / "index.html"

    if not frontend_index.exists():
        return

    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    def serve_index() -> FileResponse:
        return FileResponse(frontend_index)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str) -> FileResponse:  # noqa: ARG001
        return FileResponse(frontend_index)


def create_application() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        # Temporary bootstrap to create tables before Alembic is wired.
        Base.metadata.create_all(bind=engine)

    app.include_router(expenses_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    _configure_frontend(app)
    return app


app = create_application()
