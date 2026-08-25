"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  Pause,
  X,
  Check,
  ArrowRight,
  AlignLeft,
  ArrowDownToLine,
  ArrowUpToLine,
  MessageSquare,
  Volume2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { StudioTag } from "@/stores/tagStore";
import { useProjectStore } from "@/stores/projectStore";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface TagInsertionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: StudioTag | null;
  onAuditionTag?: (tag: StudioTag) => void;
  isPlayingAudition?: boolean;
  isLoadingAudition?: boolean;
  onNavigateToStudio?: () => void;
}

export type InsertionTarget = "cursor" | "start" | "end" | "wrap" | "block";

export const TagInsertionDialog: React.FC<TagInsertionDialogProps> = ({
  isOpen,
  onClose,
  tag,
  onAuditionTag,
  isPlayingAudition = false,
  isLoadingAudition = false,
  onNavigateToStudio,
}) => {
  const { textContent, setTextContent } = useProjectStore();
  const [target, setTarget] = useState<InsertionTarget>("start");
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(0);
  const [justApplied, setJustApplied] = useState(false);

  // Extract dialogue lines or speaker blocks from the current script
  const scriptLines = useMemo(() => {
    if (!textContent) return [];
    return textContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [textContent]);

  const dialogueBlocks = useMemo(() => {
    return scriptLines
      .map((line, idx) => ({ idx, line }))
      .filter(({ line }) => /^(Speaker\s*\d*|Host|Guest|Narrator|Guide|Presenter|Anchor|Trailer|[A-Z][a-z]+)\s*:/i.test(line));
  }, [scriptLines]);

  // Compute resulting text preview based on selected target
  const previewText = useMemo(() => {
    if (!tag) return textContent || "";
    const syntax = tag.syntax.trim();

    if (!textContent || textContent.trim() === "") {
      return `${syntax} Welcome to KobeanAudio Studio.`;
    }

    if (target === "start") {
      // If transcript heading exists, insert after transcript heading
      if (textContent.includes("## Transcript:")) {
        const parts = textContent.split("## Transcript:");
        return `${parts[0]}## Transcript:\n${syntax} ${parts[1].trimStart()}`;
      }
      return `${syntax} ${textContent}`;
    }

    if (target === "end") {
      return `${textContent.trimEnd()} ${syntax} `;
    }

    if (target === "wrap") {
      return `${syntax} ${textContent.trim()} `;
    }

    if (target === "block" && dialogueBlocks.length > 0) {
      const targetBlock = dialogueBlocks[selectedBlockIdx] || dialogueBlocks[0];
      const lines = [...scriptLines];
      const origLine = lines[targetBlock.idx];
      const colonIdx = origLine.indexOf(":");
      if (colonIdx !== -1) {
        const speaker = origLine.substring(0, colonIdx + 1);
        const speech = origLine.substring(colonIdx + 1).trimStart();
        lines[targetBlock.idx] = `${speaker} ${syntax} ${speech}`;
      } else {
        lines[targetBlock.idx] = `${syntax} ${origLine}`;
      }
      return lines.join("\n\n");
    }

    return `${textContent} ${syntax} `;
  }, [textContent, tag, target, selectedBlockIdx, dialogueBlocks, scriptLines]);

  if (!isOpen || !tag) return null;

  const handleApply = (goToStudio: boolean = false) => {
    setTextContent(previewText);
    setJustApplied(true);

    setTimeout(() => {
      setJustApplied(false);
      onClose();
      if (goToStudio && onNavigateToStudio) {
        onNavigateToStudio();
      }
    }, 450);
  };

  return (
    <AnimatePresence>
      <motion.div
        {...modalMotion.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none"
      >
        <motion.div
          {...modalMotion.card}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-6 shadow-2xl text-[var(--text-main)] backdrop-blur-3xl space-y-4"
        >
          {/* Header with Tag details and Audition button */}
          <div className="flex items-start justify-between border-b border-[var(--glass-border)] pb-3.5">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl p-[1px] shadow-sm shrink-0"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[var(--bg-base)]">
                  <Sparkles className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border shadow-sm"
                    style={{
                      backgroundColor: "var(--accent-glow)",
                      borderColor: "var(--accent-primary)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {tag.syntax}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-faint)]">
                    {tag.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{tag.description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/10 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Audio Audition Quick Bar */}
          {tag.exampleSnippet && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] p-2.5">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <button
                  onClick={() => onAuditionTag && onAuditionTag(tag)}
                  disabled={isLoadingAudition}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition cursor-pointer shrink-0 ${
                    isPlayingAudition
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : "border-[var(--glass-border)] bg-white/[0.06] text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
                  }`}
                  title={isPlayingAudition ? "Pause Audition" : "Listen to Tag Sample"}
                >
                  {isLoadingAudition ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : isPlayingAudition ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  )}
                </button>
                <div className="truncate">
                  <span className="text-[10px] font-mono text-[var(--text-faint)] uppercase block">
                    Sample Audition
                  </span>
                  <span className="text-xs text-[var(--text-main)] font-mono truncate block">
                    “{tag.exampleSnippet}”
                  </span>
                </div>
              </div>

              {isPlayingAudition && (
                <span className="flex space-x-0.5 items-center px-1 shrink-0">
                  <span className="h-3 w-1 bg-emerald-500 animate-pulse rounded-full" />
                  <span className="h-4 w-1 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                  <span className="h-2 w-1 bg-emerald-500 animate-pulse delay-150 rounded-full" />
                </span>
              )}
            </div>
          )}

          {/* Placement Options Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Where to Insert in Script:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Beginning */}
              <button
                onClick={() => setTarget("start")}
                className={`flex items-center space-x-2.5 rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                  target === "start"
                    ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                    : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <ArrowUpToLine className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <div>
                  <span className="block font-medium">At Beginning</span>
                  <span className="text-[10px] text-[var(--text-faint)] block">Tone / Scene Intro</span>
                </div>
              </button>

              {/* Option 2: End */}
              <button
                onClick={() => setTarget("end")}
                className={`flex items-center space-x-2.5 rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                  target === "end"
                    ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                    : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <div>
                  <span className="block font-medium">At End</span>
                  <span className="text-[10px] text-[var(--text-faint)] block">Append to Script</span>
                </div>
              </button>

              {/* Option 3: Dialogue Block (if blocks exist) */}
              {dialogueBlocks.length > 0 && (
                <button
                  onClick={() => setTarget("block")}
                  className={`col-span-2 flex items-center space-x-2.5 rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                    target === "block"
                      ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                      : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                  <div className="flex-1">
                    <span className="block font-medium">Into Dialogue Speaker Block</span>
                    <span className="text-[10px] text-[var(--text-faint)] block">
                      Target specific character dialogue ({dialogueBlocks.length} blocks found)
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Block Picker Dropdown (when 'block' is selected) */}
            {target === "block" && dialogueBlocks.length > 0 && (
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] p-2 space-y-1 mt-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-faint)] uppercase px-1">
                  Select Target Dialogue:
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {dialogueBlocks.map((b, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBlockIdx(idx)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition cursor-pointer ${
                        selectedBlockIdx === idx
                          ? "bg-white/[0.14] text-[var(--text-main)] font-semibold border border-white/15"
                          : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]"
                      }`}
                    >
                      <span className="truncate font-mono text-[11px]">{b.line}</span>
                      {selectedBlockIdx === idx && (
                        <Check className="h-3 w-3 shrink-0 ml-1.5" style={{ color: "var(--accent-primary)" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview of Script with Tag inserted */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Script Result Preview:
              </label>
              <span className="text-[10px] text-[var(--accent-primary)] font-mono">Real-time update</span>
            </div>
            <div className="h-24 overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] p-2.5 font-mono text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
              {previewText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-2">
              <motion.button
                {...buttonSubtleTapMotion}
                onClick={() => handleApply(false)}
                className="flex items-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm hover:border-white/20 transition cursor-pointer"
              >
                {justApplied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Applied!</span>
                  </>
                ) : (
                  <span>Apply & Stay</span>
                )}
              </motion.button>

              <motion.button
                {...buttonTapMotion}
                onClick={() => handleApply(true)}
                className="flex items-center space-x-1.5 rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition hover:opacity-90 cursor-pointer"
                style={{
                  backgroundImage: "var(--accent-gradient)",
                  boxShadow: "0 0 16px var(--accent-glow)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Apply & Go to Studio</span>
                <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
