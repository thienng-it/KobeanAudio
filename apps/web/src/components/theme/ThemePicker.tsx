"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { STUDIO_THEMES, useThemeStore, StudioThemeId } from "@/stores/themeStore";
import { dropdownMotion, buttonSubtleTapMotion } from "@/lib/motion";

export const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
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

  const activeThemeObj = STUDIO_THEMES.find((t) => t.id === theme) || STUDIO_THEMES[0];

  const standardThemes = STUDIO_THEMES.filter((t) => t.category === "standard");
  const atmosphereThemes = STUDIO_THEMES.filter((t) => t.category === "atmosphere");

  return (
    <div ref={containerRef} className="relative shrink-0">
      <motion.button
        {...buttonSubtleTapMotion}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.06] whitespace-nowrap shrink-0 cursor-pointer"
        title="Change Studio Theme"
      >
        <span className="text-xs">{activeThemeObj.icon}</span>
        <span className="font-medium text-[11px] whitespace-nowrap hidden sm:inline">{activeThemeObj.name}</span>
        <div className="hidden md:flex items-center -space-x-1 shrink-0">
          {activeThemeObj.dots.slice(0, 2).map((dot, idx) => (
            <div
              key={idx}
              className="h-2 w-2 rounded-full border border-black/30"
              style={{ backgroundColor: dot }}
            />
          ))}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...dropdownMotion}
            className="glass-popover absolute right-0 top-full mt-2 w-72 max-h-[80vh] overflow-y-auto rounded-2xl p-2.5 z-50 space-y-3 text-[var(--text-main)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              <span className="flex items-center space-x-1.5">
                <Palette className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
                <span>Theme Library ({STUDIO_THEMES.length})</span>
              </span>
              <span className="text-[9px] text-[var(--text-faint)]">Soft Eyes</span>
            </div>

            {/* Group 1: Basic, Clean & Editorial Themes */}
            <div className="space-y-1">
              <div
                className="px-2 text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent-primary)" }}
              >
                Basic & Editorial Themes
              </div>
              {standardThemes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition text-left cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.12] text-[var(--text-main)] font-semibold border border-white/20 shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-sm shrink-0">{t.icon}</span>
                      <div className="truncate">
                        <div className="text-xs text-[var(--text-main)] leading-tight font-medium whitespace-nowrap">{t.name}</div>
                        <div className="text-[10px] text-[var(--text-faint)] leading-tight truncate">
                          {t.tagline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <div className="flex items-center -space-x-1">
                        {t.dots.map((dot, idx) => (
                          <div
                            key={idx}
                            className="h-2 w-2 rounded-full border border-black/40"
                            style={{ backgroundColor: dot }}
                          />
                        ))}
                      </div>
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{ color: "var(--accent-primary)" }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Group 2: Atmospheric Liquid Glass Themes */}
            <div className="space-y-1 pt-1 border-t border-white/[0.06]">
              <div
                className="px-2 text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent-secondary)" }}
              >
                Atmospheric Liquid Glass
              </div>
              {atmosphereThemes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition text-left cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.12] text-[var(--text-main)] font-semibold border border-white/20 shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-sm shrink-0">{t.icon}</span>
                      <div className="truncate">
                        <div className="text-xs text-[var(--text-main)] leading-tight font-medium whitespace-nowrap">{t.name}</div>
                        <div className="text-[10px] text-[var(--text-faint)] leading-tight truncate">
                          {t.tagline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <div className="flex items-center -space-x-1">
                        {t.dots.map((dot, idx) => (
                          <div
                            key={idx}
                            className="h-2 w-2 rounded-full border border-black/40"
                            style={{ backgroundColor: dot }}
                          />
                        ))}
                      </div>
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{ color: "var(--accent-primary)" }}
                        />
                      )}
                    </div>
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
