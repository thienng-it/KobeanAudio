import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("kobeanaudio.errors")


class KobeanAudioException(Exception):
    """Base exception for all KobeanAudio domain errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class AudioProcessingError(KobeanAudioException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            error_code="AUDIO_PROCESSING_ERROR",
            status_code=422,
            details=details,
        )


class EngineUnavailableError(KobeanAudioException):
    def __init__(self, engine_name: str, message: str | None = None):
        super().__init__(
            message=message or f"TTS Engine '{engine_name}' is currently unavailable or offline.",
            error_code="ENGINE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"engine": engine_name},
        )


class QuotaExhaustedError(KobeanAudioException):
    def __init__(self, model_name: str, retry_after: int | None = None):
        super().__init__(
            message=f"Rate limit or quota exhausted for {model_name}. Please wait or select a local engine.",
            error_code="QUOTA_EXHAUSTED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"model": model_name, "retry_after": retry_after},
        )


class ResourceNotFoundError(KobeanAudioException):
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            message=f"{resource_type} with ID '{resource_id}' was not found.",
            error_code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource_type": resource_type, "resource_id": resource_id},
        )


def register_error_handlers(app: FastAPI):
    """Registers standardized JSON error handlers on the FastAPI application."""

    @app.exception_handler(KobeanAudioException)
    async def kobean_exception_handler(request: Request, exc: KobeanAudioException):
        req_id = getattr(request.state, "request_id", "unknown")
        logger.warning(f"[{req_id[:8]}] KobeanAudioException ({exc.error_code}): {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "request_id": req_id,
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = getattr(request.state, "request_id", "unknown")
        logger.warning(f"[{req_id[:8]}] HTTPException {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error_code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": {},
                "request_id": req_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", "unknown")
        logger.warning(f"[{req_id[:8]}] RequestValidationError: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid request parameters provided.",
                "details": {"validation_errors": exc.errors()},
                "request_id": req_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", "unknown")
        logger.error(f"[{req_id[:8]}] Unhandled Exception: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
                "details": {"type": type(exc).__name__, "error": str(exc)},
                "request_id": req_id,
            },
        )
