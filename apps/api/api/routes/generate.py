import base64
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from db.database import get_db
from domain.models import GenerationResponse, TTSRequest
from domain.services.tts_service import tts_service

router = APIRouter(prefix="/api/v1", tags=["Generation"])


@router.post("/generate", response_model=GenerationResponse)
async def generate_audio(request: TTSRequest, db=Depends(get_db)):
    """
    Generate audio from text and store it permanently in the database and filesystem.
    """
    try:
        result = await tts_service.generate_and_save(request, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/generate/stream")
async def generate_audio_stream(request: TTSRequest, req: Request):
    """
    Real-time streaming audio generation via Server-Sent Events (SSE).
    """
    engine = tts_service.get_engine(request.engine)

    async def event_generator():
        try:
            yield {
                "event": "progress",
                "data": json.dumps({"percent": 5, "message": f"Connecting to {engine.name}..."}),
            }

            accumulated_bytes = bytearray()
            chunk_count = 0

            async for chunk in engine.generate_stream(request):
                # If client disconnected, break
                if await req.is_disconnected():
                    break

                if chunk.is_final:
                    break

                chunk_count += 1
                accumulated_bytes.extend(chunk.data)

                # Send chunk event
                yield {
                    "event": "chunk",
                    "data": json.dumps(
                        {
                            "chunkIndex": chunk.index,
                            "audioBase64": base64.b64encode(chunk.data).decode("utf-8"),
                            "sampleRate": chunk.sample_rate,
                            "mimeType": chunk.mime_type,
                        }
                    ),
                }

                # Progress estimate
                percent = min(95, 10 + chunk_count * 15)
                yield {
                    "event": "progress",
                    "data": json.dumps(
                        {"percent": percent, "message": f"Generated chunk {chunk_count}..."}
                    ),
                }

            # Completion event
            yield {
                "event": "complete",
                "data": json.dumps(
                    {
                        "totalChunks": chunk_count,
                        "fileSize": len(accumulated_bytes),
                        "mimeType": "audio/wav",
                        "message": "Generation complete",
                    }
                ),
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"errorCode": "GENERATION_ERROR", "message": str(e)}),
            }

    return EventSourceResponse(event_generator())
