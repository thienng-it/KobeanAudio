"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Scissors,
  Sparkles,
  RotateCw as SpinnerIcon,
  AudioWaveform,
  CheckCircle2,
  SlidersHorizontal,
  Sliders,
  Settings2,
  Square,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { dropdownMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface AudioPlayerProps {
  onOpenExport: () => void;
  onOpenTrim?: () => void;
  onGenerate: () => void;
  onStop?: () => void;
  isGenerating: boolean;
  progress?: { percent: number; message: string } | null;
  canGenerate: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  onOpenExport,
  onOpenTrim,
  onGenerate,
  onStop,
  isGenerating,
  progress,
  canGenerate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const {
    audioUrl,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    isMuted,
    toggleMute,
  } = usePlayerStore();

  // Initialize WaveSurfer with dynamic theme variables
  useEffect(() => {
    if (!containerRef.current) return;

    const accentColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-primary")
        .trim() || "#38BDF8";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255, 255, 255, 0.18)",
      progressColor: accentColor,
      cursorColor: "#FFFFFF",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 3,
      height: 42,
      normalize: true,
    });

    wavesurferRef.current = ws;

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));
    ws.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      ws.seekTo(0);
    });

    ws.on("ready", (dur) => {
      setDuration(dur);
      // Auto-play when new audio is generated
      ws.play();
      setIsPlaying(true);
    });

    return () => {
      ws.destroy();
    };
  }, []);

  // Update waveform color when theme changes
  useEffect(() => {
    if (wavesurferRef.current) {
      const accentColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent-primary")
          .trim() || "#38BDF8";
      wavesurferRef.current.setOptions({
        progressColor: accentColor,
      });
    }
  }, [audioUrl]);

  // Load new audio URL
  useEffect(() => {
    if (wavesurferRef.current && audioUrl) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const [toolsPopoverOpen, setToolsPopoverOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close tools popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const seekRelative = (seconds: number) => {
    if (wavesurferRef.current && duration > 0) {
      const current = wavesurferRef.current.getCurrentTime();
      const newTime = Math.max(0, Math.min(duration, current + seconds));
      wavesurferRef.current.setTime(newTime);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVol);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="liquid-glass-dock relative flex h-20 sm:h-21 w-full items-center justify-between px-3 sm:px-5 gap-2 border-t border-[var(--glass-border)] shadow-2xl transition-all select-none overflow-visible">
      {/* Left: Primary Synthesize / Stop Action Button */}
      <div className="flex items-center space-x-2 shrink-0">
        {isGenerating ? (
          <motion.button
            {...buttonTapMotion}
            onClick={onStop}
            className="relative flex items-center space-x-1.5 sm:space-x-2 rounded-xl border border-rose-500/50 bg-rose-500/20 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-rose-300 shadow-xl shadow-rose-950/40 backdrop-blur-xl transition hover:bg-rose-500/30 hover:border-rose-400 hover:text-white cursor-pointer shrink-0"
            title="Cancel / Stop audio synthesis"
          >
            <Square className="h-3.5 w-3.5 fill-current text-rose-400 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Stop Synthesis</span>
            <span className="sm:hidden text-[11px] whitespace-nowrap">Stop</span>
          </motion.button>
        ) : (
          <motion.button
            {...buttonTapMotion}
            onClick={onGenerate}
            disabled={!canGenerate}
            className="relative flex items-center space-x-2 rounded-xl border border-white/20 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl transition hover:opacity-90 disabled:opacity-30 cursor-pointer shrink-0"
            style={{
              backgroundImage: canGenerate ? "var(--accent-gradient)" : undefined,
              boxShadow: canGenerate ? "0 0 20px var(--accent-glow)" : undefined,
              backgroundColor: !canGenerate ? "rgba(255,255,255,0.08)" : undefined,
            }}
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Generate Audio</span>
            <span className="sm:hidden text-[11px] whitespace-nowrap">Generate</span>
            <kbd className="hidden lg:inline rounded bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-white/80">
              ⌘↵
            </kbd>
          </motion.button>
        )}

        {/* Live Audio Equalizer Meter */}
        <div className="hidden lg:flex items-center space-x-1 h-5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div
            className={`w-0.5 rounded-full transition-all ${
              isPlaying ? "eq-bar-1" : "h-1 bg-white/20"
            }`}
            style={{ backgroundColor: isPlaying ? "var(--accent-primary)" : undefined }}
          />
          <div
            className={`w-0.5 rounded-full transition-all ${
              isPlaying ? "eq-bar-2" : "h-1.5 bg-white/20"
            }`}
            style={{ backgroundColor: isPlaying ? "var(--accent-secondary)" : undefined }}
          />
          <div
            className={`w-0.5 rounded-full transition-all ${
              isPlaying ? "eq-bar-3" : "h-1 bg-white/20"
            }`}
            style={{ backgroundColor: isPlaying ? "var(--accent-primary)" : undefined }}
          />
          <div
            className={`w-0.5 rounded-full transition-all ${
              isPlaying ? "eq-bar-4" : "h-2 bg-white/20"
            }`}
            style={{ backgroundColor: isPlaying ? "var(--accent-secondary)" : undefined }}
          />
        </div>
      </div>

      {/* Center: Transport Controls & WaveSurfer Canvas */}
      <div className="flex flex-1 min-w-0 max-w-2xl mx-1 sm:mx-3 items-center space-x-1.5 sm:space-x-3">
        {/* Skip Backwards */}
        <button
          onClick={() => seekRelative(-5)}
          disabled={!audioUrl}
          className="hidden md:flex rounded-xl p-1.5 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] disabled:opacity-20 transition cursor-pointer shrink-0"
          title="Skip back 5s"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Primary Play / Pause Button */}
        <motion.button
          whileHover={{ scale: audioUrl ? 1.08 : 1 }}
          whileTap={{ scale: audioUrl ? 0.92 : 1 }}
          onClick={togglePlay}
          disabled={!audioUrl}
          className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full text-white shadow-xl transition disabled:opacity-30 cursor-pointer"
          style={{
            backgroundImage: audioUrl ? "var(--accent-gradient)" : undefined,
            backgroundColor: !audioUrl ? "rgba(255, 255, 255, 0.1)" : undefined,
            boxShadow: audioUrl
              ? "0 0 24px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.5)"
              : undefined,
          }}
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
          ) : (
            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
          )}
        </motion.button>

        {/* Skip Forwards */}
        <button
          onClick={() => seekRelative(5)}
          disabled={!audioUrl}
          className="hidden md:flex rounded-xl p-1.5 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] disabled:opacity-20 transition cursor-pointer shrink-0"
          title="Skip forward 5s"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        {/* Waveform Display Container */}
        <div
          onDoubleClick={() => {
            if (audioUrl && onOpenTrim) onOpenTrim();
          }}
          title={audioUrl ? "Click to seek · Double-click to open Direct Waveform Trimmer" : undefined}
          className="relative flex-1 min-w-[70px] sm:min-w-[130px] h-10 sm:h-13 rounded-2xl bg-black/25 border border-white/[0.08] px-2 sm:px-3 flex items-center shadow-inner overflow-hidden cursor-pointer"
        >
          <div ref={containerRef} className="w-full relative z-10" />

          {/* Idle Placeholder */}
          {!audioUrl && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center space-x-1.5 text-[11px] sm:text-xs text-[var(--text-faint)] font-medium px-2 overflow-hidden pointer-events-none select-none">
              <AudioWaveform className="h-3.5 w-3.5 opacity-50 shrink-0" />
              <span className="truncate whitespace-nowrap">Ready · ⌘↵</span>
            </div>
          )}

          {/* Generating Interactive Progress Bar */}
          {isGenerating && (
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-3 sm:px-4 bg-[var(--bg-surface-elevated)]/90 backdrop-blur-md pointer-events-none select-none">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-[var(--accent-primary)] mb-1 px-0.5">
                <span className="flex items-center gap-1.5 truncate">
                  <SpinnerIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin shrink-0" />
                  <span className="truncate">{progress?.message || "Synthesizing voice audio..."}</span>
                </span>
                <span className="font-mono font-bold shrink-0 ml-2">
                  {Math.round(progress?.percent || 20)}%
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden relative border border-white/[0.06]">
                <motion.div
                  initial={{ width: "12%" }}
                  animate={{ width: `${progress?.percent || 20}%` }}
                  transition={{ ease: "easeOut", duration: 0.35 }}
                  className="h-full rounded-full shadow-sm shadow-[var(--accent-primary)]/50"
                  style={{
                    backgroundImage: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                />
              </div>
            </div>
          )}
        </div>


        {/* High-Precision Studio Timecode */}
        <div className="font-mono text-[10px] sm:text-xs shrink-0 text-right space-x-0.5 whitespace-nowrap">
          <span className="font-semibold text-[var(--text-main)]">{formatTime(currentTime)}</span>
          <span className="text-[var(--text-faint)]">/</span>
          <span className="text-[var(--text-muted)]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Playback Speed, Volume & Master Export */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Speed presets */}
        <div className="hidden xl:flex items-center rounded-xl bg-black/10 dark:bg-white/[0.04] p-0.5 border border-[var(--glass-border)] backdrop-blur-md">
          {[0.8, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`rounded-lg px-1.5 py-0.5 text-[10px] font-mono transition cursor-pointer ${
                playbackRate === rate
                  ? "bg-white/[0.25] dark:bg-white/[0.16] text-[var(--text-main)] font-semibold shadow-sm border border-[var(--glass-border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="hidden lg:flex items-center space-x-1.5">
          <button
            onClick={toggleMute}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-12"
          />
        </div>

        {/* Trim Audio Button */}
        {onOpenTrim && (
          <motion.button
            {...buttonTapMotion}
            onClick={onOpenTrim}
            disabled={!audioUrl}
            className="flex items-center space-x-1 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-secondary)] disabled:opacity-30 cursor-pointer shrink-0"
            title="Trim & Cut Audio Take (✂️)"
          >
            <Scissors className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
            <span className="hidden sm:inline text-[11px]">Trim</span>
          </motion.button>
        )}

        {/* Compact & Overflow Audio Tools Popover Button (Visible only when window is tight) */}
        <div ref={toolsRef} className="relative shrink-0 xl:hidden">
          <motion.button
            {...buttonSubtleTapMotion}
            onClick={() => setToolsPopoverOpen(!toolsPopoverOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer shrink-0 ${
              toolsPopoverOpen
                ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-sm"
                : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text-main)]"
            }`}
            title="Audio Output, Speed & Volume Controls"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          </motion.button>

          <AnimatePresence>
            {toolsPopoverOpen && (
              <motion.div
                {...dropdownMotion}
                className="glass-popover absolute right-0 bottom-full mb-2 w-72 rounded-2xl p-3 z-50 text-[var(--text-main)] shadow-2xl space-y-3"
              >
                {/* Title */}
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  <span>Audio Playback & DSP</span>
                  <span className="font-mono text-[9px]" style={{ color: "var(--accent-primary)" }}>Studio Output</span>
                </div>

                {/* Master Volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] font-medium">Master Volume</span>
                    <span className="font-mono text-[11px] text-[var(--text-main)] font-semibold">
                      {isMuted ? "0% (Muted)" : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer p-1 rounded-lg hover:bg-white/10"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-red-400" />
                      ) : (
                        <Volume2 className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Playback Speed Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] font-medium">Playback Speed</span>
                    <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                      {playbackRate}x
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 rounded-xl bg-black/20 p-1 border border-[var(--glass-border)]">
                    {[0.8, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`rounded-lg py-1 text-[10px] font-mono font-semibold transition cursor-pointer text-center ${
                          playbackRate === rate
                            ? "text-white shadow-sm font-bold"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10"
                        }`}
                        style={{
                          backgroundColor: playbackRate === rate ? "var(--accent-primary)" : undefined,
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport Skip Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--glass-border)]">
                  <button
                    onClick={() => seekRelative(-5)}
                    disabled={!audioUrl}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Skip -5s</span>
                  </button>
                  <button
                    onClick={() => seekRelative(5)}
                    disabled={!audioUrl}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Skip +5s</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Master Export Button */}
        <motion.button
          {...buttonTapMotion}
          onClick={onOpenExport}
          disabled={!audioUrl}
          className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-primary)] disabled:opacity-30 cursor-pointer shrink-0"
        >
          <Download className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
          <span className="hidden md:inline text-[11px] whitespace-nowrap">Export Master</span>
          <span className="md:hidden text-[11px] whitespace-nowrap">Export</span>
        </motion.button>
      </div>
    </div>
  );
};
