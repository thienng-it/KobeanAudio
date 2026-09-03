from fastapi import APIRouter, HTTPException, Query

from domain.models import EngineInfo, EngineType, Voice
from domain.services.tts_service import tts_service

router = APIRouter(prefix="/api/v1", tags=["Engines & Voices"])


@router.get("/engines", response_model=list[EngineInfo])
async def list_engines():
    """List all available TTS engines with real-time hardware status."""
    return tts_service.get_all_engines_info()


@router.get("/voices", response_model=list[Voice])
async def list_voices(
    engine: EngineType | None = Query(None, description="Filter voices by engine"),
):
    """List all voices across all engines or for a specific engine."""
    return tts_service.get_all_voices(engine)


@router.get("/engines/{engine_type}/voices", response_model=list[Voice])
async def get_engine_voices(engine_type: EngineType):
    """List voices available for a specific engine."""
    try:
        return tts_service.get_all_voices(engine_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/engines/quota-status")
async def get_quota_status():
    """Return cached real-time quota health status for cloud models."""
    gemini_engine = tts_service.engines.get(EngineType.GEMINI)
    if not gemini_engine or not hasattr(gemini_engine, "get_quota_status"):
        return {"models": {}, "overall_status": "ready"}
    return {
        "models": gemini_engine.get_quota_status(),
        "overall_status": "ready",
    }


@router.post("/engines/check-health")
async def check_engine_health():
    """Proactively probe live cloud models and return updated health/quota status."""
    gemini_engine = tts_service.engines.get(EngineType.GEMINI)
    if not gemini_engine or not hasattr(gemini_engine, "check_live_health"):
        return {"models": {}, "overall_status": "ready"}

    health_status = await gemini_engine.check_live_health()
    return {
        "models": health_status,
        "overall_status": "probed",
    }
