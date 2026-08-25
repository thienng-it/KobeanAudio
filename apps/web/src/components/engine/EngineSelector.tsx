"use client";

import React from "react";
import { Zap, Heart, Mic, Cloud, Globe, FastForward, Check } from "lucide-react";
import { EngineType, GeminiModelVariant } from "@kobeanaudio/types";
import { useEngineStore } from "@/stores/engineStore";

const ENGINES_META: {
  id: EngineType;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  isCloud?: boolean;
}[] = [
  {
    id: "kokoro",
    label: "Kokoro",
    sub: "82M · Apache 2.0",
    icon: Zap,
    tag: "Default · 14x ⚡",
  },
  {
    id: "orpheus",
    label: "Orpheus",
    sub: "3B · Llama-3",
    icon: Heart,
    tag: "Expressive 🎭",
  },
  {
    id: "chatterbox",
    label: "Chatterbox",
    sub: "Voice Clone",
    icon: Mic,
    tag: "MIT · MPS 🎤",
  },
  {
    id: "gemini",
    label: "Gemini TTS",
    sub: "Google AI Pro",
    icon: Cloud,
    tag: "Pro Plan ☁️",
    isCloud: true,
  },
  {
    id: "qwen3",
    label: "Qwen3",
    sub: "10 Languages",
    icon: Globe,
    tag: "Multilingual 🌐",
  },
  {
    id: "piper",
    label: "Piper",
    sub: "Instant CPU",
    icon: FastForward,
    tag: "Draft ⚡",
  },
];

const GEMINI_MODELS: { id: GeminiModelVariant; name: string; desc: string }[] = [
  {
    id: "gemini-2.5-flash-preview-tts",
    name: "Gemini 2.5 Flash TTS (Ultra Stable)",
    desc: "Recommended for high-quota, low latency & smooth generation",
  },
  {
    id: "gemini-3.1-flash-tts-preview",
    name: "Gemini 3.1 Flash TTS (Flagship Preview)",
    desc: "Best overall quality, director's notes & 200+ audio tags",
  },
  {
    id: "gemini-2.5-pro-preview-tts",
    name: "Gemini 2.5 Pro TTS (Studio HD)",
    desc: "Highest fidelity for long-form podcasts & narration",
  },
];

export const EngineSelector: React.FC = () => {
  const {
    activeEngine,
    setActiveEngine,
    selectedGeminiModel,
    setSelectedGeminiModel,
  } = useEngineStore();

  return (
    <div className="space-y-2">
      {/* Engine Tab Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ENGINES_META.map((eng) => {
          const isActive = activeEngine === eng.id;
          const Icon = eng.icon;
          return (
            <button
              key={eng.id}
              onClick={() => setActiveEngine(eng.id)}
              className={`relative flex flex-col items-start rounded-xl p-2.5 text-left transition-all duration-200 ${
                isActive
                  ? "border border-[var(--accent-primary)]/60 bg-white/[0.12] shadow-md"
                  : "border border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-faint)]"
                    }`}
                  />
                  <span className="font-semibold text-xs text-[var(--text-main)]">{eng.label}</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                    isActive
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                      : "bg-white/10 text-[var(--text-faint)]"
                  }`}
                >
                  {eng.tag}
                </span>
              </div>
              <span className="mt-1 text-[10px] text-[var(--text-faint)]">{eng.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Gemini Model Sub-Picker if Gemini is Active */}
      {activeEngine === "gemini" && (
        <div className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-[var(--accent-primary)]">
              Google AI Pro Model:
            </span>
            <select
              value={selectedGeminiModel}
              onChange={(e) => setSelectedGeminiModel(e.target.value as GeminiModelVariant)}
              className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            30 Prebuilt Voices · 200+ Expressive Audio Tags
          </span>
        </div>
      )}
    </div>
  );
};
