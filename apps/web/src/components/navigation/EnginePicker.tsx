"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Heart,
  Mic,
  Cloud,
  Globe,
  FastForward,
  ChevronDown,
  Check,
  Cpu,
} from "lucide-react";
import { EngineType } from "@kobeanaudio/types";
import { useEngineStore } from "@/stores/engineStore";
import { dropdownMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface EngineOption {
  id: EngineType;
  name: string;
  badge: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}

const ENGINES: EngineOption[] = [
  {
    id: "kokoro",
    name: "Kokoro TTS",
    badge: "14x Fast",
    tagline: "Lightning Fast On-Device · Apple Silicon M3",
    icon: Zap,
    accent: "text-amber-400",
  },
  {
    id: "orpheus",
    name: "Orpheus LLM",
    badge: "Expressive",
    tagline: "Speech LLM with <laugh>, <sigh>, emotions",
    icon: Heart,
    accent: "text-rose-400",
  },
  {
    id: "chatterbox",
    name: "Chatterbox",
    badge: "Zero-Shot",
    tagline: "Neural Voice Cloning from 5s sample",
    icon: Mic,
    accent: "text-cyan-400",
  },
  {
    id: "gemini",
    name: "Google Gemini Pro",
    badge: "Director Notes",
    tagline: "Cloud Speech with Director Notes & Scene context",
    icon: Cloud,
    accent: "text-blue-400",
  },
  {
    id: "qwen3",
    name: "Qwen3 Audio",
    badge: "10+ Langs",
    tagline: "Global Multilingual Speech & Accents",
    icon: Globe,
    accent: "text-emerald-400",
  },
  {
    id: "piper",
    name: "Piper TTS",
    badge: "Ultra-Light",
    tagline: "Instant CPU/GPU Speech Engine",
    icon: FastForward,
    accent: "text-purple-400",
  },
];

export const EnginePicker: React.FC = () => {
  const { activeEngine, setActiveEngine } = useEngineStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentEngine = ENGINES.find((e) => e.id === activeEngine) || ENGINES[0];
  const CurrentIcon = currentEngine.icon;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <motion.button
        {...buttonSubtleTapMotion}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.06] whitespace-nowrap shrink-0 cursor-pointer"
      >
        <CurrentIcon className={`h-3 w-3 ${currentEngine.accent}`} />
        <span className="font-semibold text-[11px] whitespace-nowrap">{currentEngine.name}</span>
        <span className="rounded bg-white/10 px-1 py-0.2 text-[8px] font-mono uppercase text-[var(--text-muted)] whitespace-nowrap">
          {currentEngine.badge}
        </span>
        <ChevronDown
          className={`h-2.5 w-2.5 opacity-40 transition duration-200 ${
            isOpen ? "rotate-180 opacity-100" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...dropdownMotion}
            className="glass-popover absolute left-0 top-full mt-1.5 w-72 rounded-2xl p-2 z-50 text-[var(--text-main)]"
          >
            <div className="mb-1.5 flex items-center justify-between px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              <span className="flex items-center space-x-1">
                <Cpu className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
                <span>AI Speech Engine</span>
              </span>
              <span className="text-[9px] text-[var(--text-faint)]">6 Models</span>
            </div>

            <div className="space-y-1">
              {ENGINES.map((eng) => {
                const isSelected = activeEngine === eng.id;
                const Icon = eng.icon;
                return (
                  <button
                    key={eng.id}
                    onClick={() => {
                      setActiveEngine(eng.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl p-2 text-xs transition text-left cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.12] text-[var(--text-main)] font-semibold border border-white/20 shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 ${
                          isSelected ? "bg-white/15" : ""
                        }`}
                      >
                        <Icon className={`h-3 w-3 ${eng.accent}`} />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs text-[var(--text-main)] font-medium whitespace-nowrap">{eng.name}</span>
                          <span className="rounded bg-white/10 px-1 py-0.2 text-[8px] uppercase text-[var(--text-muted)] whitespace-nowrap">
                            {eng.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-faint)] leading-tight truncate">
                          {eng.tagline}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 ml-2"
                        style={{ color: "var(--accent-primary)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
