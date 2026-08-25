import { create } from "zustand";
import { EngineInfo, EngineType, GeminiModelVariant, Voice, ModelQuotaInfo } from "@kobeanaudio/types";
import { fetchEngines, fetchVoices, fetchQuotaStatus, checkEngineHealth } from "@/lib/api";

const INITIAL_VOICES: Voice[] = [
  { id: "af_heart", name: "Heart (Female)", engine: "kokoro", language: "en", gender: "female", description: "Warm, natural narration voice" },
  { id: "am_adam", name: "Adam (Male)", engine: "kokoro", language: "en", gender: "male", description: "Clear, deep, resonant tone" },
  { id: "af_bella", name: "Bella (Female)", engine: "kokoro", language: "en", gender: "female", description: "Bright, energetic, podcast delivery" },
  { id: "am_michael", name: "Michael (Male)", engine: "kokoro", language: "en", gender: "male", description: "Professional, broadcast style" },
  { id: "bf_emma", name: "Emma (British Female)", engine: "kokoro", language: "en-gb", gender: "female", description: "Sophisticated British RP aesthetic" },
  { id: "bm_george", name: "George (British Male)", engine: "kokoro", language: "en-gb", gender: "male", description: "Classic BBC style documentary" },
  { id: "Achernar", name: "Achernar", engine: "gemini", language: "en", gender: "female", description: "Clear, poised, standard English narration" },
  { id: "Achird", name: "Achird", engine: "gemini", language: "en", gender: "male", description: "Authoritative, resonant, deep documentary voice" },
  { id: "Charon", name: "Charon", engine: "gemini", language: "en", gender: "male", description: "Deep, dramatic, cinematic trailer style voice" },
  { id: "Erinome", name: "Erinome", engine: "gemini", language: "en", gender: "female", description: "Sophisticated, refined British RP aesthetic" },
  { id: "Fenrir", name: "Fenrir", engine: "gemini", language: "en", gender: "male", description: "Gravelly, bold, intense dramatic narration" },
  { id: "Zephyr", name: "Zephyr", engine: "gemini", language: "en", gender: "neutral", description: "Smooth, modern AI assistant, balanced and clear" },
  { id: "orpheus_tara", name: "Tara", engine: "orpheus", language: "en", gender: "female", description: "Emotional narrative with dynamic laughter & sigh tags" },
  { id: "orpheus_leo", name: "Leo", engine: "orpheus", language: "en", gender: "male", description: "Cinematic trailer narrator with whisper & gasp cues" },
  { id: "qwen3_en_male", name: "En Male", engine: "qwen3", language: "en", gender: "male", description: "Multilingual natural voice with prompt-guided emotion" },
  { id: "qwen3_zh_female", name: "Zh Female", engine: "qwen3", language: "zh", gender: "female", description: "Mandarin natural SOTA voice with prompt-guided emotion" },
];

export interface GenerationTelemetry {
  modelUsed?: string | null;
  wasCascaded?: boolean;
  cascadeReason?: string | null;
  generatedAt?: string;
}

interface EngineState {
  activeEngine: EngineType;
  selectedVoiceId: string;
  selectedGeminiModel: GeminiModelVariant;
  temperature: number;
  speed: number;
  pitch: number;
  emotionExaggeration: number;
  outputFormat: "wav" | "mp3" | "flac" | "ogg" | "m4a";
  normalizeLufs: number | null;
  trimSilence: boolean;

  engines: EngineInfo[];
  voices: Voice[];
  quotaStatus: Record<string, ModelQuotaInfo>;
  isCheckingQuota: boolean;
  lastTelemetry: GenerationTelemetry | null;

  isLoadingEngines: boolean;
  isLoadingVoices: boolean;
  error: string | null;

