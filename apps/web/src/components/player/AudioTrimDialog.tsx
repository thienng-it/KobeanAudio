"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Zap,
  Repeat,
  ChevronLeft,
  ChevronRight,
  GripVertical,
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
  { label: "20ms (Anti-click)", value: 20 },
  { label: "50ms (Smooth)", value: 50 },
  { label: "100ms", value: 100 },
  { label: "250ms", value: 250 },
];

export const AudioTrimDialog: React.FC<AudioTrimDialogProps> = ({ isOpen, onClose }) => {
  const { audioUrl, duration, setAudioUrl } = usePlayerStore();
  const { activeProject, addGenerationRecord } = useProjectStore();
  const { loadAudioFiles } = useAudioFilesStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const waveformWrapperRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [startTime, setStartTime] = useState(0.0);
  const [endTime, setEndTime] = useState(duration > 0 ? duration : 5.0);
  const [fadeInMs, setFadeInMs] = useState(50);
  const [fadeOutMs, setFadeOutMs] = useState(50);
  const [saveAsNew, setSaveAsNew] = useState(true);
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimSuccess, setTrimSuccess] = useState(false);
  const [currentPlayhead, setCurrentPlayhead] = useState(0.0);

  // Direct Waveform Dragging State
  const [draggingTarget, setDraggingTarget] = useState<"start" | "end" | "window" | "draw" | null>(null);
  const dragAnchorRef = useRef<{ clientX: number; initialStart: number; initialEnd: number }>({
    clientX: 0,
    initialStart: 0,
    initialEnd: 0,
  });

  const effectiveDuration = duration > 0 ? duration : 5.0;

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
      height: 58,
      normalize: true,
    });

    wavesurferRef.current = ws;
    ws.load(audioUrl);

    ws.on("timeupdate", (t) => {
      setCurrentPlayhead(t);
      // Stop or loop audition if playback exceeds endTime
      if (t >= endTime) {
        if (isLooping) {
          ws.setTime(startTime);
          ws.play();
        } else {
          ws.pause();
          setIsPlayingAudition(false);
        }
      }
    });

    ws.on("finish", () => {
      if (isLooping) {
        ws.setTime(startTime);
        ws.play();
      } else {
        setIsPlayingAudition(false);
      }
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [isOpen, audioUrl, endTime, startTime, isLooping]);

  // Time conversion helper from mouse clientX on waveform
  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      if (!waveformWrapperRef.current || effectiveDuration <= 0) return 0;
      const rect = waveformWrapperRef.current.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const fraction = clampedX / rect.width;
      return parseFloat((fraction * effectiveDuration).toFixed(2));
    },
    [effectiveDuration]
  );

  // Global mousemove and mouseup listeners for waveform scrubbing and handle dragging
  useEffect(() => {
    if (!draggingTarget) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentSec = getTimeFromClientX(e.clientX);

      if (draggingTarget === "start") {
        const clamped = Math.max(0, Math.min(endTime - 0.05, currentSec));
        setStartTime(parseFloat(clamped.toFixed(2)));
      } else if (draggingTarget === "end") {
        const clamped = Math.min(effectiveDuration, Math.max(startTime + 0.05, currentSec));
        setEndTime(parseFloat(clamped.toFixed(2)));
      } else if (draggingTarget === "window") {
        if (!waveformWrapperRef.current) return;
        const rect = waveformWrapperRef.current.getBoundingClientRect();
        const deltaSec = ((e.clientX - dragAnchorRef.current.clientX) / rect.width) * effectiveDuration;
        const windowLength = dragAnchorRef.current.initialEnd - dragAnchorRef.current.initialStart;

        let newStart = dragAnchorRef.current.initialStart + deltaSec;
        let newEnd = dragAnchorRef.current.initialEnd + deltaSec;

        if (newStart < 0) {
          newStart = 0;
          newEnd = windowLength;
        } else if (newEnd > effectiveDuration) {
          newEnd = effectiveDuration;
          newStart = effectiveDuration - windowLength;
        }

        setStartTime(parseFloat(newStart.toFixed(2)));
        setEndTime(parseFloat(newEnd.toFixed(2)));
      } else if (draggingTarget === "draw") {
        const anchor = dragAnchorRef.current.initialStart;
        if (currentSec >= anchor) {
          setStartTime(parseFloat(anchor.toFixed(2)));
          setEndTime(parseFloat(Math.max(anchor + 0.05, currentSec).toFixed(2)));
        } else {
          setStartTime(parseFloat(Math.max(0, currentSec).toFixed(2)));
          setEndTime(parseFloat(Math.max(currentSec + 0.05, anchor).toFixed(2)));
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingTarget(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingTarget, startTime, endTime, effectiveDuration, getTimeFromClientX]);

  // Handler for clicking directly on waveform track
  const handleWaveformMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking close to an existing handle, let handle handle it
    const clickTime = getTimeFromClientX(e.clientX);
    const startThreshold = (0.04 * effectiveDuration) || 0.3;
    const endThreshold = (0.04 * effectiveDuration) || 0.3;

    if (Math.abs(clickTime - startTime) <= startThreshold) {
      setDraggingTarget("start");
      return;
    }
    if (Math.abs(clickTime - endTime) <= endThreshold) {
      setDraggingTarget("end");
      return;
    }

    // Inside existing region? Slide window
    if (clickTime > startTime && clickTime < endTime) {
      dragAnchorRef.current = {
        clientX: e.clientX,
        initialStart: startTime,
        initialEnd: endTime,
      };
      setDraggingTarget("window");
      return;
    }

    // Outside region? Start drawing new region from click point
    dragAnchorRef.current = {
      clientX: e.clientX,
      initialStart: clickTime,
      initialEnd: clickTime,
    };
    setStartTime(clickTime);
    setEndTime(Math.min(effectiveDuration, clickTime + 0.1));
    setDraggingTarget("draw");

    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(clickTime);
    }
  };

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
    const clamped = Math.min(current, Math.max(0, endTime - 0.1));
    setStartTime(parseFloat(clamped.toFixed(2)));
  };

  const handleSetEndToPlayhead = () => {
    const current = wavesurferRef.current ? wavesurferRef.current.getCurrentTime() : currentPlayhead;
    const clamped = Math.max(current, startTime + 0.1);
    setEndTime(parseFloat(clamped.toFixed(2)));
  };

  // Smart silence detection & automatic waveform snapping
  const handleAutoSnapSilence = async () => {
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const threshold = 0.015; // ~-36dB amplitude

      let startSample = 0;
      for (let i = 0; i < rawData.length; i++) {
        if (Math.abs(rawData[i]) > threshold) {
          startSample = Math.max(0, i - Math.floor(sampleRate * 0.05)); // 50ms pre-pad
          break;
        }
      }

      let endSample = rawData.length - 1;
      for (let i = rawData.length - 1; i >= 0; i--) {
        if (Math.abs(rawData[i]) > threshold) {
          endSample = Math.min(rawData.length - 1, i + Math.floor(sampleRate * 0.05)); // 50ms post-pad
          break;
        }
      }

      const detectedStart = parseFloat((startSample / sampleRate).toFixed(2));
      const detectedEnd = parseFloat((endSample / sampleRate).toFixed(2));

      if (detectedEnd > detectedStart) {
        setStartTime(detectedStart);
        setEndTime(detectedEnd);
      }
      audioCtx.close();
    } catch (e) {
      console.warn("Auto-snap silence fallback:", e);
      setStartTime(0.1);
      setEndTime(Math.max(0.5, effectiveDuration - 0.1));
    }
  };

  const handleResetBoundaries = () => {
    setStartTime(0.0);
    setEndTime(effectiveDuration);
  };

  const handleNudge = (type: "start" | "end", amountSec: number) => {
    if (type === "start") {
      const val = Math.max(0, Math.min(endTime - 0.05, startTime + amountSec));
      setStartTime(parseFloat(val.toFixed(2)));
    } else {
      const val = Math.min(effectiveDuration, Math.max(startTime + 0.05, endTime + amountSec));
      setEndTime(parseFloat(val.toFixed(2)));
    }
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
      }, 900);
    } catch (err) {
      console.error("Trim error:", err);
      setIsTrimming(false);
    }
  };

  if (!isOpen) return null;

  // Percentage calculations for overlay placement
  const startPercent = Math.min(100, Math.max(0, (startTime / effectiveDuration) * 100));
  const endPercent = Math.min(100, Math.max(0, (endTime / effectiveDuration) * 100));
  const widthPercent = Math.max(0, endPercent - startPercent);
  const playheadPercent = Math.min(100, Math.max(0, (currentPlayhead / effectiveDuration) * 100));

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
          className="relative w-full max-w-xl rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-5 shadow-2xl text-[var(--text-main)] backdrop-blur-3xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
            <div className="flex items-center space-x-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl p-[1px] shadow-sm"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[var(--bg-base)]">
                  <Scissors className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Direct Waveform Trimmer</h3>
                  <span
                    className="rounded-full px-2 py-0.2 text-[9px] font-mono font-semibold"
                    style={{
                      backgroundColor: "var(--accent-glow)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    DAW Visual Cut
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Drag boundary handles directly on the waveform to trim audio with anti-click crossfades.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isTrimming}
              className="text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/10 rounded-lg transition cursor-pointer p-1.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Direct Waveform Trimming Canvas Card */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 shadow-inner">
            {/* Header info bar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Music className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                <span className="font-semibold text-[var(--text-main)]">Audition Waveform</span>
                <span className="text-[10px] text-[var(--text-faint)] font-mono">
                  (Click & drag on wave to select region)
                </span>
              </div>
              <div className="font-mono text-xs text-[var(--text-muted)] space-x-1">
                <span className="font-bold text-[var(--text-main)]">{currentPlayhead.toFixed(2)}s</span>
                <span className="text-[var(--text-faint)]">/</span>
                <span>{effectiveDuration.toFixed(2)}s</span>
              </div>
            </div>

            {/* Direct Interactive Waveform Track Container */}
            <div
              ref={waveformWrapperRef}
              onMouseDown={handleWaveformMouseDown}
              className="relative w-full h-20 rounded-xl bg-black/20 dark:bg-black/40 border border-white/[0.08] overflow-hidden cursor-crosshair select-none"
            >
              {/* 1. Underlying WaveSurfer Canvas */}
              <div
                ref={containerRef}
                className="absolute inset-0 z-0 pointer-events-none flex items-center px-1"
              />

              {/* 2. Left Dimmed Cut Area */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-black/60 z-10 pointer-events-none transition-all duration-75"
                style={{ width: `${startPercent}%` }}
              >
                <div className="h-full w-full opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
              </div>

              {/* 3. Kept Region Window (Active Shaded Box) */}
              <div
                className="absolute top-0 bottom-0 z-15 border-t-2 border-b-2 transition-all duration-75 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: "var(--accent-glow)",
                  borderColor: "var(--accent-primary)",
                  boxShadow: "0 0 16px var(--accent-glow)",
                }}
                title="Drag to shift trim window"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  dragAnchorRef.current = {
                    clientX: e.clientX,
                    initialStart: startTime,
                    initialEnd: endTime,
                  };
                  setDraggingTarget("window");
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <GripVertical className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>

              {/* 4. Right Dimmed Cut Area */}
              <div
                className="absolute top-0 bottom-0 right-0 bg-black/60 z-10 pointer-events-none transition-all duration-75"
                style={{ left: `${endPercent}%` }}
              >
                <div className="h-full w-full opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
              </div>

              {/* 5. Left Start Marker Handle (Draggable) */}
              <div
                className="absolute top-0 bottom-0 z-20 flex flex-col items-center justify-between cursor-ew-resize group"
                style={{ left: `${startPercent}%`, transform: "translateX(-50%)" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingTarget("start");
                }}
              >
                {/* Top Badge */}
                <div
                  className="rounded-md border px-1.5 py-0.2 font-mono text-[9px] font-bold text-white shadow-md transition group-hover:scale-110"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    borderColor: "white",
                  }}
                >
                  ◀ {startTime.toFixed(2)}s
                </div>
                {/* Vertical Bar */}
                <div className="w-1 flex-1 bg-[var(--accent-primary)] shadow-md group-hover:w-1.5 transition" />
                {/* Bottom Handle */}
                <div className="h-2 w-3 rounded-t-sm bg-white shadow-sm" />
              </div>

              {/* 6. Right End Marker Handle (Draggable) */}
              <div
                className="absolute top-0 bottom-0 z-20 flex flex-col items-center justify-between cursor-ew-resize group"
                style={{ left: `${endPercent}%`, transform: "translateX(-50%)" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingTarget("end");
                }}
              >
                {/* Top Badge */}
                <div
                  className="rounded-md border px-1.5 py-0.2 font-mono text-[9px] font-bold text-white shadow-md transition group-hover:scale-110"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    borderColor: "white",
                  }}
                >
                  {endTime.toFixed(2)}s ▶
                </div>
                {/* Vertical Bar */}
                <div className="w-1 flex-1 bg-[var(--accent-primary)] shadow-md group-hover:w-1.5 transition" />
                {/* Bottom Handle */}
                <div className="h-2 w-3 rounded-t-sm bg-white shadow-sm" />
              </div>

              {/* 7. Live Playhead Indicator */}
              <div
                className="absolute top-0 bottom-0 z-25 w-0.5 bg-white shadow-lg pointer-events-none"
                style={{ left: `${playheadPercent}%` }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white -translate-x-[2px] shadow-sm" />
              </div>
            </div>

            {/* Direct Waveform Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-2">
                {/* Audition Play/Pause Button */}
                <motion.button
                  {...buttonSubtleTapMotion}
                  onClick={handleAudition}
                  className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:border-[var(--accent-primary)] cursor-pointer"
                  style={{
                    color: isPlayingAudition ? "var(--accent-primary)" : "var(--text-main)",
                  }}
                >
                  {isPlayingAudition ? (
                    <>
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      <span>Audition Cut</span>
                    </>
                  )}
                </motion.button>

                {/* Loop Toggle */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`flex items-center space-x-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    isLooping
                      ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--accent-primary)] font-semibold"
                      : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                  title="Loop playback inside the trimmed selection"
                >
                  <Repeat className="h-3 w-3" />
                  <span>Loop</span>
                </button>

                {/* Smart Snap to Silence */}
                <button
                  onClick={handleAutoSnapSilence}
                  className="flex items-center space-x-1 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-main)] transition cursor-pointer"
                  title="Auto-detect active audio and snap boundaries to remove silence"
                >
                  <Zap className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
                  <span>Auto-Snap Silence</span>
                </button>
              </div>

              {/* Trimmed Length Badge */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">Trimmed Take:</span>
                <span
                  className="font-mono text-xs font-bold rounded-lg px-2 py-0.5 border shadow-sm"
                  style={{
                    backgroundColor: "var(--accent-glow)",
                    borderColor: "var(--accent-primary)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {trimmedDuration.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* Precision Boundaries & Nudge Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Boundary Card */}
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-muted)]">In-Point (Start)</span>
                <button
                  onClick={handleSetStartToPlayhead}
                  className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  [◀ At Playhead]
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleNudge("start", -0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.8 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => handleNudge("start", 0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.8 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    +0.1s
                  </button>
                </div>
                <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">
                  {startTime.toFixed(2)}s
                </span>
              </div>
            </div>

            {/* End Boundary Card */}
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-muted)]">Out-Point (End)</span>
                <button
                  onClick={handleSetEndToPlayhead}
                  className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  [At Playhead ▶]
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleNudge("end", -0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.8 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => handleNudge("end", 0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.8 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    +0.1s
                  </button>
                </div>
                <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">
                  {endTime.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* Anti-Click Crossfades & Save Options */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Save As New Take & Reset Checkbox */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveAsNewTake"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="rounded border-[var(--glass-border)] accent-[var(--accent-primary)] cursor-pointer"
              />
              <label htmlFor="saveAsNewTake" className="text-xs text-[var(--text-muted)] cursor-pointer">
                Save as new take in project takes history
              </label>
            </div>

            <button
              onClick={handleResetBoundaries}
              className="text-[11px] text-[var(--text-faint)] hover:text-[var(--text-main)] transition cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Boundaries</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[var(--glass-border)]">
            <button
              onClick={onClose}
              disabled={isTrimming}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>

            <motion.button
              {...buttonTapMotion}
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
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
