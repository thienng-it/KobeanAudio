"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Folder,
  HardDrive,
  Sparkles,
  Music,
  FolderOpen,
  ExternalLink,
  Play,
  Check,
  Compass,
} from "lucide-react";
import {
  exportAudio,
  pickNativeFolder,
  revealInFinder,
  validateTargetDirectory,
} from "@/lib/api";
import { useProjectStore } from "@/stores/projectStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useAudioFilesStore } from "@/stores/audioFilesStore";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  generationId?: string;
}

const DIRECTORY_PRESETS = [
  { label: "Downloads", path: "~/Downloads", icon: Download },
  { label: "Desktop", path: "~/Desktop", icon: Folder },
  { label: "Music", path: "~/Music", icon: Music },
  { label: "Studio Output", path: "./audio_output", icon: HardDrive },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  generationId,
}) => {
  const [format, setFormat] = useState<"wav" | "mp3" | "flac" | "ogg" | "m4a">("mp3");
  const [bitrate, setBitrate] = useState<number>(320);
  const [normalizeLufs, setNormalizeLufs] = useState<boolean>(true);
  const [customName, setCustomName] = useState("");
  const [selectedDir, setSelectedDir] = useState("~/Downloads");
  const [resolvedPathPreview, setResolvedPathPreview] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedOnDiskPath, setSavedOnDiskPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  const { generations, textContent } = useProjectStore();
  const { audioUrl, setAudioUrl, setIsPlaying } = usePlayerStore();
  const { loadAudioFiles, addCustomDirectory, setLastExportedPath } = useAudioFilesStore();

  // Fresh reset every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setDownloadUrl(null);
      setSavedOnDiskPath(null);
      setError(null);
      setIsExporting(false);

      // Generate a clean file slug from current script text
      const cleanSnippet = textContent
        .replace(/#.*|\[.*?\]|Speaker\s*\d*\s*[-—]\s*[^:]+:/gi, "")
        .trim()
        .split("\n")[0]
        .slice(0, 24)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      setCustomName(cleanSnippet || "kobean-master");
    }
  }, [isOpen, generationId, audioUrl, textContent]);

  // Validate directory preview
  useEffect(() => {
    let active = true;
    if (selectedDir) {
      validateTargetDirectory(selectedDir).then((res) => {
        if (active && res.valid && res.resolved_path) {
          setResolvedPathPreview(res.resolved_path);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [selectedDir]);

  const handleClose = () => {
    setDownloadUrl(null);
    setSavedOnDiskPath(null);
    setError(null);
    setIsExporting(false);
    onClose();
  };

  const handlePickNativeFolder = async () => {
    setIsPickingFolder(true);
    try {
      const res = await pickNativeFolder();
      if (res && res.status === "selected" && res.path) {
        setSelectedDir(res.path);
        addCustomDirectory(res.path);
      }
    } catch {
      // Ignored
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleExport = async () => {
    const targetGenId =
      generationId ||
      generations.find((g) => (g.audio_url || g.audioUrl) === audioUrl)?.id ||
      generations[0]?.id ||
      (audioUrl ? audioUrl.split("/").pop() : "latest");

    setIsExporting(true);
    setError(null);
    try {
      const res = await exportAudio({
        generationId: targetGenId || "latest",
        format,
        bitrate,
        normalizeLufs: normalizeLufs ? -16.0 : undefined,
        fileName: customName ? `${customName}.${format}` : undefined,
        targetDirectory: selectedDir || undefined,
      });

      const fullUrl = res.downloadUrl.startsWith("http")
        ? res.downloadUrl
        : `http://127.0.0.1:8000${res.downloadUrl}`;

      setDownloadUrl(fullUrl);
      if (res.savedPath) {
        setSavedOnDiskPath(res.savedPath);
        setLastExportedPath(res.savedPath);
      }

      // Automatically refresh the Audio Files Explorer sidebar
      loadAudioFiles();
    } catch (e: any) {
      setError(e.message || "Failed to export audio");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRevealInFinder = async () => {
    if (savedOnDiskPath) {
      await revealInFinder({ path: savedOnDiskPath });
    }
  };

  const handlePreviewExportedAudio = () => {
    if (downloadUrl) {
      setAudioUrl(downloadUrl);
      setIsPlaying(true);
    }
  };

  const handleNativeSaveAs = async () => {
    if (!downloadUrl) return;
    const exportFileName = customName ? `${customName}.${format}` : `kobean_master.${format}`;

    // Standard download fallback
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = exportFileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentFilename = customName ? `${customName}.${format}` : `kobean_master.${format}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="export-dialog-overlay"
          {...modalMotion.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          {/* Modal Container */}
          <motion.div
            key="export-dialog-card"
            {...modalMotion.card}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-5 shadow-2xl space-y-4 text-[var(--text-main)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 shadow-sm"
                  style={{
                    backgroundColor: "var(--accent-glow)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-main)]">
                    Export Studio Master
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    DSP normalization & custom directory export
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Destination Directory Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] flex items-center space-x-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  <span>Target Destination Directory</span>
                </label>
                <button
                  onClick={handlePickNativeFolder}
                  disabled={isPickingFolder}
                  className="flex items-center space-x-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline transition"
                  title="Open macOS Folder Picker"
                >
                  <Compass className="h-3 w-3" />
                  <span>{isPickingFolder ? "Opening Dialog..." : "Browse Folder..."}</span>
                </button>
              </div>

              {/* Quick Destination Chips */}
              <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-black/20 p-1 border border-white/[0.06]">
                {DIRECTORY_PRESETS.map((dir) => {
                  const isSelected = selectedDir === dir.path;
                  const Icon = dir.icon;
                  return (
                    <button
                      key={dir.path}
                      onClick={() => setSelectedDir(dir.path)}
                      className={`flex flex-col items-center justify-center rounded-lg py-1.5 px-1 text-[11px] transition ${
                        isSelected
                          ? "font-semibold shadow-sm border border-white/20"
                          : "text-[var(--text-faint)] hover:bg-white/5 hover:text-[var(--text-main)]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? "var(--accent-primary)" : undefined,
                        color: isSelected ? "#FFFFFF" : undefined,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 mb-1" />
                      <span>{dir.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Path Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. /Users/username/Desktop/Podcasts or ~/Music/Master"
                  value={selectedDir}
                  onChange={(e) => setSelectedDir(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-black/20 px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-white/30 focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              {/* Resolved Target Path Preview */}
              {resolvedPathPreview && (
                <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-muted)] font-mono truncate px-1">
                  <span className="text-[var(--accent-primary)]">📄 Target:</span>
                  <span className="truncate">{resolvedPathPreview}/{currentFilename}</span>
                </div>
              )}
            </div>

            {/* Audio Codec & Bitrate */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)]">
                Audio Codec Format
              </label>
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-black/20 p-1 border border-white/[0.06]">
                {(["wav", "mp3", "flac", "ogg", "m4a"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setFormat(fmt);
                      setDownloadUrl(null);
                      setSavedOnDiskPath(null);
                    }}
                    className={`rounded-lg py-1.5 text-xs font-bold uppercase transition ${
                      format === fmt
                        ? "shadow-sm border border-white/20"
                        : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
                    }`}
                    style={{
                      backgroundColor: format === fmt ? "var(--accent-primary)" : undefined,
                      color: format === fmt ? "#FFFFFF" : undefined,
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* MP3 Bitrate */}
            {format === "mp3" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-main)]">
                  Bitrate Quality
                </label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-black/20 px-3 py-1.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  <option value={320}>320 kbps (Studio Master · Crystal Clear)</option>
                  <option value={256}>256 kbps (High Quality)</option>
                  <option value={192}>192 kbps (Standard Broadcast)</option>
                  <option value={128}>128 kbps (Compact)</option>
                </select>
              </div>
            )}

            {/* Broadcast LUFS Checkbox */}
            <div className="flex items-center space-x-2 rounded-xl border border-white/[0.06] bg-black/20 p-2.5">
              <input
                type="checkbox"
                id="export-lufs"
                checked={normalizeLufs}
                onChange={(e) => setNormalizeLufs(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10"
                style={{ accentColor: "var(--accent-primary)" }}
              />
              <label htmlFor="export-lufs" className="text-xs text-[var(--text-muted)] cursor-pointer">
                Normalize loudness to <span className="font-semibold text-[var(--accent-primary)]">-16 LUFS</span> (Podcast / Spotify Standard)
              </label>
            </div>

            {/* Custom Filename */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-main)]">
                File Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. podcast-episode-1"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-xl border border-[var(--glass-border)] bg-black/20 px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-white/30 focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Post-Export Success Actions */}
            {downloadUrl && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-center space-y-2 backdrop-blur-md"
              >
                <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Master Exported & Added to Studio Explorer!</span>
                </div>
                {savedOnDiskPath && (
                  <p className="text-[10px] text-emerald-300/80 font-mono break-all line-clamp-2">
                    📁 {savedOnDiskPath}
                  </p>
                )}

                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button
                    onClick={handleRevealInFinder}
                    className="flex items-center space-x-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Reveal in Finder</span>
                  </button>

                  <button
                    onClick={handlePreviewExportedAudio}
                    className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    <Play className="h-3 w-3" />
                    <span>Preview Track</span>
                  </button>

                  <button
                    onClick={handleNativeSaveAs}
                    className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={handleClose}
                className="rounded-xl px-4 py-1.5 text-xs font-medium text-[var(--text-faint)] hover:bg-white/5 hover:text-[var(--text-main)] transition cursor-pointer"
              >
                Close
              </button>
              {!downloadUrl && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center space-x-1.5 rounded-xl px-5 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 cursor-pointer shadow-md"
                  style={{
                    backgroundImage: "var(--accent-gradient)",
                    boxShadow: "0 0 16px var(--accent-glow)",
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isExporting ? "Processing DSP..." : "Process & Export"}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