  setActiveEngine: (engine: EngineType) => void;
  setSelectedVoiceId: (voiceId: string) => void;
  setSelectedGeminiModel: (model: GeminiModelVariant) => void;
  setTemperature: (val: number) => void;
  setSpeed: (val: number) => void;
  setPitch: (val: number) => void;
  setEmotionExaggeration: (val: number) => void;
  setOutputFormat: (fmt: "wav" | "mp3" | "flac" | "ogg" | "m4a") => void;
  setNormalizeLufs: (lufs: number | null) => void;
  setTrimSilence: (trim: boolean) => void;
  setLastTelemetry: (telemetry: GenerationTelemetry | null) => void;

  loadEngines: () => Promise<void>;
  loadVoices: () => Promise<void>;
  loadQuotaStatus: () => Promise<void>;
  probeLiveHealth: () => Promise<void>;
  addCustomVoice: (voice: Voice) => void;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  activeEngine: "kokoro",
  selectedVoiceId: "af_heart",
  selectedGeminiModel: "gemini-2.5-flash-preview-tts",
  temperature: 1.0,
  speed: 1.0,
  pitch: 1.0,
  emotionExaggeration: 0.5,
  outputFormat: "wav",
  normalizeLufs: -16.0,
  trimSilence: true,

  engines: [],
  voices: INITIAL_VOICES,
  quotaStatus: {},
  isCheckingQuota: false,
  lastTelemetry: null,
  isLoadingEngines: false,
  isLoadingVoices: false,
  error: null,

  setActiveEngine: (activeEngine) => {
    set({ activeEngine });
    const available = get().voices.filter((v) => v.engine === activeEngine);
    if (available.length > 0) {
      set({ selectedVoiceId: available[0].id });
    }
  },

  setSelectedVoiceId: (selectedVoiceId) => set({ selectedVoiceId }),
  setSelectedGeminiModel: (selectedGeminiModel) => set({ selectedGeminiModel }),
  setTemperature: (temperature) => set({ temperature }),
  setSpeed: (speed) => set({ speed }),
  setPitch: (pitch) => set({ pitch }),
  setEmotionExaggeration: (emotionExaggeration) => set({ emotionExaggeration }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setNormalizeLufs: (normalizeLufs) => set({ normalizeLufs }),
  setTrimSilence: (trimSilence) => set({ trimSilence }),
  setLastTelemetry: (lastTelemetry) => set({ lastTelemetry }),

  loadEngines: async () => {
    set({ isLoadingEngines: true, error: null });
    try {
      const engines = await fetchEngines();
      set({ engines, isLoadingEngines: false });
    } catch (e: any) {
      set({ error: e.message, isLoadingEngines: false });
    }
  },

  loadVoices: async () => {
    set({ isLoadingVoices: true, error: null });
    try {
      const voices = await fetchVoices();
      if (voices && voices.length > 0) {
        set({ voices, isLoadingVoices: false });
        const current = get().selectedVoiceId;
        const exists = voices.some((v) => v.id === current);
        if (!exists) {
          const firstForEngine = voices.find((v) => v.engine === get().activeEngine);
          if (firstForEngine) {
            set({ selectedVoiceId: firstForEngine.id });
          }
        }
      }
    } catch (e: any) {
      set({ error: e.message, isLoadingVoices: false });
    }
  },

  loadQuotaStatus: async () => {
    try {
      const res = await fetchQuotaStatus();
      if (res && res.models) {
        set({ quotaStatus: res.models });
      }
    } catch (e: any) {
      console.warn("Failed loading quota status:", e);
    }
  },

  probeLiveHealth: async () => {
    set({ isCheckingQuota: true });
    try {
      const res = await checkEngineHealth();
      if (res && res.models) {
        set({ quotaStatus: res.models, isCheckingQuota: false });
      }
    } catch (e: any) {
      set({ isCheckingQuota: false });
    }
  },

  addCustomVoice: (voice) => {
    set((state) => ({
      voices: [voice, ...state.voices],
      selectedVoiceId: voice.id,
    }));
  },
}));
