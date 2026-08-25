import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from config import settings
from db.database import get_db
from domain.models import EngineType, Voice
from domain.services.audio_processor import AudioProcessor
from domain.services.tts_service import tts_service

router = APIRouter(prefix="/api/v1/clone-voice", tags=["Voice Cloning"])


@router.post("")
async def upload_or_record_voice(
    name: str = Form(...),
    audio_file: UploadFile = File(...),
    db=Depends(get_db),
):
    voice_id = f"cloned_{str(uuid.uuid4())[:8]}"
    content = await audio_file.read()
    
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Audio sample is too short. Please provide at least 3-5 seconds of speech.")

    save_path = settings.AUDIO_STORAGE_PATH / f"{voice_id}_ref.wav"
    with open(save_path, "wb") as f:
        f.write(content)

    duration_ms = AudioProcessor.calculate_duration_ms(content)

    await db.execute(
        """
        INSERT INTO cloned_voices (id, name, reference_audio_path, duration_ms)
        VALUES (?, ?, ?, ?)
        """,
        (voice_id, name, str(save_path), duration_ms),
    )
    await db.commit()

    # Register with Chatterbox engine
    new_voice = Voice(
        id=voice_id,
        name=name,
        engine=EngineType.CHATTERBOX,
        language="en",
        description=f"Cloned voice from {name} ({duration_ms // 1000}s sample)",
        tags=["Cloned Voice 🎤", "User Custom"],
        is_cloned=True,
    )
    chatterbox = tts_service.get_engine(EngineType.CHATTERBOX)
    if hasattr(chatterbox, "add_cloned_voice"):
        chatterbox.add_cloned_voice(new_voice)

    return {
        "id": voice_id,
        "name": name,
        "durationMs": duration_ms,
        "status": "ready",
        "voice": new_voice.model_dump(),
    }


@router.get("")
async def list_cloned_voices(db=Depends(get_db)):
    cursor = await db.execute("SELECT * FROM cloned_voices ORDER BY created_at DESC")
    rows = await cursor.fetchall()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "durationMs": r["duration_ms"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]
