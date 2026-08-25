from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.routes import clone, engines, export, generate, projects
from config import settings
from db.database import init_db
from domain.services.tts_service import tts_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await tts_service.initialize()
    print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} initialized on {settings.API_HOST}:{settings.API_PORT}")
    yield
    # Shutdown
    print(f"🛑 {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Studio-grade multi-engine text-to-speech API for KobeanAudio",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio storage directory for playback & exports
app.mount("/audio", StaticFiles(directory=str(settings.AUDIO_STORAGE_PATH)), name="audio")

# Include Routers
app.include_router(engines.router)
app.include_router(generate.router)
app.include_router(projects.router)
app.include_router(export.router)
app.include_router(clone.router)


@app.get("/api/v1/health")
async def health_check():
    engines_info = tts_service.get_all_engines_info()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "enginesCount": len(engines_info),
        "engines": [e.model_dump() for e in engines_info],
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
