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
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface AudioPlayerProps {
  onOpenExport: () => void;
  onOpenTrim?: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  onOpenExport,
  onOpenTrim,
  onGenerate,
  isGenerating,
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
    <div className="liquid-glass-dock flex h-21 w-full items-center justify-between px-6 border-t border-[var(--glass-border)] shadow-2xl transition-all">
      {/* Left: Primary Synthesize / Playback Action Button */}
      <div className="flex items-center space-x-3">
        <motion.button
          {...buttonTapMotion}
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className="relative flex items-center space-x-2.5 rounded-xl border border-white/20 px-5 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
          style={{
            backgroundImage: canGenerate && !isGenerating ? "var(--accent-gradient)" : undefined,
            boxShadow: canGenerate && !isGenerating ? "0 0 20px var(--accent-glow)" : undefined,
            backgroundColor: !canGenerate || isGenerating ? "rgba(255,255,255,0.08)" : undefined,
          }}
        >
          {isGenerating ? (
            <>
              <SpinnerIcon className="h-4 w-4 animate-spin text-white" />
              <span>Synthesizing Voice...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-white" />
              <span>Generate Audio</span>
              <kbd className="hidden md:inline rounded bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-white/80">
                ⌘↵
              </kbd>
            </>
          )}
        </motion.button>

        {/* Live Audio Equalizer Meter */}
        <div className="hidden sm:flex items-center space-x-1 h-5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
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
      <div className="flex flex-1 max-w-2xl mx-6 items-center space-x-4">
        {/* Skip Backwards */}
        <button
          onClick={() => seekRelative(-5)}
          disabled={!audioUrl}
          className="rounded-xl p-2 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] disabled:opacity-20 transition"
          title="Skip back 5s"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Primary Play / Pause Button with Prominent Accent Theme Glow */}
        <motion.button
          whileHover={{ scale: audioUrl ? 1.08 : 1 }}
          whileTap={{ scale: audioUrl ? 0.92 : 1 }}
          onClick={togglePlay}
          disabled={!audioUrl}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-xl transition disabled:opacity-30 cursor-pointer"
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
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </motion.button>

        {/* Skip Forwards */}
        <button
          onClick={() => seekRelative(5)}
          disabled={!audioUrl}
          className="rounded-xl p-2 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] disabled:opacity-20 transition"
          title="Skip forward 5s"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        {/* Waveform Display Container */}
        <div className="relative flex-1 h-13 rounded-2xl bg-black/25 border border-white/[0.08] px-3 flex items-center shadow-inner overflow-hidden">
          <div ref={containerRef} className="w-full relative z-10" />

          {/* Idle Placeholder */}
          {!audioUrl && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center space-x-2 text-xs text-[var(--text-faint)] font-medium">
              <AudioWaveform className="h-4 w-4 opacity-50" />
              <span>Ready for Audio Generation · Press ⌘↵</span>
            </div>
          )}

          {/* Generating Shimmer Indicator */}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center space-x-2 bg-[var(--accent-primary)]/10 text-xs text-[var(--accent-primary)] font-medium animate-pulse">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              <span>Streaming neural audio synthesis...</span>
            </div>
          )}
        </div>

        {/* High-Precision Studio Timecode */}
        <div className="font-mono text-xs shrink-0 w-24 text-right space-x-0.5">
          <span className="font-semibold text-[var(--text-main)]">{formatTime(currentTime)}</span>
          <span className="text-[var(--text-faint)]"> / </span>
          <span className="text-[var(--text-muted)]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Playback Speed, Volume & Master Export */}
      <div className="flex items-center space-x-3.5">
        {/* Speed presets */}
        <div className="hidden xl:flex items-center rounded-xl bg-black/10 dark:bg-white/[0.04] p-0.5 border border-[var(--glass-border)] backdrop-blur-md">
          {[0.8, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-mono transition cursor-pointer ${
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
        <div className="hidden md:flex items-center space-x-2">
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
            className="w-14"
          />
        </div>

        {/* Trim Audio Button */}
        {onOpenTrim && (
          <motion.button
            {...buttonTapMotion}
            onClick={onOpenTrim}
            disabled={!audioUrl}
            className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-secondary)] disabled:opacity-30 cursor-pointer"
            title="Trim & Cut Audio Take (✂️)"
          >
            <Scissors className="h-3.5 w-3.5" style={{ color: "var(--accent-secondary)" }} />
            <span className="hidden sm:inline">Trim</span>
          </motion.button>
        )}

        {/* Master Export Button */}
        <motion.button
          {...buttonTapMotion}
          onClick={onOpenExport}
          disabled={!audioUrl}
          className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-primary)] disabled:opacity-30 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
          <span>Export Master</span>
        </motion.button>
      </div>

    </div>
  );
};
