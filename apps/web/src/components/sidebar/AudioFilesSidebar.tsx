"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  Music,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Download,
  FileAudio,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { AudioFileItem } from "@kobeanaudio/types";
import { useAudioFilesStore } from "@/stores/audioFilesStore";
import { usePlayerStore } from "@/stores/playerStore";

interface AudioFilesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport?: () => void;
}

export const AudioFilesSidebar: React.FC<AudioFilesSidebarProps> = ({
  isOpen,
  onClose,
  onOpenExport,
}) => {
  const {
    files,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    loadAudioFiles,
    removeAudioFile,
    revealInExplorer,
    pickCustomFolder,
    customDirectories,
  } = useAudioFilesStore();

  const { audioUrl, setAudioUrl, isPlaying, setIsPlaying } = usePlayerStore();

  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<{
    exports: boolean;
    takes: boolean;
    directories: boolean;
  }>({
    exports: true,
    takes: true,
    directories: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadAudioFiles();
    }
  }, [isOpen]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (selectedFilter === "exports" && !f.is_export) return false;
      if (selectedFilter === "takes" && f.is_export) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.format.toLowerCase().includes(q);
      }
      return true;
    });
  }, [files, selectedFilter, searchQuery]);

  const exportFiles = filteredFiles.filter((f) => f.is_export);
  const takeFiles = filteredFiles.filter((f) => !f.is_export);

  const handlePlayFile = (file: AudioFileItem) => {
    const targetUrl = file.audio_url.startsWith("http")
      ? file.audio_url
      : `http://127.0.0.1:8000${file.audio_url}`;

    if (audioUrl === targetUrl) {
      setIsPlaying(!isPlaying);
    } else {
      setAudioUrl(targetUrl);
      setIsPlaying(true);
    }
  };

  const handleCopyPath = (file: AudioFileItem) => {
    navigator.clipboard.writeText(file.path);
    setCopiedPathId(file.id);
    setTimeout(() => setCopiedPathId(null), 1800);
  };

  const handleDelete = async (file: AudioFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete '${file.name}' from disk?`)) {
      await removeAudioFile(file.filename);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="relative flex h-full w-72 flex-col border-r border-[var(--glass-border)] bg-[var(--bg-surface)] backdrop-blur-2xl transition-all select-none text-[var(--text-main)]">
      {/* Sidebar Header */}
      <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-3.5">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
            Audio Explorer
          </span>
          <span
            className="rounded-full px-1.5 py-0.2 text-[9px] font-mono border border-white/10"
            style={{ backgroundColor: "var(--accent-glow)", color: "var(--accent-primary)" }}
          >
            {files.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => loadAudioFiles()}
            disabled={isLoading}
            className="rounded-lg p-1 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] transition disabled:opacity-50"
            title="Refresh Audio Files (↻)"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] transition"
            title="Close Explorer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-2.5 border-b border-white/[0.04] space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search audio files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-black/20 py-1 pl-7 pr-2 text-xs text-[var(--text-main)] placeholder-white/30 focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1">
          {(["all", "exports", "takes"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`flex-1 rounded-md py-0.5 text-[10px] font-medium capitalize transition ${
                selectedFilter === filter
                  ? "bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/15"
                  : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Directory & File Tree Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Section 1: Master Exports */}
        {(selectedFilter === "all" || selectedFilter === "exports") && (
          <div className="space-y-1">
            <button
              onClick={() =>
                setExpandedSection((s) => ({ ...s, exports: !s.exports }))
              }
              className="flex w-full items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-main)]"
            >
              <div className="flex items-center space-x-1">
                {expandedSection.exports ? (
                  <ChevronDown className="h-3 w-3 text-[var(--accent-primary)]" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
                )}
                <span>Master Exports ({exportFiles.length})</span>
              </div>
              {onOpenExport && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenExport();
                  }}
                  className="text-[var(--accent-primary)] hover:underline normal-case font-normal text-[10px]"
                >
                  + Export
                </span>
              )}
            </button>

            {expandedSection.exports && (
              <div className="space-y-0.5 pl-2">
                {exportFiles.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-[var(--text-faint)] italic">
                    No exported masters yet
                  </div>
                ) : (
                  exportFiles.map((file) => {
                    const isSelected = audioUrl?.includes(file.filename);
                    const isCopied = copiedPathId === file.id;

                    return (
                      <div
                        key={file.id}
                        onClick={() => handlePlayFile(file)}
                        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs cursor-pointer transition ${
                          isSelected
                            ? "border shadow-sm"
                            : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-main)]"
                        }`}
                        style={{
                          backgroundColor: isSelected ? "var(--accent-glow)" : undefined,
                          borderColor: isSelected ? "var(--accent-primary)" : "transparent",
                          color: isSelected ? "var(--text-main)" : undefined,
                        }}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="rounded border border-white/10 px-1 py-0.2 font-mono text-[9px] font-bold uppercase"
                            style={{
                              backgroundColor: "var(--accent-glow)",
                              color: "var(--accent-primary)",
                            }}
                          >
                            {file.format}
                          </span>
                          <div className="truncate">
                            <div className="truncate font-medium text-[11px]">{file.name}</div>
                            <div className="text-[9px] text-[var(--text-faint)]">
                              {formatFileSize(file.size_bytes)} • {formatTime(file.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPath(file);
                            }}
                            className="p-1 text-[var(--text-faint)] hover:text-[var(--text-main)]"
                            title="Copy Absolute Path"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              revealInExplorer({ path: file.path });
                            }}
                            className="p-1 text-[var(--text-faint)] hover:text-[var(--accent-primary)]"
                            title="Reveal in macOS Finder"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(file, e)}
                            className="p-1 text-[var(--text-faint)] hover:text-red-400"
                            title="Delete file"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Studio Takes / Generations */}
        {(selectedFilter === "all" || selectedFilter === "takes") && (
          <div className="space-y-1">
            <button
              onClick={() =>
                setExpandedSection((s) => ({ ...s, takes: !s.takes }))
              }
              className="flex w-full items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-main)]"
            >
              <div className="flex items-center space-x-1">
                {expandedSection.takes ? (
                  <ChevronDown className="h-3 w-3 text-[var(--accent-secondary)]" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
                )}
                <span>Synthesized Takes ({takeFiles.length})</span>
              </div>
            </button>

            {expandedSection.takes && (
              <div className="space-y-0.5 pl-2">
                {takeFiles.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-[var(--text-faint)] italic">
                    No voice takes generated yet
                  </div>
                ) : (
                  takeFiles.map((file) => {
                    const isSelected = audioUrl?.includes(file.filename);
                    const isCopied = copiedPathId === file.id;

                    return (
                      <div
                        key={file.id}
                        onClick={() => handlePlayFile(file)}
                        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs cursor-pointer transition ${
                          isSelected
                            ? "border shadow-sm"
                            : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-main)]"
                        }`}
                        style={{
                          backgroundColor: isSelected ? "var(--accent-glow)" : undefined,
                          borderColor: isSelected ? "var(--accent-secondary)" : "transparent",
                          color: isSelected ? "var(--text-main)" : undefined,
                        }}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="rounded bg-white/10 px-1 py-0.2 font-mono text-[9px] font-semibold text-[var(--accent-secondary)] uppercase">
                            {file.format}
                          </span>
                          <div className="truncate">
                            <div className="truncate font-medium text-[11px]">{file.name}</div>
                            <div className="text-[9px] text-[var(--text-faint)]">
                              {formatFileSize(file.size_bytes)} • {formatTime(file.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPath(file);
                            }}
                            className="p-1 text-[var(--text-faint)] hover:text-[var(--text-main)]"
                            title="Copy Path"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              revealInExplorer({ path: file.path });
                            }}
                            className="p-1 text-[var(--text-faint)] hover:text-[var(--accent-secondary)]"
                            title="Reveal in Finder"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(file, e)}
                            className="p-1 text-[var(--text-faint)] hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Target Output Directories */}
        <div className="space-y-1 pt-2 border-t border-white/[0.04]">
          <button
            onClick={() =>
              setExpandedSection((s) => ({ ...s, directories: !s.directories }))
            }
            className="flex w-full items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] hover:text-[var(--text-main)]"
          >
            <div className="flex items-center space-x-1">
              {expandedSection.directories ? (
                <ChevronDown className="h-3 w-3 text-[var(--accent-primary)]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
              )}
              <span>Destination Folders</span>
            </div>
            <span
              onClick={async (e) => {
                e.stopPropagation();
                await pickCustomFolder();
              }}
              className="text-[var(--accent-primary)] hover:underline normal-case font-normal text-[10px] flex items-center space-x-0.5 cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>Add</span>
            </span>
          </button>

          {expandedSection.directories && (
            <div className="space-y-0.5 pl-2">
              {customDirectories.map((dir) => (
                <div
                  key={dir}
                  onClick={() => revealInExplorer({ path: dir })}
                  className="group flex items-center justify-between rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-main)] cursor-pointer transition"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <Folder className="h-3 w-3 text-[var(--accent-primary)] opacity-80 shrink-0" />
                    <span className="truncate">{dir}</span>
                  </div>
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-[var(--text-faint)] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-black/10">
        <button
          onClick={async () => {
            const folder = await pickCustomFolder();
            if (folder) {
              revealInExplorer({ path: folder });
            }
          }}
          className="flex w-full items-center justify-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] py-1.5 text-xs text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-main)] transition cursor-pointer"
        >
          <FolderOpen className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
          <span>Open Folder in Finder...</span>
        </button>
      </div>
    </aside>
  );
};
