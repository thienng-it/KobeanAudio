import json
import uuid

from fastapi import APIRouter, Depends, HTTPException

from db.database import get_db
from domain.models import (
    GenerationResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, db=Depends(get_db)):
    proj_id = str(uuid.uuid4())
    settings_str = json.dumps(payload.settings)
    gemini_model_str = (
        payload.gemini_model.value if payload.gemini_model else "gemini-3.1-flash-tts-preview"
    )

    await db.execute(
        """
        INSERT INTO projects (id, name, description, text_content, engine, voice_id, gemini_model, settings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            proj_id,
            payload.name,
            payload.description,
            payload.text_content,
            payload.engine.value,
            payload.voice_id,
            gemini_model_str,
            settings_str,
        ),
    )
    await db.commit()

    cursor = await db.execute(
        "SELECT created_at, updated_at FROM projects WHERE id = ?", (proj_id,)
    )
    row = await cursor.fetchone()

    return ProjectResponse(
        id=proj_id,
        name=payload.name,
        description=payload.description,
        text_content=payload.text_content,
        engine=payload.engine,
        voice_id=payload.voice_id,
        gemini_model=gemini_model_str,
        settings=payload.settings,
        created_at=row[0] if row else "",
        updated_at=row[1] if row else "",
        generations_count=0,
    )


@router.get("", response_model=list[ProjectResponse])
async def list_projects(db=Depends(get_db)):
    cursor = await db.execute("""
        SELECT p.*, COUNT(g.id) as generations_count
        FROM projects p
        LEFT JOIN generations g ON p.id = g.project_id
        GROUP BY p.id
        ORDER BY p.updated_at DESC
    """)
    rows = await cursor.fetchall()
    results = []
    for r in rows:
        results.append(
            ProjectResponse(
                id=r["id"],
                name=r["name"],
                description=r["description"] or "",
                text_content=r["text_content"] or "",
                engine=r["engine"],
                voice_id=r["voice_id"],
                gemini_model=r["gemini_model"] or "gemini-3.1-flash-tts-preview",
                settings=json.loads(r["settings"] or "{}"),
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                generations_count=r["generations_count"],
            )
        )
    return results


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db=Depends(get_db)):
    cursor = await db.execute(
        """
        SELECT p.*, COUNT(g.id) as generations_count
        FROM projects p
        LEFT JOIN generations g ON p.id = g.project_id
        WHERE p.id = ?
        GROUP BY p.id
    """,
        (project_id,),
    )
    r = await cursor.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Project not found")

    return ProjectResponse(
        id=r["id"],
        name=r["name"],
        description=r["description"] or "",
        text_content=r["text_content"] or "",
        engine=r["engine"],
        voice_id=r["voice_id"],
        gemini_model=r["gemini_model"] or "gemini-3.1-flash-tts-preview",
        settings=json.loads(r["settings"] or "{}"),
        created_at=r["created_at"],
        updated_at=r["updated_at"],
        generations_count=r["generations_count"],
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectUpdate, db=Depends(get_db)):
    cursor = await db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    existing = await cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    name = payload.name if payload.name is not None else existing["name"]
    desc = payload.description if payload.description is not None else existing["description"]
    text = payload.text_content if payload.text_content is not None else existing["text_content"]
    engine = payload.engine.value if payload.engine is not None else existing["engine"]
    voice = payload.voice_id if payload.voice_id is not None else existing["voice_id"]
    gemini_model = (
        payload.gemini_model.value if payload.gemini_model is not None else existing["gemini_model"]
    )
    settings_str = (
        json.dumps(payload.settings) if payload.settings is not None else existing["settings"]
    )

    await db.execute(
        """
        UPDATE projects
        SET name = ?, description = ?, text_content = ?, engine = ?, voice_id = ?, gemini_model = ?, settings = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """,
        (name, desc, text, engine, voice, gemini_model, settings_str, project_id),
    )
    await db.commit()

    return await get_project(project_id, db)


@router.delete("/{project_id}")
async def delete_project(project_id: str, db=Depends(get_db)):
    await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    await db.commit()
    return {"status": "deleted", "id": project_id}


@router.get("/{project_id}/generations", response_model=list[GenerationResponse])
async def list_project_generations(project_id: str, db=Depends(get_db)):
    cursor = await db.execute(
        """
        SELECT * FROM generations WHERE project_id = ? ORDER BY created_at DESC
    """,
        (project_id,),
    )
    rows = await cursor.fetchall()
    return [
        GenerationResponse(
            id=r["id"],
            project_id=r["project_id"],
            text_input=r["text_input"],
            engine=r["engine"],
            voice_id=r["voice_id"],
            gemini_model=r["gemini_model"],
            settings=json.loads(r["settings"] or "{}"),
            audio_url=r["audio_url"],
            duration_ms=r["duration_ms"],
            file_size=r["file_size"],
            rating=r["rating"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
