"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  Sliders,
  Sparkles,
  RefreshCw,
  Clock,
  Music,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useProjectStore } from "@/stores/projectStore";
import { useAudioFilesStore } from "@/stores/audioFilesStore";
import { TrimAudioResult } from "@kobeanaudio/types";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface AudioTrimDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FADE_PRESETS = [
  { label: "None", value: 0 },
  { label: "20ms", value: 20 },
  { label: "50ms (Smooth)", value: 50 },
  { label: "100ms", value: 100 },
  { label: "250ms", value: 250 },
];

export const AudioTrimDialog: React.FC<AudioTrimDialogProps> = ({ isOpen, onClose }) => {
  const { audioUrl, duration, setAudioUrl } = usePlayerStore();
  const { activeProject, addGenerationRecord } = useProjectStore();
  const { loadAudioFiles } = useAudioFilesStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [startTime, setStartTime] = useState(0.0);
  const [endTime, setEndTime] = useState(duration > 0 ? duration : 5.0);
  const [fadeInMs, setFadeInMs] = useState(50);
  const [fadeOutMs, setFadeOutMs] = useState(50);
  const [saveAsNew, setSaveAsNew] = useState(true);
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimSuccess, setTrimSuccess] = useState(false);
  const [currentPlayhead, setCurrentPlayhead] = useState(0.0);

  // Initialize or update duration bounds when dialog opens or audioUrl changes
  useEffect(() => {
    if (isOpen && duration > 0) {
      setStartTime(0.0);
      setEndTime(duration);
      setTrimSuccess(false);
    }
  }, [isOpen, duration, audioUrl]);

  // WaveSurfer initialization for trim audition
  useEffect(() => {
    if (!isOpen || !containerRef.current || !audioUrl) return;

    const accentColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-primary")
        .trim() || "#38BDF8";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255, 255, 255, 0.2)",
      progressColor: accentColor,
      cursorColor: "#FFFFFF",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 48,
      normalize: true,
    });

    wavesurferRef.current = ws;
    ws.load(audioUrl);

    ws.on("timeupdate", (t) => {
      setCurrentPlayhead(t);
      // Stop audition if playback exceeds endTime
      if (t >= endTime) {
        ws.pause();
        setIsPlayingAudition(false);
      }
    });

    ws.on("finish", () => {
      setIsPlayingAudition(false);
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [isOpen, audioUrl]);

  // Keep wave duration in sync
  const trimmedDuration = Math.max(0, endTime - startTime);

  const handleAudition = () => {
    if (!wavesurferRef.current) return;

    if (isPlayingAudition) {
      wavesurferRef.current.pause();
      setIsPlayingAudition(false);
    } else {
      wavesurferRef.current.setTime(startTime);
      wavesurferRef.current.play();
      setIsPlayingAudition(true);
    }
  };

  const handleSetStartToPlayhead = () => {
    const current = wavesurferRef.current ? wavesurferRef.current.getCurrentTime() : currentPlayhead;
    const clamped = Math.min(current, Math.max(0, endTime - 0.2));
    setStartTime(parseFloat(clamped.toFixed(2)));
  };

  const handleSetEndToPlayhead = () => {
    const current = wavesurferRef.current ? wavesurferRef.current.getCurrentTime() : currentPlayhead;
    const clamped = Math.max(current, startTime + 0.2);
    setEndTime(parseFloat(clamped.toFixed(2)));
  };

  const handleApplyTrim = async () => {
    if (!audioUrl) return;
    setIsTrimming(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/export/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_url: audioUrl,
          start_time_sec: startTime,
          end_time_sec: endTime,
          fade_in_ms: fadeInMs,
          fade_out_ms: fadeOutMs,
          save_as_new: saveAsNew,
          project_id: activeProject?.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Trim request failed");
      }

      const data: TrimAudioResult = await res.json();

      // Update active player URL
      setAudioUrl(`http://127.0.0.1:8000${data.audioUrl}`);

      // Add to project generation history
      if (saveAsNew) {
        addGenerationRecord({
          id: data.generationId,
          projectId: activeProject?.id,
          textInput: `[Trimmed Take: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s]`,
          engine: "kokoro",
          voiceId: "trim-master",
          audioUrl: `http://127.0.0.1:8000${data.audioUrl}`,
          durationMs: data.durationMs,
          fileSize: data.fileSize,
          rating: 0,
          createdAt: new Date().toISOString(),
          model_used: "Apple Silicon M3 DSP Trimmer",
        });
      }

      // Refresh sidebar files
      loadAudioFiles();

      setTrimSuccess(true);
      setTimeout(() => {
        setIsTrimming(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Trim error:", err);
      setIsTrimming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        {...modalMotion.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isTrimming) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
      >
        <motion.div
          {...modalMotion.card}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-5 shadow-2xl text-[var(--text-main)] backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
            <div className="flex items-center space-x-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg p-[1px] shadow-sm"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[var(--bg-base)]">
                  <Scissors className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Trim Audio Take</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Millisecond-accurate boundary cutting with anti-click crossfades.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isTrimming}
              className="text-[var(--text-faint)] hover:text-[var(--text-main)] transition cursor-pointer p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Waveform Audition Track */}
          <div className="mt-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-main)] flex items-center space-x-1.5">
                <Music className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                <span>Audition Waveform</span>
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {currentPlayhead.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </div>

            {/* Waveform Canvas */}
            <div ref={containerRef} className="w-full overflow-hidden rounded-xl bg-black/10 dark:bg-black/30 py-1" />

            {/* Audition Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleAudition}
                className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent-primary)] cursor-pointer"
                style={{
                  color: isPlayingAudition ? "var(--accent-primary)" : "var(--text-main)",
                }}
              >
                {isPlayingAudition ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    <span>Pause Audition</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Audition Selection</span>
                  </>
                )}
              </button>

              <div className="text-right">
                <span className="text-[10px] text-[var(--text-faint)] block uppercase tracking-wider">Trimmed Length</span>
                <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                  {trimmedDuration.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* Start & End Cut Boundary Sliders */}
          <div className="mt-4 space-y-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5">
            {/* Start Time Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-muted)]">Start Cut Point</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSetStartToPlayhead}
                    className="text-[10px] text-[var(--accent-primary)] hover:underline cursor-pointer font-mono"
                  >
                    [Set to Playhead]
                  </button>
                  <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">{startTime.toFixed(2)}s</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0.1, endTime - 0.1)}
                step="0.05"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* End Time Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-muted)]">End Cut Point</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSetEndToPlayhead}
                    className="text-[10px] text-[var(--accent-primary)] hover:underline cursor-pointer font-mono"
                  >
                    [Set to Playhead]
                  </button>
                  <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">{endTime.toFixed(2)}s</span>
                </div>
              </div>
              <input
                type="range"
                min={Math.min(duration, startTime + 0.1)}
                max={duration > 0 ? duration : 5.0}
                step="0.05"
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Fade Options */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Fade In */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-2.5 space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Fade In</label>
              <select
                value={fadeInMs}
                onChange={(e) => setFadeInMs(parseInt(e.target.value))}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none"
              >
                {FADE_PRESETS.map((p) => (
                  <option key={p.label} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fade Out */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-2.5 space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">Fade Out</label>
              <select
                value={fadeOutMs}
                onChange={(e) => setFadeOutMs(parseInt(e.target.value))}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none"
              >
                {FADE_PRESETS.map((p) => (
                  <option key={p.label} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save As New Take Checkbox */}
          <div className="mt-3 flex items-center space-x-2 px-1">
            <input
              type="checkbox"
              id="saveAsNewTake"
              checked={saveAsNew}
              onChange={(e) => setSaveAsNew(e.target.checked)}
              className="rounded border-[var(--glass-border)]"
            />
            <label htmlFor="saveAsNewTake" className="text-xs text-[var(--text-muted)] cursor-pointer">
              Save as new take in project takes history
            </label>
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center justify-end space-x-2.5 pt-3 border-t border-[var(--glass-border)]">
            <button
              onClick={onClose}
              disabled={isTrimming}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyTrim}
              disabled={isTrimming || trimmedDuration <= 0}
              className="flex items-center space-x-2 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-lg transition cursor-pointer disabled:opacity-40"
              style={{
                backgroundImage: "var(--accent-gradient)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              {isTrimming ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{trimSuccess ? "Applied!" : "Processing DSP Cut..."}</span>
                </>
              ) : trimSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Trim Complete!</span>
                </>
              ) : (
                <>
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Apply Audio Trim</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
