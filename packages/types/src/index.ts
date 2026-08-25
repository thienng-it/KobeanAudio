export type EngineType = 'kokoro' | 'orpheus' | 'chatterbox' | 'gemini' | 'qwen3' | 'piper';

export type GeminiModelVariant =
  | 'gemini-3.1-flash-tts-preview'
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-2.5-pro-preview-tts'
  | 'gemini-2.5-flash-native-audio-latest';

export interface Voice {
  id: string;
  name: string;
  engine: EngineType;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  description?: string;
  previewUrl?: string;
  tags?: string[];
  isCloned?: boolean;
}

export interface EngineInfo {
  id: EngineType;
  name: string;
  description: string;
  status: 'ready' | 'loading' | 'offline' | 'needs_config';
  speed_factor: string;
  ram_usage: string;
  is_cloud: boolean;
  requires_gpu: boolean;
  requires_api_key: boolean;
  badge?: string;
  voices_count: number;
}

export interface TTSRequest {
  text: string;
  engine?: EngineType;
  voiceId?: string;
  voice_id?: string;
  geminiModel?: GeminiModelVariant;
  gemini_model?: GeminiModelVariant;
  temperature?: number;
  speed?: number;
  pitch?: number;
  emotionExaggeration?: number;
  emotion_exaggeration?: number;
  referenceAudioPath?: string;
  reference_audio_path?: string;
  outputFormat?: 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a';
  output_format?: 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a';
  sampleRate?: number;
  sample_rate?: number;
  normalizeLufs?: number | null;
  normalize_lufs?: number | null;
  trimSilence?: boolean;
  trim_silence?: boolean;
  fadeInMs?: number;
  fade_in_ms?: number;
  fadeOutMs?: number;
  fade_out_ms?: number;
  projectId?: string;
  project_id?: string;
}

export type TTSRequestPayload = TTSRequest;

export interface GenerationProgressEvent {
  percent: number;
  message: string;
}

export interface AudioChunk {
  dataBase64: string;
  index: number;
  isFinal: boolean;
  sampleRate: number;
  mimeType: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  textContent?: string;
  text_content?: string;
  engine: EngineType;
  voiceId?: string;
  voice_id?: string;
  geminiModel?: GeminiModelVariant;
  gemini_model?: string;
  settings?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  generationsCount?: number;
  generations_count?: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  textContent?: string;
  text_content?: string;
  engine?: EngineType;
  voiceId?: string;
  voice_id?: string;
  geminiModel?: GeminiModelVariant;
  gemini_model?: GeminiModelVariant;
  settings?: Record<string, any>;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  textContent?: string;
  text_content?: string;
  engine?: EngineType;
  voiceId?: string;
  voice_id?: string;
  geminiModel?: GeminiModelVariant;
  gemini_model?: GeminiModelVariant;
  settings?: Record<string, any>;
}

export interface GenerationRecord {
  id: string;
  projectId?: string | null;
  project_id?: string | null;
  textInput?: string;
  text_input?: string;
  engine: EngineType;
  voiceId?: string;
  voice_id?: string;
  geminiModel?: string | null;
  gemini_model?: string | null;
  settings?: Record<string, any>;
  audioUrl?: string;
  audio_url?: string;
  audioPath?: string;
  audio_path?: string;
  durationMs?: number;
  duration_ms?: number;
  fileSize?: number;
  file_size?: number;
  rating?: number;
  createdAt?: string;
  created_at?: string;
  model_used?: string | null;
  was_cascaded?: boolean;
  cascade_reason?: string | null;
}

export interface ModelQuotaInfo {
  model_id: string;
  name: string;
  status: 'ready' | 'limited' | 'exhausted' | 'error';
  badge: string;
  message: string;
  last_checked: string;
  retry_after?: number | null;
}

export interface ClonedVoiceRecord {
  id: string;
  name: string;
  referenceAudioPath: string;
  durationMs: number;
  createdAt: string;
}

export interface AudioExportOptions {
  generationId: string;
  format: 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a';
  bitrate?: 128 | 192 | 256 | 320;
  sampleRate?: number;
  normalizeLufs?: number | null;
  fileName?: string;
  targetDirectory?: string;
}

export interface AudioFileItem {
  id: string;
  name: string;
  filename: string;
  path: string;
  size_bytes: number;
  format: 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a' | string;
  created_at: string;
  is_export: boolean;
  audio_url: string;
}

export interface TrimAudioOptions {
  audioUrl?: string;
  audio_url?: string;
  generationId?: string;
  generation_id?: string;
  startTimeSec: number;
  start_time_sec?: number;
  endTimeSec: number;
  end_time_sec?: number;
  fadeInMs?: number;
  fade_in_ms?: number;
  fadeOutMs?: number;
  fade_out_ms?: number;
  saveAsNew?: boolean;
  save_as_new?: boolean;
  projectId?: string;
  project_id?: string;
}

export interface TrimAudioResult {
  status: string;
  audioUrl: string;
  generationId: string;
  durationMs: number;
  durationSec: number;
  fileSize: number;
  fileName: string;
  savedPath: string;
}

