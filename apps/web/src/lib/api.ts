import {
  AudioExportOptions,
  AudioFileItem,
  EngineInfo,
  GenerationRecord,
  ModelQuotaInfo,
  ParseFileResponse,
  Project,
  ProjectCreate,
  ProjectUpdate,
  TTSRequest,
  Voice,
} from "@kobeanaudio/types";

const API_BASE = "http://127.0.0.1:8000/api/v1";

export async function fetchEngines(): Promise<EngineInfo[]> {
  const res = await fetch(`${API_BASE}/engines`);
  if (!res.ok) throw new Error("Failed to fetch engines");
  return res.json();
}

export async function fetchVoices(engine?: string): Promise<Voice[]> {
  const url = engine ? `${API_BASE}/voices?engine=${engine}` : `${API_BASE}/voices`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch voices");
  return res.json();
}

export async function generateAudio(payload: TTSRequest): Promise<GenerationRecord> {
  const snakePayload = {
    text: payload.text,
    engine: payload.engine,
    voice_id: payload.voiceId || payload.voice_id,
    gemini_model: payload.geminiModel || payload.gemini_model,
    temperature: payload.temperature,
    speed: payload.speed,
    pitch: payload.pitch,
    emotion_exaggeration: payload.emotionExaggeration || payload.emotion_exaggeration,
    output_format: payload.outputFormat || payload.output_format,
    sample_rate: payload.sampleRate || payload.sample_rate,
    normalize_lufs: payload.normalizeLufs !== undefined ? payload.normalizeLufs : payload.normalize_lufs,
    trim_silence: payload.trimSilence !== undefined ? payload.trimSilence : payload.trim_silence,
    fade_in_ms: payload.fadeInMs || payload.fade_in_ms,
    fade_out_ms: payload.fadeOutMs || payload.fade_out_ms,
    project_id: payload.projectId || payload.project_id,
  };

  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snakePayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Speech generation failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createProject(data: ProjectCreate): Promise<Project> {
  const payload = {
    name: data.name,
    description: data.description,
    text_content: data.textContent || data.text_content,
    engine: data.engine || "kokoro",
    voice_id: data.voiceId || data.voice_id || "af_heart",
    gemini_model: data.geminiModel || data.gemini_model,
  };

  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  const payload = {
    name: data.name,
    description: data.description,
    text_content: data.textContent !== undefined ? data.textContent : data.text_content,
    engine: data.engine,
    voice_id: data.voiceId || data.voice_id,
    gemini_model: data.geminiModel || data.gemini_model,
    settings: data.settings,
  };

  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function fetchProjectGenerations(projectId: string): Promise<GenerationRecord[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/generations`);
  if (!res.ok) throw new Error("Failed to fetch generations");
  return res.json();
}

export async function exportAudio(options: {
  generationId: string;
  format: string;
  bitrate?: number;
  sampleRate?: number;
  normalizeLufs?: number;
  fileName?: string;
  targetDirectory?: string;
}): Promise<{ status: string; downloadUrl: string; fileName: string; fileSize: number; savedPath?: string }> {
  const payload = {
    generation_id: options.generationId,
    generationId: options.generationId,
    format: options.format,
    bitrate: options.bitrate,
    sample_rate: options.sampleRate,
    normalize_lufs: options.normalizeLufs,
    file_name: options.fileName,
    target_directory: options.targetDirectory,
    targetDirectory: options.targetDirectory,
  };

  const res = await fetch(`${API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Export failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAudioFiles(): Promise<AudioFileItem[]> {
  const res = await fetch(`${API_BASE}/export/files`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteAudioFile(filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/export/files/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete audio file");
}

export async function revealInFinder(pathOrFilename: { path?: string; filename?: string }): Promise<{ status: string; path: string }> {
  const res = await fetch(`${API_BASE}/export/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pathOrFilename),
  });
  if (!res.ok) throw new Error("Failed to reveal file in Finder");
  return res.json();
}

export async function pickNativeFolder(): Promise<{ status: "selected" | "canceled"; path: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/export/pick-folder`, { method: "POST" });
    if (!res.ok) return { status: "canceled", path: null };
    return res.json();
  } catch {
    return { status: "canceled", path: null };
  }
}

export async function validateTargetDirectory(path: string): Promise<{
  valid: boolean;
  resolved_path: string | null;
  exists?: boolean;
  can_write?: boolean;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/export/validate-directory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) return { valid: false, resolved_path: null, error: "Validation failed" };
  return res.json();
}

export async function uploadClonedVoice(formData: FormData): Promise<{ id: string; name: string; voice: Voice }> {
  const res = await fetch(`${API_BASE}/clone-voice`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to clone voice");
  }
  return res.json();
}

export async function fetchQuotaStatus(): Promise<{ models: Record<string, any>; overall_status: string }> {
  try {
    const res = await fetch(`${API_BASE}/engines/quota-status`);
    if (!res.ok) return { models: {}, overall_status: "ready" };
    return res.json();
  } catch {
    return { models: {}, overall_status: "ready" };
  }
}

export async function checkEngineHealth(): Promise<{ models: Record<string, any>; overall_status: string }> {
  try {
    const res = await fetch(`${API_BASE}/engines/check-health`, { method: "POST" });
    if (!res.ok) return { models: {}, overall_status: "ready" };
    return res.json();
  } catch {
    return { models: {}, overall_status: "ready" };
  }
}

export async function parseDocumentFile(
  file: File,
  options?: { detectSpeakers?: boolean; cleanWhitespace?: boolean }
): Promise<ParseFileResponse> {
  const detectSpeakers = options?.detectSpeakers ?? true;
  const cleanWhitespace = options?.cleanWhitespace ?? true;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("detect_speakers", String(detectSpeakers));
  formData.append("clean_whitespace", String(cleanWhitespace));

  const res = await fetch(`${API_BASE}/parse-file`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to parse file (${file.name}) with status ${res.status}`);
  }

  return res.json();
}

