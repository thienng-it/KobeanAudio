import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from domain.models import ParseFileResponse
from domain.services.document_parser import parse_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Document Parsing"])


@router.post(
    "/parse-file",
    response_model=ParseFileResponse,
    summary="Upload and parse document text for TTS",
    description="Accepts .txt, .md, .pdf, .docx, .srt, and .vtt files, extracting clean text and structured dialogue blocks.",
)
async def parse_file(
    file: UploadFile = File(...),
    detect_speakers: bool = Form(True),
    clean_whitespace: bool = Form(True),
) -> ParseFileResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing.",
        )

    filename = file.filename
    try:
        content_bytes = await file.read()
        if not content_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        response = parse_document(
            filename=filename,
            content_bytes=content_bytes,
            detect_speakers=detect_speakers,
            clean_whitespace=clean_whitespace,
        )
        return response

    except ValueError as e:
        logger.warning("File parsing validation error for %s: %s", filename, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.exception("Failed to parse file %s: %s", filename, str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not parse document: {e!s}",
        ) from e
