import os
import uuid
import subprocess
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db
from domain.models import ExportRequest, TrimRequest
from domain.services.audio_processor import AudioProcessor
from config import settings

router = APIRouter(prefix="/api/v1/export", tags=["Export"])


class RevealRequest(BaseModel):
    path: str | None = None
    filename: str | None = None


class ValidateDirectoryRequest(BaseModel):
    path: str


@router.post("")
async def export_audio(payload: ExportRequest, db=Depends(get_db)):
    audio_path = None

    if payload.generation_id and payload.generation_id != "latest":
        cursor = await db.execute("SELECT * FROM generations WHERE id = ?", (payload.generation_id,))
        row = await cursor.fetchone()
        if row and row["audio_path"] and Path(row["audio_path"]).exists():
            audio_path = Path(row["audio_path"])

    if not audio_path or not audio_path.exists():
        # Try matching by filename in audio_output directory
        if payload.generation_id:
            cleaned_id = payload.generation_id.split("/")[-1]
            candidate = settings.AUDIO_STORAGE_PATH / cleaned_id
            if candidate.exists():
                audio_path = candidate
            else:
                matches = list(settings.AUDIO_STORAGE_PATH.glob(f"*{cleaned_id}*"))
                if matches:
                    audio_path = matches[0]

    # Fallback to the latest synthesized audio master on disk
    if not audio_path or not audio_path.exists():
        wav_files = [f for f in settings.AUDIO_STORAGE_PATH.glob("*.wav") if not f.name.startswith("export_")]
        if wav_files:
            wav_files.sort(key=os.path.getmtime, reverse=True)
            audio_path = wav_files[0]

    if not audio_path or not audio_path.exists():
        raise HTTPException(status_code=404, detail="No audio available for export. Please generate a voice take first.")

    import asyncio

    def _read_file(p: Path) -> bytes:
        with open(p, "rb") as f:
            return f.read()

    def _write_file(p: Path, data: bytes):
        with open(p, "wb") as f:
            f.write(data)

    original_bytes = await asyncio.to_thread(_read_file, audio_path)

    processed_bytes, mime_type = await AudioProcessor.process_audio_async(
        wav_bytes=original_bytes,
        target_format=payload.format,
        bitrate=payload.bitrate,
        sample_rate=payload.sample_rate,
        normalize_lufs=payload.normalize_lufs,
    )

    clean_filename = payload.file_name or f"kobean_master_{audio_path.stem}.{payload.format}"
    if not clean_filename.endswith(f".{payload.format}"):
        clean_filename = f"{clean_filename}.{payload.format}"

    export_path = settings.AUDIO_STORAGE_PATH / f"export_{clean_filename}"

    await asyncio.to_thread(_write_file, export_path, processed_bytes)

    saved_path = str(export_path)

    # If target directory was provided (e.g. ~/Desktop, ~/Downloads, ~/Music, or custom path)
    if payload.target_directory:
        try:
            expanded = Path(os.path.expanduser(payload.target_directory))
            expanded.mkdir(parents=True, exist_ok=True)
            custom_target_file = expanded / clean_filename
            await asyncio.to_thread(_write_file, custom_target_file, processed_bytes)
            saved_path = str(custom_target_file)
        except Exception as e:
            print(f"[WARN] Failed to write directly to custom directory {payload.target_directory}: {e}")

    return {
        "status": "ready",
        "downloadUrl": f"/audio/{export_path.name}",
        "fileName": clean_filename,
        "format": payload.format,
        "fileSize": len(processed_bytes),
        "savedPath": saved_path,
    }


