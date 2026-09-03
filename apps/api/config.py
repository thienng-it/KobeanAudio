from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_ENV = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "KobeanAudio API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Network
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:1420",
        "tauri://localhost",
        "http://tauri.localhost",
    ]

    # Google AI Studio / Gemini
    GEMINI_API_KEY: str | None = None

    # Storage Paths
    BASE_DIR: Path = ROOT_DIR
    AUDIO_STORAGE_PATH: Path = ROOT_DIR / "audio_output"
    TEMP_AUDIO_PATH: Path = ROOT_DIR / "temp_audio"
    MODELS_PATH: Path = ROOT_DIR / "models"
    DATABASE_PATH: Path = ROOT_DIR / "kobeanaudio.db"

    # Local Engines Config
    ORPHEUS_SERVER_URL: str = "http://127.0.0.1:8081"
    ORPHEUS_MODEL_PATH: str = "./models/orpheus/orpheus-3b-0.1-ft.Q4_K_M.gguf"
    KOKORO_MODEL_PATH: str = "./models/kokoro"
    CHATTERBOX_DEVICE: str = "mps"
    QWEN3_MODEL_PATH: str = "./models/qwen3"

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV) if ROOT_ENV.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure directories exist
settings.AUDIO_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
settings.TEMP_AUDIO_PATH.mkdir(parents=True, exist_ok=True)
settings.MODELS_PATH.mkdir(parents=True, exist_ok=True)
