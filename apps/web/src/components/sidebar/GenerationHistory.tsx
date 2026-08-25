"use client";

import React from "react";
import { History, Play, Clock, FileAudio, Download } from "lucide-react";
import { GenerationRecord } from "@kobeanaudio/types";
import { usePlayerStore } from "@/stores/playerStore";
import { useProjectStore } from "@/stores/projectStore";

interface GenerationHistoryProps {
  onSelectForExport: (genId: string) => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({ onSelectForExport }) => {
  const { generations } = useProjectStore();
  const { setAudioUrl, audioUrl } = usePlayerStore();

  const formatDuration = (ms: number) => {
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 space-y-2.5 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-main)]">
          <History className="h-4 w-4 text-[var(--accent-primary)]" />
          <span>Generation History ({generations.length})</span>
        </div>
      </div>

      <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {generations.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-faint)]">
            No audio generated for this project yet.
          </div>
        ) : (
          generations.map((gen, idx) => {
            const genAudioUrl = gen.audio_url || gen.audioUrl || "";
            const isCurrent = audioUrl === genAudioUrl;
            const duration = gen.duration_ms ?? gen.durationMs ?? 0;
            const size = gen.file_size ?? gen.fileSize ?? 0;
            const voiceId = gen.voice_id || gen.voiceId || "voice";
            return (
              <div
                key={gen.id}
                onClick={() => setAudioUrl(genAudioUrl || null)}
                className={`group flex items-center justify-between rounded-xl p-2 text-xs cursor-pointer transition ${
                  isCurrent
                    ? "bg-white/[0.12] border border-[var(--accent-primary)]/50 text-[var(--text-main)] shadow-sm"
                    : "border border-transparent bg-white/[0.02] text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-main)]"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition">
                    <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />
                  </button>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[var(--text-main)] truncate">
                        v{generations.length - idx} · {voiceId}
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] uppercase font-mono text-[var(--accent-primary)]">
                        {gen.engine}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-[var(--text-faint)]">
                      <span>{formatDuration(duration)}</span>
                      <span>•</span>
                      <span>{formatSize(size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectForExport(gen.id);
                  }}
                  className="rounded-lg p-1.5 text-[10px] text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--accent-primary)] transition"
                  title="Export this take"
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
