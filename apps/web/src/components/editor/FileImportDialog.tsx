"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  X,
  Check,
  Clock,
  Type,
  AlignLeft,
  LayoutTemplate,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  FileCode,
  FileCheck,
} from "lucide-react";
import { ParseFileResponse, ParsedScriptBlock } from "@kobeanaudio/types";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface FileImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parseResult: ParseFileResponse | null;
  onImport: (data: {
    rawText: string;
    blocks: ParsedScriptBlock[];
    importMode: "replace" | "append";
  }) => void;
}

export const FileImportDialog: React.FC<FileImportDialogProps> = ({
  isOpen,
  onClose,
  parseResult,
  onImport,
}) => {
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [viewMode, setViewMode] = useState<"blocks" | "raw">("blocks");
  const [editableRawText, setEditableRawText] = useState("");
  const [editableBlocks, setEditableBlocks] = useState<ParsedScriptBlock[]>([]);

  useEffect(() => {
    if (parseResult) {
      setEditableRawText(parseResult.raw_text);
      setEditableBlocks(
        parseResult.blocks && parseResult.blocks.length > 0
          ? parseResult.blocks.map((b, idx) => ({
              id: b.id || `imported-block-${idx + 1}`,
              speaker: b.speaker || "Narrator",
              text: b.text,
            }))
          : [{ id: "imported-block-1", speaker: "Narrator", text: parseResult.raw_text }]
      );
      setViewMode(parseResult.blocks && parseResult.blocks.length > 1 ? "blocks" : "raw");
    }
  }, [parseResult]);

  if (!isOpen || !parseResult) return null;

  const handleBlockSpeakerChange = (idx: number, newSpeaker: string) => {
    setEditableBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], speaker: newSpeaker };
      return next;
    });
  };

  const handleBlockTextChange = (idx: number, newText: string) => {
    setEditableBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: newText };
      return next;
    });
  };

  const handleConfirmImport = () => {
    // If raw view was edited, re-extract blocks if needed
    if (viewMode === "raw") {
      onImport({
        rawText: editableRawText,
        blocks: editableBlocks,
        importMode,
      });
    } else {
      const compiledRaw = editableBlocks
        .map((b) => (b.speaker ? `${b.speaker}: ${b.text}` : b.text))
        .join("\n\n");
      onImport({
        rawText: compiledRaw || editableRawText,
        blocks: editableBlocks,
        importMode,
      });
    }
    onClose();
  };

  // Re-sync blocks from raw text
  const handleRawTextChange = (newText: string) => {
    setEditableRawText(newText);
    const lines = newText.split("\n\n").filter((l) => l.trim());
    const newBlocks: ParsedScriptBlock[] = lines.map((paragraph, idx) => {
      const colonMatch = paragraph.match(/^([A-Za-z0-9_\-\s]{2,25}):\s*(.+)$/s);
      const bracketMatch = paragraph.match(/^\[([A-Za-z0-9_\-\s]{2,25})\]\s*(.+)$/s);
      if (colonMatch) {
        return {
          id: `imported-block-${idx + 1}`,
          speaker: colonMatch[1].trim(),
          text: colonMatch[2].trim(),
        };
      }
      if (bracketMatch) {
        return {
          id: `imported-block-${idx + 1}`,
          speaker: bracketMatch[1].trim(),
          text: bracketMatch[2].trim(),
        };
      }
      return {
        id: `imported-block-${idx + 1}`,
        speaker: editableBlocks[idx]?.speaker || "Narrator",
        text: paragraph.trim(),
      };
    });
    setEditableBlocks(newBlocks.length > 0 ? newBlocks : [{ id: "1", speaker: "Narrator", text: newText }]);
  };

  const formatBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "docx":
      case "doc":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "srt":
      case "vtt":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "md":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      default:
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          variants={modalMotion}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass-popover bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-glass)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  Document Parsed Successfully
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${formatBadgeColor(
                      parseResult.file_type
                    )}`}
                  >
                    .{parseResult.file_type}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] truncate max-w-md">
                  {parseResult.filename}
                </p>
              </div>
            </div>

            <motion.button
              {...buttonSubtleTapMotion}
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Metrics Telemetry Strip */}
          <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-[var(--bg-surface-inset)]/60 border-b border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Type className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>
                Words: <strong className="text-[var(--text-primary)]">{parseResult.word_count}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Characters: <strong className="text-[var(--text-primary)]">{parseResult.char_count}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Blocks: <strong className="text-[var(--text-primary)]">{editableBlocks.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Est. Audio: <strong className="text-[var(--text-primary)]">~{parseResult.estimated_duration_sec}s</strong>
              </span>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            {/* View Mode & Import Mode Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setViewMode("blocks")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "blocks"
                      ? "bg-[var(--accent-primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Dialogue Blocks ({editableBlocks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "raw"
                      ? "bg-[var(--accent-primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Raw Script Text
                </button>
              </div>

              {/* Import Mode: Replace vs Append */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">Action:</span>
                <div className="flex items-center p-1 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      importMode === "replace"
                        ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Replace Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      importMode === "append"
                        ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Append to Script
                  </button>
                </div>
              </div>
            </div>

            {/* Content Preview Container */}
            <div className="flex-1 min-h-[260px] max-h-[380px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {viewMode === "blocks" ? (
                editableBlocks.map((block, idx) => (
                  <div
                    key={block.id || idx}
                    className="p-3.5 rounded-xl bg-[var(--bg-surface-inset)]/70 border border-[var(--border-subtle)] space-y-2 focus-within:border-[var(--accent-primary)]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <input
                          type="text"
                          value={block.speaker}
                          onChange={(e) => handleBlockSpeakerChange(idx, e.target.value)}
                          placeholder="Speaker name"
                          className="text-xs font-semibold text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:outline-none px-1 py-0.5 w-32"
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        Block #{idx + 1}
                      </span>
                    </div>
                    <textarea
                      value={block.text}
                      onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                      rows={2}
                      className="w-full text-xs text-[var(--text-secondary)] bg-transparent resize-y focus:outline-none focus:text-[var(--text-primary)] leading-relaxed font-sans"
                    />
                  </div>
                ))
              ) : (
                <div className="h-full">
                  <textarea
                    value={editableRawText}
                    onChange={(e) => handleRawTextChange(e.target.value)}
                    rows={12}
                    className="w-full h-full p-4 text-xs font-mono leading-relaxed rounded-xl bg-[var(--bg-surface-inset)]/70 border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
                    placeholder="Extracted script content..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-glass)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {importMode === "replace"
                ? "Replaces current editor text with imported document."
                : "Appends extracted text to existing editor blocks."}
            </p>

            <div className="flex items-center gap-3">
              <motion.button
                {...buttonSubtleTapMotion}
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                {...buttonTapMotion}
                type="button"
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                Import into Studio
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
