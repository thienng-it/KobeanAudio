"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  Sparkles,
  Volume2,
  Play,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  Layers,
  History,
  Download,
  Flame,
  Globe,
  Settings2,
  RefreshCw,
  Activity,
} from "lucide-react";
import { EngineType, GeminiModelVariant, Voice } from "@kobeanaudio/types";
import { useEngineStore } from "@/stores/engineStore";
import { useProjectStore } from "@/stores/projectStore";
import { usePlayerStore } from "@/stores/playerStore";
import {
  dropdownMotion,
  buttonTapMotion,
  buttonSubtleTapMotion,
  cardHoverMotion,
} from "@/lib/motion";

interface StudioInspectorProps {
  onOpenExport: (generationId?: string) => void;
}

const GEMINI_MODELS: { id: GeminiModelVariant; name: string; tag: string }[] = [
  { id: "gemini-2.5-flash-preview-tts", name: "Gemini 2.5 Flash (Ultra Stable)", tag: "Recommended ⚡" },
  { id: "gemini-3.1-flash-tts-preview", name: "Gemini 3.1 Flash (Flagship Preview)", tag: "Pro Plan" },
  { id: "gemini-2.5-pro-preview-tts", name: "Gemini 2.5 Pro (Studio Narration)", tag: "HD Master" },
];

const LUFS_PRESETS = [
  { label: "Podcasts (-16)", value: -16.0 },
  { label: "Streaming (-14)", value: -14.0 },
  { label: "Broadcast (-23)", value: -23.0 },
  { label: "Off", value: null },
];

