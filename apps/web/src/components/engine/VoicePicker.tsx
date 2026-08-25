"use client";

import React, { useState } from "react";
import { Play, User, Sliders, Volume2, Sparkles } from "lucide-react";
import { useEngineStore } from "@/stores/engineStore";

export const VoicePicker: React.FC = () => {
  const {
    activeEngine,
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    temperature,
    setTemperature,
    speed,
    setSpeed,
    emotionExaggeration,
    setEmotionExaggeration,
    outputFormat,
    setOutputFormat,
  } = useEngineStore();

  const [search, setSearch] = useState("");
  const filteredVoices = voices
    .filter((v) => v.engine === activeEngine)
    .filter(
      (v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase())
    );

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 backdrop-blur-md shadow-sm">
      {/* Voice Selection */}
      <div className="sm:col-span-6 space-y-1.5">
        <label className="text-xs font-medium text-[var(--text-muted)]">Voice Character</label>
        <div className="flex items-center space-x-2">
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
          >
            {filteredVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender || "neutral"}, {v.language})
              </option>
            ))}
          </select>
        </div>
        {selectedVoice && (
          <p className="text-[11px] text-[var(--text-faint)] line-clamp-1">
            {selectedVoice.description}
          </p>
        )}
      </div>

      {/* Temperature / Variety Slider */}
      <div className="sm:col-span-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Temperature</span>
          <span className="font-mono text-[var(--accent-primary)] font-semibold">
            {temperature.toFixed(2)}
          </span>
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
        <div className="flex justify-between text-[9px] text-[var(--text-faint)]">
          <span>Predictable</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Speed / Exaggeration Slider */}
      <div className="sm:col-span-3 space-y-1.5">
        {activeEngine === "chatterbox" ? (
          <>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Emotion Boost</span>
              <span className="font-mono text-[var(--accent-primary)] font-semibold">
                {emotionExaggeration.toFixed(2)}
              </span>
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
            <div className="flex justify-between text-[9px] text-[var(--text-faint)]">
              <span>Subtle</span>
              <span>Expressive</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Speed</span>
              <span className="font-mono text-[var(--accent-primary)] font-semibold">
                {speed.toFixed(2)}x
              </span>
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
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