@router.post("/trim")
async def trim_audio(payload: TrimRequest, db=Depends(get_db)):
    """
    Trims a synthesized WAV audio file to user-specified start/end boundaries with smooth fades.
    """
    audio_path = None

    if payload.generation_id and payload.generation_id != "latest":
        cursor = await db.execute("SELECT * FROM generations WHERE id = ?", (payload.generation_id,))
        row = await cursor.fetchone()
        if row and row["audio_path"] and Path(row["audio_path"]).exists():
            audio_path = Path(row["audio_path"])

    if not audio_path or not audio_path.exists():
        if payload.audio_url:
            filename = payload.audio_url.split("/")[-1].split("?")[0]
            candidate = settings.AUDIO_STORAGE_PATH / filename
            if candidate.exists():
                audio_path = candidate

    # Fallback to the latest synthesized audio master on disk
    if not audio_path or not audio_path.exists():
        wav_files = [f for f in settings.AUDIO_STORAGE_PATH.glob("*.wav") if not f.name.startswith("export_")]
        if wav_files:
            wav_files.sort(key=os.path.getmtime, reverse=True)
            audio_path = wav_files[0]

    if not audio_path or not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found for trimming.")

    import asyncio

    def _read_file(p: Path) -> bytes:
        with open(p, "rb") as f:
            return f.read()

    def _write_file(p: Path, data: bytes):
        with open(p, "wb") as f:
            f.write(data)

    original_bytes = await asyncio.to_thread(_read_file, audio_path)

    start_ms = int(payload.start_time_sec * 1000)
    end_ms = int(payload.end_time_sec * 1000)

    trimmed_bytes, new_duration_ms = await AudioProcessor.trim_audio_segment_async(
        wav_bytes=original_bytes,
        start_ms=start_ms,
        end_ms=end_ms,
        fade_in_ms=payload.fade_in_ms,
        fade_out_ms=payload.fade_out_ms,
    )

    new_gen_id = f"gen_trim_{uuid.uuid4().hex[:8]}"
    trimmed_filename = f"trimmed_{audio_path.stem}_{new_gen_id}.wav"
    output_path = settings.AUDIO_STORAGE_PATH / trimmed_filename

    await asyncio.to_thread(_write_file, output_path, trimmed_bytes)

    if payload.save_as_new:
        try:
            from datetime import timezone
            created_at = datetime.now(timezone.utc).isoformat()
            await db.execute(
                """
                INSERT INTO generations (id, project_id, text_input, engine, voice_id, gemini_model, settings, audio_path, audio_url, duration_ms, file_size, rating, created_at, model_used, was_cascaded, cascade_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_gen_id,
                    payload.project_id,
                    f"[Trimmed: {payload.start_time_sec:.2f}s - {payload.end_time_sec:.2f}s]",
                    "dsp-trim",
                    "trim-master",
                    None,
                    "{}",
                    str(output_path.absolute()),
                    f"/audio/{trimmed_filename}",
                    new_duration_ms,
                    len(trimmed_bytes),
                    0,
                    created_at,
                    "Apple Silicon M3 DSP Trimmer",
                    0,
                    None,
                ),
            )
            await db.commit()
        except Exception as e:
            print(f"[WARN] Failed to insert generation take: {e}")

    return {
        "status": "success",
        "audioUrl": f"/audio/{trimmed_filename}",
        "generationId": new_gen_id,
        "durationMs": new_duration_ms,
        "durationSec": new_duration_ms / 1000.0,
        "fileSize": len(trimmed_bytes),
        "fileName": trimmed_filename,
        "savedPath": str(output_path.absolute()),
    }


@router.get("/files")

async def list_audio_files(db=Depends(get_db)):
    """
    Lists all audio files in the studio audio_output directory.
    """
    files_list = []
    supported_exts = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}

    if settings.AUDIO_STORAGE_PATH.exists():
        for file_path in settings.AUDIO_STORAGE_PATH.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in supported_exts:
                stat = file_path.stat()
                is_export = file_path.name.startswith("export_")
                display_name = file_path.name.replace("export_", "") if is_export else file_path.name

                files_list.append({
                    "id": file_path.name,
                    "name": display_name,
                    "filename": file_path.name,
                    "path": str(file_path.absolute()),
                    "size_bytes": stat.st_size,
                    "format": file_path.suffix.lower().replace(".", ""),
                    "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "is_export": is_export,
                    "audio_url": f"/audio/{file_path.name}",
                })

    # Sort newest first
    files_list.sort(key=lambda x: x["created_at"], reverse=True)
    return files_list


@router.delete("/files/{filename}")
async def delete_audio_file(filename: str):
    """
    Deletes an audio file from the storage directory.
    """
    safe_name = Path(filename).name
    target = settings.AUDIO_STORAGE_PATH / safe_name
    if target.exists():
        target.unlink()
        return {"status": "deleted", "filename": safe_name}
    raise HTTPException(status_code=404, detail="File not found")


@router.post("/reveal")
async def reveal_in_finder(payload: RevealRequest):
    """
    Reveals file or folder in macOS Finder.
    """
    target_path = None
    if payload.path:
        target_path = Path(os.path.expanduser(payload.path))
    elif payload.filename:
        target_path = settings.AUDIO_STORAGE_PATH / Path(payload.filename).name

    if not target_path or not target_path.exists():
        raise HTTPException(status_code=404, detail="Target path does not exist on disk")

    try:
        if target_path.is_file():
            subprocess.run(["open", "-R", str(target_path.absolute())], check=True)
        else:
            subprocess.run(["open", str(target_path.absolute())], check=True)
        return {"status": "revealed", "path": str(target_path.absolute())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open in Finder: {e}")


@router.post("/pick-folder")
async def pick_folder():
    """
    Opens native macOS folder picker dialog safely without crashing on cancel.
    """
    script = (
        'try\n'
        '  tell application "System Events" to activate\n'
        '  set theFolder to POSIX path of (choose folder with prompt "Select KobeanAudio Export Destination:")\n'
        '  return theFolder\n'
        'on error number -128\n'
        '  return "CANCELED"\n'
        'on error errStr\n'
        '  return "CANCELED"\n'
        'end try'
    )
    try:
        res = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = res.stdout.strip()
        if output and output != "CANCELED":
            return {"status": "selected", "path": output.rstrip("/")}
        return {"status": "canceled", "path": None}
    except Exception as e:
        print(f"[INFO] Folder picker canceled or completed: {e}")
        return {"status": "canceled", "path": None}


@router.post("/validate-directory")
async def validate_directory(payload: ValidateDirectoryRequest):
    """
    Validates if a target directory exists or can be created on macOS.
    """
    try:
        expanded = Path(os.path.expanduser(payload.path.strip()))
        can_write = False
        if expanded.exists() and expanded.is_dir():
            can_write = os.access(expanded, os.W_OK)
        else:
            # Check parent directory
            can_write = os.access(expanded.parent, os.W_OK) if expanded.parent.exists() else False

        return {
            "valid": True,
            "resolved_path": str(expanded.absolute()),
            "exists": expanded.exists(),
            "can_write": can_write,
        }
    except Exception as e:
        return {"valid": False, "error": str(e), "resolved_path": None}
