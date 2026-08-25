import aiosqlite
from config import settings


async def get_db():
    db = await aiosqlite.connect(settings.DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    async with aiosqlite.connect(settings.DATABASE_PATH) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            text_content TEXT DEFAULT '',
            engine TEXT DEFAULT 'kokoro',
            voice_id TEXT DEFAULT 'af_heart',
            gemini_model TEXT DEFAULT 'gemini-3.1-flash-tts-preview',
            settings TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS generations (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            text_input TEXT NOT NULL,
            engine TEXT NOT NULL,
            voice_id TEXT NOT NULL,
            gemini_model TEXT,
            settings TEXT DEFAULT '{}',
            audio_url TEXT NOT NULL,
            audio_path TEXT NOT NULL,
            duration_ms INTEGER DEFAULT 0,
            file_size INTEGER DEFAULT 0,
            rating INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS cloned_voices (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            reference_audio_path TEXT NOT NULL,
            duration_ms INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        await db.commit()
