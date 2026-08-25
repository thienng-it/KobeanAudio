"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  ArrowLeftToLine,
  ArrowRightToLine,
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
  const [isWaveformReady, setIsWaveformReady] = useState(false);

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

  // WaveSurfer initialization for high-fidelity waveform rendering
  useEffect(() => {
    if (!isOpen || !containerRef.current || !audioUrl) return;

    setIsWaveformReady(false);

    const accentColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-primary")
        .trim() || "#FF6B4A";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255, 255, 255, 0.4)",
      progressColor: accentColor,
      cursorColor: "#FFFFFF",
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 96,
      normalize: true,
    });

    wavesurferRef.current = ws;
    ws.load(audioUrl);

    ws.on("ready", () => {
      setIsWaveformReady(true);
      const actualDur = ws.getDuration();
      if (actualDur > 0 && (!duration || duration <= 0)) {
        setEndTime(actualDur);
      }
    });

    ws.on("timeupdate", (t) => {
      setCurrentPlayhead(t);
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
      setIsWaveformReady(false);
    };
  }, [isOpen, audioUrl, endTime, startTime, isLooping, duration]);

  // Convert mouse clientX to audio seconds
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

  // Waveform track mouse down interaction
  const handleWaveformMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickTime = getTimeFromClientX(e.clientX);
    const tolerance = 0.03 * effectiveDuration || 0.2;

    if (Math.abs(clickTime - startTime) <= tolerance) {
      setDraggingTarget("start");
      return;
    }
    if (Math.abs(clickTime - endTime) <= tolerance) {
      setDraggingTarget("end");
      return;
    }

    if (clickTime > startTime && clickTime < endTime) {
      dragAnchorRef.current = {
        clientX: e.clientX,
        initialStart: startTime,
        initialEnd: endTime,
      };
      setDraggingTarget("window");
      return;
    }

    dragAnchorRef.current = {
      clientX: e.clientX,
      initialStart: clickTime,
      initialEnd: clickTime,
    };
    setStartTime(clickTime);
    setEndTime(Math.min(effectiveDuration, clickTime + 0.2));
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
      const threshold = 0.015;

      let startSample = 0;
      for (let i = 0; i < rawData.length; i++) {
        if (Math.abs(rawData[i]) > threshold) {
          startSample = Math.max(0, i - Math.floor(sampleRate * 0.05));
          break;
        }
      }

      let endSample = rawData.length - 1;
      for (let i = rawData.length - 1; i >= 0; i--) {
        if (Math.abs(rawData[i]) > threshold) {
          endSample = Math.min(rawData.length - 1, i + Math.floor(sampleRate * 0.05));
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

  // Generate ruler tick marks
  const rulerTicks = useMemo(() => {
    const ticks: { time: number; percent: number; label: string }[] = [];
    const step = effectiveDuration > 30 ? 5 : effectiveDuration > 10 ? 2 : 1;
    for (let t = 0; t <= effectiveDuration; t += step) {
      ticks.push({
        time: t,
        percent: (t / effectiveDuration) * 100,
        label: `${t}s`,
      });
    }
    return ticks;
  }, [effectiveDuration]);

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none"
      >
        <motion.div
          {...modalMotion.card}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-6 shadow-2xl text-[var(--text-main)] backdrop-blur-3xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--glass-border)]">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl p-[1px] shadow-sm"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[var(--bg-base)]">
                  <Scissors className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold tracking-tight text-[var(--text-main)]">
                    Precision Waveform Trimmer
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--accent-glow)",
                      color: "var(--accent-primary)",
                      border: "1px solid var(--accent-primary)",
                    }}
                  >
                    DAW Visual Cut
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Drag the luminous boundary handles directly on the waveform to slice audio seamlessly.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isTrimming}
              className="text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/10 rounded-xl transition cursor-pointer p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Direct Waveform Trimming Studio Canvas */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-base)] p-4 space-y-3 shadow-inner">
            {/* Top Toolbar with Timing and Auto-Snap */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Music className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                <span className="font-semibold text-[var(--text-main)]">Interactive Audio Waveform</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="text-[var(--text-faint)]">Playhead:</span>
                <span className="font-bold text-[var(--accent-primary)]">{currentPlayhead.toFixed(2)}s</span>
                <span className="text-[var(--text-faint)]">/</span>
                <span className="text-[var(--text-muted)]">{effectiveDuration.toFixed(2)}s</span>
              </div>
            </div>

            {/* Time Ruler */}
            <div className="relative h-4 w-full select-none px-1 overflow-hidden">
              {rulerTicks.map((tick) => (
                <div
                  key={tick.time}
                  className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${tick.percent}%` }}
                >
                  <span className="font-mono text-[9px] text-[var(--text-faint)]">{tick.label}</span>
                  <span className="h-1 w-px bg-white/20 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Interactive Waveform Track Container */}
            <div className="relative pt-6 pb-2">
              <div
                ref={waveformWrapperRef}
                onMouseDown={handleWaveformMouseDown}
                className="relative w-full h-28 rounded-2xl bg-black/40 border border-white/[0.1] overflow-hidden cursor-crosshair select-none shadow-inner"
              >
                {/* 1. Underlying WaveSurfer Canvas (Always fully visible!) */}
                <div
                  ref={containerRef}
                  className="absolute inset-0 z-0 pointer-events-none flex items-center px-2"
                />

                {/* 2. Left Dimmed Cut Zone */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-black/65 backdrop-blur-[1px] z-10 pointer-events-none border-r border-white/20 transition-all duration-75"
                  style={{ width: `${startPercent}%` }}
                >
                  <div className="h-full w-full opacity-20 bg-[linear-gradient(45deg,#ffffff_25%,transparent_25%,transparent_50%,#ffffff_50%,#ffffff_75%,transparent_75%,transparent)] [background-size:12px_12px]" />
                </div>

                {/* 3. Kept Region Window (Crystal Clear Glow Frame) */}
                <div
                  className="absolute top-0 bottom-0 z-15 border-y-2 transition-all duration-75 cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: "rgba(255, 107, 74, 0.08)",
                    borderColor: "var(--accent-primary)",
                    boxShadow: "inset 0 0 20px var(--accent-glow)",
                  }}
                  title="Drag region to slide trim window"
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
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <GripVertical className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                </div>

                {/* 4. Right Dimmed Cut Zone */}
                <div
                  className="absolute top-0 bottom-0 right-0 bg-black/65 backdrop-blur-[1px] z-10 pointer-events-none border-l border-white/20 transition-all duration-75"
                  style={{ left: `${endPercent}%` }}
                >
                  <div className="h-full w-full opacity-20 bg-[linear-gradient(45deg,#ffffff_25%,transparent_25%,transparent_50%,#ffffff_50%,#ffffff_75%,transparent_75%,transparent)] [background-size:12px_12px]" />
                </div>

                {/* 5. Left In-Point Handle (Neon Needle + Rounded Grip) */}
                <div
                  className="absolute top-0 bottom-0 z-20 flex flex-col items-center justify-between cursor-col-resize group"
                  style={{ left: `${startPercent}%`, transform: "translateX(-50%)" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTarget("start");
                  }}
                >
                  <div className="w-1.5 flex-1 bg-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)] group-hover:w-2 transition rounded-full" />
                  <div className="h-3.5 w-3.5 rounded-full bg-white border-2 border-[var(--accent-primary)] shadow-md -translate-y-1 group-hover:scale-125 transition" />
                </div>

                {/* 6. Right Out-Point Handle (Neon Needle + Rounded Grip) */}
                <div
                  className="absolute top-0 bottom-0 z-20 flex flex-col items-center justify-between cursor-col-resize group"
                  style={{ left: `${endPercent}%`, transform: "translateX(-50%)" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTarget("end");
                  }}
                >
                  <div className="w-1.5 flex-1 bg-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)] group-hover:w-2 transition rounded-full" />
                  <div className="h-3.5 w-3.5 rounded-full bg-white border-2 border-[var(--accent-primary)] shadow-md -translate-y-1 group-hover:scale-125 transition" />
                </div>

                {/* 7. Live Playhead Indicator */}
                <div
                  className="absolute top-0 bottom-0 z-25 w-0.5 bg-white shadow-[0_0_8px_white] pointer-events-none"
                  style={{ left: `${playheadPercent}%` }}
                >
                  <div className="h-2 w-2 rounded-full bg-white -translate-x-[3px] shadow-md" />
                </div>
              </div>

              {/* Floating Boundary Badges positioned gracefully ABOVE the track */}
              <div
                className="absolute top-0 z-30 pointer-events-none flex items-center justify-center -translate-x-1/2"
                style={{ left: `${startPercent}%` }}
              >
                <span className="rounded-full border border-white/20 bg-[var(--bg-surface-elevated)] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--accent-primary)] shadow-lg backdrop-blur-md">
                  ◀ In: {startTime.toFixed(2)}s
                </span>
              </div>

              <div
                className="absolute top-0 z-30 pointer-events-none flex items-center justify-center -translate-x-1/2"
                style={{ left: `${endPercent}%` }}
              >
                <span className="rounded-full border border-white/20 bg-[var(--bg-surface-elevated)] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--accent-primary)] shadow-lg backdrop-blur-md">
                  Out: {endTime.toFixed(2)}s ▶
                </span>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center space-x-2">
                {/* Audition Cut Button */}
                <motion.button
                  {...buttonTapMotion}
                  onClick={handleAudition}
                  className="flex items-center space-x-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold text-white shadow-md transition cursor-pointer"
                  style={{
                    backgroundImage: "var(--accent-gradient)",
                    boxShadow: "0 0 16px var(--accent-glow)",
                  }}
                >
                  {isPlayingAudition ? (
                    <>
                      <Pause className="h-3.5 w-3.5 fill-current" />
                      <span>Pause Cut</span>
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
                  className={`flex items-center space-x-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    isLooping
                      ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--accent-primary)] font-semibold shadow-sm"
                      : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                  title="Loop playback continuously between In and Out points"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Loop</span>
                </button>

                {/* Smart Snap Silence */}
                <button
                  onClick={handleAutoSnapSilence}
                  className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-main)] transition cursor-pointer"
                  title="Automatically snap In and Out boundaries to active vocal speech"
                >
                  <Zap className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                  <span>Auto-Snap Silence</span>
                </button>
              </div>

              {/* Trimmed Duration Pill */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-[var(--text-faint)] font-medium">Selected Duration:</span>
                <span
                  className="font-mono text-xs font-bold rounded-xl px-3 py-1 border shadow-sm"
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
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-muted)]">In-Point (Start)</span>
                <button
                  onClick={handleSetStartToPlayhead}
                  className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeftToLine className="h-3 w-3" />
                  <span>Set at Playhead</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleNudge("start", -0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => handleNudge("start", 0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    +0.1s
                  </button>
                </div>
                <span className="font-mono text-base font-bold text-[var(--accent-primary)]">
                  {startTime.toFixed(2)}s
                </span>
              </div>
            </div>

            {/* End Boundary Card */}
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-muted)]">Out-Point (End)</span>
                <button
                  onClick={handleSetEndToPlayhead}
                  className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <span>Set at Playhead</span>
                  <ArrowRightToLine className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleNudge("end", -0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => handleNudge("end", 0.1)}
                    className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    +0.1s
                  </button>
                </div>
                <span className="font-mono text-base font-bold text-[var(--accent-primary)]">
                  {endTime.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* Fade Settings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Fade In */}
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Fade In (Head Crossfade)</label>
              <select
                value={fadeInMs}
                onChange={(e) => setFadeInMs(parseInt(e.target.value))}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none"
              >
                {FADE_PRESETS.map((p) => (
                  <option key={p.label} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fade Out */}
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Fade Out (Tail Crossfade)</label>
              <select
                value={fadeOutMs}
                onChange={(e) => setFadeOutMs(parseInt(e.target.value))}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none"
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
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                id="saveAsNewTake"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="rounded border-[var(--glass-border)] accent-[var(--accent-primary)] cursor-pointer"
              />
              <span>Save as new take in project history</span>
            </label>

            <button
              onClick={handleResetBoundaries}
              className="text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] transition cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Boundaries</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--glass-border)]">
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
