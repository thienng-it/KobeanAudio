import platform
import shutil
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.middleware.error_handler import register_error_handlers
from api.middleware.logging_middleware import RequestTracingMiddleware
from api.routes import clone, engines, export, generate, parse, projects
from config import settings
from db.database import get_db, init_db
from domain.services.tts_service import tts_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await tts_service.initialize()
    print(
        f"✅ {settings.APP_NAME} v{settings.APP_VERSION} initialized on {settings.API_HOST}:{settings.API_PORT}"
    )
    yield
    # Shutdown
    print(f"🛑 {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Studio-grade multi-engine text-to-speech API for KobeanAudio",
    lifespan=lifespan,
)

# 1. Custom Tracing & Request Logging Middleware
app.add_middleware(RequestTracingMiddleware)

# 2. Standardized Error Handlers
register_error_handlers(app)

# 3. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Mount audio storage directory for playback & exports
app.mount("/audio", StaticFiles(directory=str(settings.AUDIO_STORAGE_PATH)), name="audio")

# 5. Include Routers
app.include_router(engines.router)
app.include_router(generate.router)
app.include_router(projects.router)
app.include_router(export.router)
app.include_router(clone.router)
app.include_router(parse.router)


@app.get("/api/v1/health")
async def health_check():
    """
    Comprehensive system health and readiness telemetry.
    """
    # 1. Database check
    db_healthy = False
    try:
        async for db in get_db():
            cursor = await db.execute("SELECT 1")
            row = await cursor.fetchone()
            if row and row[0] == 1:
                db_healthy = True
            break
    except Exception:
        db_healthy = False

    # 2. Storage disk space metrics
    try:
        usage = shutil.disk_usage(settings.AUDIO_STORAGE_PATH)
        disk_free_gb = round(usage.free / (1024**3), 2)
        disk_total_gb = round(usage.total / (1024**3), 2)
    except Exception:
        disk_free_gb = None
        disk_total_gb = None

    # 3. TTS engines discovery
    engines_info = tts_service.get_all_engines_info()

    return {
        "status": "healthy" if db_healthy else "degraded",
        "version": settings.APP_VERSION,
        "environment": {
            "os": platform.system(),
            "architecture": platform.machine(),
            "python_version": platform.python_version(),
            "apple_silicon": platform.system() == "Darwin" and platform.machine() == "arm64",
        },
        "database": {
            "status": "connected" if db_healthy else "disconnected",
            "type": "SQLite (aiosqlite)",
            "path": str(settings.DATABASE_PATH),
        },
        "storage": {
            "audio_output_path": str(settings.AUDIO_STORAGE_PATH),
            "disk_free_gb": disk_free_gb,
            "disk_total_gb": disk_total_gb,
        },
        "enginesCount": len(engines_info),
        "engines": [e.model_dump() for e in engines_info],
    }


@app.get("/api/v1/health/liveness")
async def liveness_probe():
    """
    Ultra-fast liveness probe for desktop app heartbeats.
    """
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