export const StudioInspector: React.FC<StudioInspectorProps> = ({ onOpenExport }) => {
  const {
    activeEngine,
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    selectedGeminiModel,
    setSelectedGeminiModel,
    temperature,
    setTemperature,
    speed,
    setSpeed,
    pitch,
    setPitch,
    emotionExaggeration,
    setEmotionExaggeration,
    normalizeLufs,
    setNormalizeLufs,
    trimSilence,
    setTrimSilence,
    quotaStatus,
    isCheckingQuota,
    probeLiveHealth,
    lastTelemetry,
  } = useEngineStore();

  const { generations } = useProjectStore();
  const { setAudioUrl, audioUrl } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [voiceListOpen, setVoiceListOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"controls" | "history">("controls");
  const [acousticOpen, setAcousticOpen] = useState(true);
  const [dspOpen, setDspOpen] = useState(true);

  const currentModelQuota = quotaStatus[selectedGeminiModel];
  const isExhausted = currentModelQuota?.status === "exhausted";

  const filteredVoices = voices
    .filter((v) => v.engine === activeEngine)
    .filter(
      (v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.language && v.language.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || filteredVoices[0];

  return (
    <aside className="liquid-glass flex h-full w-82.5 flex-col border-l border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-main)] transition-all select-none">
      {/* Inspector Tab Switcher */}
      <div className="flex h-12 items-center border-b border-[var(--glass-border)] px-4">
        <div className="flex w-full items-center rounded-xl bg-black/10 dark:bg-black/40 p-0.5 border border-[var(--glass-border)]">
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === "controls"
                ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
            <span>Voice & DSP</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center space-x-1.5 rounded-lg py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <History className="h-3.5 w-3.5" style={{ color: "var(--accent-secondary)" }} />
            <span>Takes ({generations.length})</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "controls" ? (
          <>
            {/* Voice Timbre Card with Floating Popover */}
            <div className="relative space-y-1.5 z-40">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                <span>Voice Character</span>
                <span className="text-[var(--accent-primary)] font-mono">{filteredVoices.length} available</span>
              </div>

              {/* Selected Voice Card Trigger */}
              <div
                onClick={() => setVoiceListOpen(!voiceListOpen)}
                className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition shadow-sm backdrop-blur-md ${
                  voiceListOpen
                    ? "border-[var(--accent-primary)] bg-[var(--bg-surface-elevated)]"
                    : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] hover:border-[var(--glass-border-highlight)]"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/[0.06] border border-[var(--glass-border)] font-semibold text-xs text-[var(--accent-primary)] shadow-sm">
                    {selectedVoice?.name ? selectedVoice.name.slice(0, 2).toUpperCase() : "VO"}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-semibold text-[var(--text-main)] truncate">
                        {selectedVoice ? selectedVoice.name : "Select Voice"}
                      </span>
                      {selectedVoice?.gender && (
                        <span className="rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.2 text-[9px] uppercase text-[var(--text-muted)]">
                          {selectedVoice.gender}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] truncate block">
                      {selectedVoice?.description || `${selectedVoice?.language || "en"} · Native Voice`}
                    </span>
                  </div>
                </div>

                <ChevronDown className={`h-4 w-4 text-[var(--text-faint)] transition duration-200 ${voiceListOpen ? "rotate-180 text-[var(--accent-primary)]" : ""}`} />
              </div>

              {/* Floating Absolute Dropdown Popover */}
              <AnimatePresence>
                {voiceListOpen && (
                  <>
                    {/* Click-outside dismiss backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setVoiceListOpen(false)}
                    />

                    <motion.div
                      {...dropdownMotion}
                      className="glass-popover absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl p-2.5"
                    >
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-faint)]" />
                        <input
                          type="text"
                          placeholder="Search voices by name, accent..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                          className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] py-2 pl-8 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>

                      <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                        {filteredVoices.map((v) => {
                          const isSelected = v.id === selectedVoiceId;
                          return (
                            <div
                              key={v.id}
                              onClick={() => {
                                setSelectedVoiceId(v.id);
                                setVoiceListOpen(false);
                              }}
                              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition ${
                                isSelected
                                  ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold border border-white/20 shadow-sm"
                                  : "text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="truncate font-medium">{v.name}</span>
                                {v.gender && (
                                  <span className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[9px] uppercase text-[var(--text-faint)]">
                                    {v.gender}
                                  </span>
                                )}
                                <span className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[9px] uppercase text-[var(--text-faint)]">
                                  {v.language}
                                </span>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


            {/* Gemini Pro Model Selector & Quota Health Monitor */}
            {activeEngine === "gemini" && (
              <div className="space-y-2 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  <span>Google AI Pro Model</span>
                  <span className="text-[9px] rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[var(--text-muted)]">Director Notes</span>
                </div>
                <select
                  value={selectedGeminiModel}
                  onChange={(e) => setSelectedGeminiModel(e.target.value as GeminiModelVariant)}
                  className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                {/* Live Model Quota & Health Status Bar */}
                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-2.5 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] flex items-center space-x-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isExhausted
                            ? "bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping"
                            : selectedGeminiModel === "gemini-2.5-flash-preview-tts"
                            ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"
                            : "bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"
                        }`}
                      />
                      <span className="font-semibold text-[var(--text-main)]">
                        {isExhausted
                          ? "🔴 429 Quota Exceeded"
                          : selectedGeminiModel === "gemini-2.5-flash-preview-tts"
                          ? "🟢 High Quota Active"
                          : selectedGeminiModel === "gemini-3.1-flash-tts-preview"
                          ? "🟡 Limited Tier (10/day)"
                          : "🟡 Studio HD Tier"}
                      </span>
                    </span>

                    <button
                      onClick={probeLiveHealth}
                      disabled={isCheckingQuota}
                      className="flex items-center space-x-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 px-1.5 py-0.5 text-[9px] text-[var(--accent-primary)] font-mono transition disabled:opacity-50 cursor-pointer"
                      title="Proactively test Google AI Studio endpoint availability"
                    >
                      <RefreshCw className={`h-2.5 w-2.5 ${isCheckingQuota ? "animate-spin" : ""}`} />
                      <span>{isCheckingQuota ? "Probing..." : "Test Quota ↻"}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    {isExhausted
                      ? "Daily request quota reached for this model. Traffic is automatically routed to Gemini 2.5 Flash without disruption."
                      : selectedGeminiModel === "gemini-2.5-flash-preview-tts"
                      ? "Standard high-throughput speech endpoint (1,500 req/day). Sub-second response with 30 voices."
                      : selectedGeminiModel === "gemini-3.1-flash-tts-preview"
                      ? "Experimental preview model with daily quota cap. Auto-routes to 2.5 Flash on 429."
                      : "Studio HD narration. Automatically fails over to 2.5 Flash if rate-limited."}
                  </p>

                  <div className="flex items-center justify-between text-[9px] border-t border-[var(--glass-border)] pt-1.5 text-[var(--text-faint)]">
                    <span className="font-mono text-[var(--accent-primary)]">⚡ Multi-Tier Failover</span>
                    <span className="font-mono text-[9px]">2.5 Flash ⇄ 3.1 ⇄ Local</span>
                  </div>
                </div>

                {/* Last Generation Telemetry Feedback */}
                {lastTelemetry && (
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-2 text-[10px] border space-y-1 ${
                      lastTelemetry.wasCascaded
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3 shrink-0" />
                        <span>Take Telemetry</span>
                      </div>
                      <span className="font-mono text-[9px] text-[var(--text-faint)]">{lastTelemetry.generatedAt}</span>
                    </div>
                    <div className="text-[var(--text-muted)] font-mono text-[10px]">
                      Synthesized via: <span className="font-bold text-[var(--text-main)]">{lastTelemetry.modelUsed}</span>
                    </div>
                    {lastTelemetry.wasCascaded && lastTelemetry.cascadeReason && (
                      <p className="text-[9px] text-amber-600 dark:text-amber-200/90 leading-tight">
                        ⚡ {lastTelemetry.cascadeReason}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Local Engine Hardware Status Monitor (When running local models) */}
            {activeEngine !== "gemini" && (
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-2.5 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="font-semibold text-[var(--text-main)]">Apple Silicon M3 Hardware DSP</span>
                  </div>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    Unlimited
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Running 100% locally via Metal GPU / Neural Engine. 0 API calls, zero quota limits.
                </p>
              </div>
            )}

            {/* Expressive Acoustic Sliders Card (Collapsible) */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] backdrop-blur-md overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => setAcousticOpen(!acousticOpen)}
                className="flex w-full items-center justify-between p-3 text-left transition hover:bg-white/[0.04] cursor-pointer"
                title={acousticOpen ? "Collapse Acoustic Controls" : "Expand Acoustic Controls"}
              >
                <div className="flex items-center space-x-2">
                  <Sliders className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                    Acoustic Controls
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!acousticOpen && (
                    <span className="font-mono text-[10px] text-[var(--accent-primary)] font-medium bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/10">
                      {speed.toFixed(2)}x · {pitch.toFixed(2)}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[var(--text-faint)] transition duration-200 ${
                      acousticOpen ? "rotate-180 text-[var(--accent-primary)]" : ""
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {acousticOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 pt-1 space-y-3 border-t border-[var(--glass-border)]/50">
                      {/* Speed Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Speaking Pace</span>
                          <span className="font-mono text-[var(--accent-primary)] font-semibold">{speed.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={speed}
                          onChange={(e) => setSpeed(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[9px] text-[var(--text-faint)]">
                          <span>0.5x Slow</span>
                          <span>1.0x Normal</span>
                          <span>2.0x Fast</span>
                        </div>
                      </div>

                      {/* Pitch Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Pitch Tuning</span>
                          <span className="font-mono text-[var(--accent-secondary)] font-semibold">{pitch.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={pitch}
                          onChange={(e) => setPitch(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Temperature / Variety */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Inflection / Temperature</span>
                          <span className="font-mono text-[var(--accent-primary)] font-semibold">{temperature.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Emotion Exaggeration (When Chatterbox is active) */}
                      {activeEngine === "chatterbox" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)]">Emotion Exaggeration</span>
                            <span className="font-mono text-[var(--accent-primary)] font-semibold">{emotionExaggeration.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.05"
                            value={emotionExaggeration}
                            onChange={(e) => setEmotionExaggeration(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Master DSP & Broadcast LUFS Card (Collapsible) */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] backdrop-blur-md overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => setDspOpen(!dspOpen)}
                className="flex w-full items-center justify-between p-3 text-left transition hover:bg-white/[0.04] cursor-pointer"
                title={dspOpen ? "Collapse DSP Loudness & Polish" : "Expand DSP Loudness & Polish"}
              >
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                    DSP Loudness & Polish
                  </span>
                  <span className="text-[9px] text-[var(--accent-primary)] font-mono">Apple M3</span>
                </div>
                <div className="flex items-center space-x-2">
                  {!dspOpen && (
                    <span className="font-mono text-[10px] text-[var(--text-muted)] bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/10">
                      {normalizeLufs !== null ? `${normalizeLufs} LUFS` : "Raw"}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[var(--text-faint)] transition duration-200 ${
                      dspOpen ? "rotate-180 text-[var(--accent-primary)]" : ""
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {dspOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 pt-1 space-y-2.5 border-t border-[var(--glass-border)]/50">
                      {/* LUFS Presets */}
                      <div className="space-y-1">
                        <label className="text-xs text-[var(--text-muted)]">LUFS Normalization</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {LUFS_PRESETS.map((p) => {
                            const isSelected = normalizeLufs === p.value;
                            return (
                              <button
                                key={p.label}
                                onClick={() => setNormalizeLufs(p.value)}
                                className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                                  isSelected
                                    ? "border-[var(--glass-border-highlight)] bg-white/[0.2] dark:bg-white/[0.12] text-[var(--text-main)] font-semibold shadow-sm"
                                    : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Trim Silence Switch */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-[var(--text-muted)]">Auto-Trim Silence</span>
                        <button
                          onClick={() => setTrimSilence(!trimSilence)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            trimSilence ? "bg-[var(--accent-primary)]" : "bg-black/20 dark:bg-white/20"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              trimSilence ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Generation Takes History Tab */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              <span>Project Takes ({generations.length})</span>
            </div>

            {generations.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-faint)]">
                No synthesized audio for this project yet.
              </div>
            ) : (
              generations.map((gen, idx) => {
                const genUrl = gen.audio_url || gen.audioUrl || "";
                const isCurrent = audioUrl === genUrl;
                const durationSec = Math.round((gen.duration_ms ?? gen.durationMs ?? 0) / 1000);
                const voiceName = gen.voice_id || gen.voiceId || "voice";
                return (
                  <div
                    key={gen.id}
                    onClick={() => setAudioUrl(genUrl || null)}
                    className={`group flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer transition ${
                      isCurrent
                        ? "border-[var(--glass-border-highlight)] bg-white/[0.2] dark:bg-white/[0.12] text-[var(--text-main)] shadow-md"
                        : "border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition">
                        <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />
                      </button>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-[var(--text-main)] truncate">
                            Take #{generations.length - idx}
                          </span>
                          <span className="rounded bg-black/5 dark:bg-white/10 px-1 py-0.2 text-[9px] uppercase text-[var(--accent-primary)]">
                            {gen.engine}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-faint)] block truncate">
                          {voiceName} · {durationSec}s
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExport(gen.id);
                      }}
                      className="rounded-lg p-1.5 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition"
                      title="Export Audio"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
