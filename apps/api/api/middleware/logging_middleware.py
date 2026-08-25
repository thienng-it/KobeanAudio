import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("kobeanaudio.api")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that attaches a unique X-Request-ID and tracks request execution latency.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()
        
        # Suppress verbose logging on static audio chunks to keep logs clean
        is_audio_static = request.url.path.startswith("/audio/")
        
        if not is_audio_static:
            logger.info(f"--> [{request_id[:8]}] {request.method} {request.url.path}")

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            process_time_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(f"<-- [{request_id[:8]}] 500 FAIL in {process_time_ms}ms: {exc}")
            raise exc

        process_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(process_time_ms)

        if not is_audio_static:
            logger.info(
                f"<-- [{request_id[:8]}] {response.status_code} {request.method} {request.url.path} ({process_time_ms}ms)"
            )

        return response
