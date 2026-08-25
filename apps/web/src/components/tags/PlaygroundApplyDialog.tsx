"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  X,
  Check,
  Replace,
  ArrowDownToLine,
  ArrowUpToLine,
  FileText,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface PlaygroundApplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playgroundText: string;
  onNavigateToStudio?: () => void;
}

export type PlaygroundApplyStrategy = "replace" | "append" | "prepend";

export const PlaygroundApplyDialog: React.FC<PlaygroundApplyDialogProps> = ({
  isOpen,
  onClose,
  playgroundText,
  onNavigateToStudio,
}) => {
  const { textContent, setTextContent } = useProjectStore();
  const [strategy, setStrategy] = useState<PlaygroundApplyStrategy>("replace");

  if (!isOpen) return null;

  const getResultingText = () => {
    if (strategy === "replace") {
      return playgroundText;
    }
    if (strategy === "append") {
      return `${textContent.trimEnd()}\n\n${playgroundText.trimStart()}`;
    }
    if (strategy === "prepend") {
      return `${playgroundText.trimEnd()}\n\n${textContent.trimStart()}`;
    }
    return playgroundText;
  };

  const handleApply = (goToStudio: boolean = true) => {
    const finalScript = getResultingText();
    setTextContent(finalScript);
    onClose();
    if (goToStudio && onNavigateToStudio) {
      onNavigateToStudio();
    }
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
          className="relative w-full max-w-md rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-6 shadow-2xl text-[var(--text-main)] backdrop-blur-3xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center space-x-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl p-[1px] shadow-sm shrink-0"
                style={{ backgroundImage: "var(--accent-gradient)" }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[var(--bg-base)]">
                  <FileText className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Apply Playground to Studio</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Choose how to merge your playground text with active project
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/10 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
              Application Method:
            </label>
            <div className="space-y-1.5">
              {/* Option 1: Replace */}
              <button
                onClick={() => setStrategy("replace")}
                className={`flex w-full items-center space-x-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  strategy === "replace"
                    ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                    : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <Replace className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <div className="flex-1">
                  <span className="block text-xs font-semibold">Replace Active Studio Script</span>
                  <span className="text-[10px] text-[var(--text-faint)] block">
                    Overwrites the script canvas completely with playground composition
                  </span>
                </div>
                {strategy === "replace" && (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                )}
              </button>

              {/* Option 2: Append */}
              <button
                onClick={() => setStrategy("append")}
                className={`flex w-full items-center space-x-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  strategy === "append"
                    ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                    : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <ArrowDownToLine className="h-4 w-4 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <div className="flex-1">
                  <span className="block text-xs font-semibold">Append to End of Script</span>
                  <span className="text-[10px] text-[var(--text-faint)] block">
                    Adds playground text after the existing studio script
                  </span>
                </div>
                {strategy === "append" && (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                )}
              </button>

              {/* Option 3: Prepend */}
              <button
                onClick={() => setStrategy("prepend")}
                className={`flex w-full items-center space-x-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  strategy === "prepend"
                    ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] text-[var(--text-main)] font-semibold shadow-sm"
                    : "border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <ArrowUpToLine className="h-4 w-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <div className="flex-1">
                  <span className="block text-xs font-semibold">Insert at Beginning (Prepend)</span>
                  <span className="text-[10px] text-[var(--text-faint)] block">
                    Adds playground text as intro before the existing studio script
                  </span>
                </div>
                {strategy === "prepend" && (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                )}
              </button>
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
              <span>Apply & Open Studio</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
