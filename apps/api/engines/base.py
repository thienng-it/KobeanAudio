from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass

from domain.models import EngineType, TTSRequest, Voice


@dataclass
class RawAudioChunk:
    data: bytes
    index: int
    is_final: bool = False
    sample_rate: int = 24000
    mime_type: str = "audio/wav"


class TTSEngine(ABC):
    engine_type: EngineType
    name: str
    description: str

    @abstractmethod
    async def initialize(self) -> None:
        """Load or verify engine models/dependencies."""

    @abstractmethod
    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[RawAudioChunk]:
        """Stream raw audio chunks."""

    @abstractmethod
    async def generate(self, request: TTSRequest) -> tuple[bytes, int, str]:
        """
        Generate complete audio.
        Returns (audio_bytes, sample_rate, mime_type).
        """

    @abstractmethod
    def get_voices(self) -> list[Voice]:
        """Return list of available voices."""

    @abstractmethod
    def is_available(self) -> tuple[bool, str]:
        """Check if engine is ready to use. Returns (is_ready, status_message)."""

    async def shutdown(self) -> None:
        """Clean up resources if needed."""
        return None
