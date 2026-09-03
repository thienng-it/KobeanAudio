from enum import Enum
from pydantic import BaseModel, Field, AliasChoices, ConfigDict
from typing import Any, Literal


class EngineType(str, Enum):
    KOKORO = "kokoro"
    ORPHEUS = "orpheus"
    CHATTERBOX = "chatterbox"
    GEMINI = "gemini"
    QWEN3 = "qwen3"
    PIPER = "piper"


class GeminiModelVariant(str, Enum):
    FLASH_3_1 = "gemini-3.1-flash-tts-preview"
    FLASH_2_5 = "gemini-2.5-flash-preview-tts"
    PRO_2_5 = "gemini-2.5-pro-preview-tts"
    NATIVE_2_5 = "gemini-2.5-flash-native-audio-latest"


class Voice(BaseModel):
    id: str
    name: str
    engine: EngineType
    language: str = "en"
    gender: Literal["male", "female", "neutral"] | None = None
    description: str = ""
    preview_url: str | None = None
    tags: list[str] = Field(default_factory=list)
    is_cloned: bool = False


class EngineInfo(BaseModel):
    id: EngineType
    name: str
    description: str
    status: Literal["ready", "loading", "offline", "needs_config"]
    speed_factor: str
    ram_usage: str
    is_cloud: bool
    requires_gpu: bool
    requires_api_key: bool
    badge: str | None = None
    voices_count: int = 0


class TTSRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(..., min_length=1)
    engine: EngineType = EngineType.KOKORO
    voice_id: str = Field("af_heart", validation_alias=AliasChoices("voice_id", "voiceId"))
    gemini_model: GeminiModelVariant = Field(GeminiModelVariant.FLASH_2_5, validation_alias=AliasChoices("gemini_model", "geminiModel"))
    temperature: float = Field(1.0, ge=0.0, le=2.0)
    speed: float = Field(1.0, ge=0.25, le=4.0)
    pitch: float = Field(1.0, ge=0.5, le=2.0)
    emotion_exaggeration: float = Field(0.5, ge=0.0, le=1.0, validation_alias=AliasChoices("emotion_exaggeration", "emotionExaggeration"))
    reference_audio_path: str | None = Field(None, validation_alias=AliasChoices("reference_audio_path", "referenceAudioPath"))
    output_format: Literal["wav", "mp3", "flac", "ogg", "m4a"] = Field("wav", validation_alias=AliasChoices("output_format", "outputFormat"))
    sample_rate: int = Field(24000, validation_alias=AliasChoices("sample_rate", "sampleRate"))
    normalize_lufs: float | None = Field(-16.0, validation_alias=AliasChoices("normalize_lufs", "normalizeLufs"))
    trim_silence: bool = Field(True, validation_alias=AliasChoices("trim_silence", "trimSilence"))
    fade_in_ms: int = Field(0, validation_alias=AliasChoices("fade_in_ms", "fadeInMs"))
    fade_out_ms: int = Field(0, validation_alias=AliasChoices("fade_out_ms", "fadeOutMs"))
    project_id: str | None = Field(None, validation_alias=AliasChoices("project_id", "projectId"))


class AudioChunk(BaseModel):
    data_base64: str
    index: int
    is_final: bool = False
    sample_rate: int = 24000
    mime_type: str = "audio/wav"


class ProjectCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1)
    description: str = ""
    text_content: str = Field("", validation_alias=AliasChoices("text_content", "textContent"))
    engine: EngineType = EngineType.KOKORO
    voice_id: str = Field("af_heart", validation_alias=AliasChoices("voice_id", "voiceId"))
    gemini_model: GeminiModelVariant = Field(GeminiModelVariant.FLASH_2_5, validation_alias=AliasChoices("gemini_model", "geminiModel"))
    settings: dict[str, Any] = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = None
    description: str | None = None
    text_content: str | None = Field(None, validation_alias=AliasChoices("text_content", "textContent"))
    engine: EngineType | None = None
    voice_id: str | None = Field(None, validation_alias=AliasChoices("voice_id", "voiceId"))
    gemini_model: GeminiModelVariant | None = Field(None, validation_alias=AliasChoices("gemini_model", "geminiModel"))
    settings: dict[str, Any] | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    text_content: str
    engine: EngineType
    voice_id: str
    gemini_model: str
    settings: dict[str, Any]
    created_at: str
    updated_at: str
    generations_count: int = 0


class GenerationResponse(BaseModel):
    id: str
    project_id: str | None
    text_input: str
    engine: EngineType
    voice_id: str
    gemini_model: str | None
    settings: dict[str, Any]
    audio_url: str
    duration_ms: int
    file_size: int
    rating: int
    created_at: str
    model_used: str | None = None
    was_cascaded: bool = False
    cascade_reason: str | None = None


class ModelQuotaInfo(BaseModel):
    model_id: str
    name: str
    status: Literal["ready", "limited", "exhausted", "error"]
    badge: str
    message: str
    last_checked: str
    retry_after: int | None = None


class QuotaStatusResponse(BaseModel):
    models: dict[str, ModelQuotaInfo]
    overall_status: str


class ExportRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    generation_id: str = Field("latest", validation_alias=AliasChoices("generation_id", "generationId"))
    format: Literal["wav", "mp3", "flac", "ogg", "m4a"] = "mp3"
    bitrate: int = 320
    sample_rate: int | None = Field(None, validation_alias=AliasChoices("sample_rate", "sampleRate"))
    normalize_lufs: float | None = Field(-16.0, validation_alias=AliasChoices("normalize_lufs", "normalizeLufs"))
    file_name: str | None = Field(None, validation_alias=AliasChoices("file_name", "fileName"))
    target_directory: str | None = Field(None, validation_alias=AliasChoices("target_directory", "targetDirectory"))


class TrimRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    audio_url: str | None = Field(None, validation_alias=AliasChoices("audio_url", "audioUrl"))
    generation_id: str | None = Field(None, validation_alias=AliasChoices("generation_id", "generationId"))
    start_time_sec: float = Field(0.0, ge=0.0, validation_alias=AliasChoices("start_time_sec", "startTimeSec"))
    end_time_sec: float = Field(..., ge=0.0, validation_alias=AliasChoices("end_time_sec", "endTimeSec"))
    fade_in_ms: int = Field(50, ge=0, le=2000, validation_alias=AliasChoices("fade_in_ms", "fadeInMs"))
    fade_out_ms: int = Field(50, ge=0, le=2000, validation_alias=AliasChoices("fade_out_ms", "fadeOutMs"))
    save_as_new: bool = Field(True, validation_alias=AliasChoices("save_as_new", "saveAsNew"))
    project_id: str | None = Field(None, validation_alias=AliasChoices("project_id", "projectId"))


class ParsedBlock(BaseModel):
    speaker: str = "Narrator"
    text: str


class ParseFileResponse(BaseModel):
    filename: str
    file_type: str
    raw_text: str
    blocks: list[ParsedBlock]
    word_count: int
    char_count: int
    estimated_duration_sec: float


