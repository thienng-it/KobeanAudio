"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AudioWaveform,
  Plus,
  Mic,
  Save,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Tag,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useTagStore } from "@/stores/tagStore";
import { useAudioFilesStore } from "@/stores/audioFilesStore";
import { useEngineStore } from "@/stores/engineStore";
import { dropdownMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { EnginePicker } from "@/components/navigation/EnginePicker";

interface TopNavProps {
  onOpenVoiceClone: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  showAudioSidebar?: boolean;
  onToggleAudioSidebar?: () => void;
  activeTab?: "studio" | "tags";
  onTabChange?: (tab: "studio" | "tags") => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenVoiceClone,
  showInspector,
  onToggleInspector,
  showAudioSidebar = false,
  onToggleAudioSidebar,
  activeTab = "studio",
  onTabChange,
}) => {
  const {
    projects,
    activeProject,
    setActiveProject,
    createNewProject,
    saveCurrentProject,
    isSaving,
  } = useProjectStore();

  const { tags } = useTagStore();
  const { files } = useAudioFilesStore();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const handleRefreshApp = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        useAudioFilesStore.getState().loadAudioFiles(),
        useProjectStore.getState().loadProjects(),
        useEngineStore.getState().loadEngines(),
        useEngineStore.getState().loadVoices(),
        useEngineStore.getState().loadQuotaStatus(),
        useTagStore.getState().loadSavedCustomTags(),
      ]);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2200);
    } catch (err) {
      console.error("Studio live-refresh error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Keyboard shortcut listener for ⌘R / Ctrl+R to live-sync without page flash
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r" && !e.shiftKey) {
        e.preventDefault();
        handleRefreshApp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRefreshing]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        projectRef.current &&
        !projectRef.current.contains(e.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateProject = async () => {
    const newProj = await createNewProject("Untitled Project");
    setActiveProject(newProj);
    setProjectDropdownOpen(false);
  };

  return (
    <header
      data-tauri-drag-region
      className="relative z-40 flex h-12 w-full shrink-0 items-center justify-between border-b border-[var(--glass-border)] bg-[var(--bg-surface-dock)] px-3 pl-[78px] backdrop-blur-2xl text-[var(--text-main)] overflow-visible select-none gap-2"
    >
      {/* Zone 1 (Left): App Identity & Workspaces */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Toggle Audio Files Explorer Button */}
        {onToggleAudioSidebar && (
          <motion.button
            {...buttonSubtleTapMotion}
            onClick={onToggleAudioSidebar}
            title={showAudioSidebar ? "Hide Audio Explorer (⌘B)" : "Show Audio Explorer (⌘B)"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition cursor-pointer shrink-0 ${
              showAudioSidebar
                ? "border-white/20 bg-white/[0.08] text-[var(--accent-primary)] shadow-sm"
                : "border-[var(--glass-border)] bg-white/[0.02] text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/[0.05]"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          </motion.button>
        )}

        {/* Brand App Icon & Name */}
        <div className="flex items-center space-x-2">
          <div
            className="flex h-6.5 w-6.5 items-center justify-center rounded-lg p-[1px] shadow-sm shrink-0"
            style={{ backgroundImage: "var(--accent-gradient)" }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[var(--bg-base)]">
              <AudioWaveform
                className="h-3.5 w-3.5"
                style={{ color: "var(--accent-primary)" }}
              />
            </div>
          </div>
          <span className="text-xs font-bold tracking-tight text-[var(--text-main)] whitespace-nowrap">
            KobeanAudio
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10 shrink-0 mx-0.5" />

        {/* Project Selector Dropdown */}
        <div ref={projectRef} className="relative shrink-0">
          <motion.button
            {...buttonSubtleTapMotion}
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.06] cursor-pointer whitespace-nowrap shrink-0"
          >
            <Folder
              className="h-3 w-3 shrink-0"
              style={{ color: "var(--accent-primary)" }}
            />
            <span className="max-w-[120px] truncate font-medium text-[11px] whitespace-nowrap">
              {activeProject ? activeProject.name : "Studio Workspace"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-40 shrink-0" />
          </motion.button>

          <AnimatePresence>
            {projectDropdownOpen && (
              <motion.div
                {...dropdownMotion}
                className="glass-popover absolute left-0 top-full mt-1.5 w-64 rounded-2xl p-2 z-50 text-[var(--text-main)]"
              >
                <div className="mb-1.5 flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] border-b border-[var(--glass-border)] pb-1.5">
                  <span>Projects ({projects.length})</span>
                  <button
                    onClick={handleCreateProject}
                    className="flex items-center space-x-1 font-semibold hover:underline cursor-pointer"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    <Plus className="h-3 w-3" />
                    <span>New</span>
                  </button>
                </div>
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="py-4 text-center px-3">
                      <p className="text-xs text-[var(--text-faint)]">No saved projects yet.</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Click + New to create one</p>
                    </div>
                  ) : (
                    projects.map((p) => {
                      const isSelected = activeProject?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProject(p);
                            setProjectDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-white/[0.12] text-[var(--text-main)] font-semibold border border-white/15 shadow-sm"
                              : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]"
                          }`}
                        >
                          <span className="truncate text-[11px] whitespace-nowrap">{p.name}</span>
                          {isSelected && (
                            <Check
                              className="h-3 w-3 shrink-0"
                              style={{ color: "var(--accent-primary)" }}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Zone 2 (Center): Segmented Navigation Switcher (Studio | Tags Library) */}
      {onTabChange && (
        <div className="flex items-center rounded-xl bg-black/10 dark:bg-black/40 p-0.5 border border-[var(--glass-border)] shadow-inner shrink-0">
          <button
            onClick={() => onTabChange("studio")}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "studio"
                ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Sliders
              className="h-3 w-3 shrink-0"
              style={{ color: "var(--accent-primary)" }}
            />
            <span className="whitespace-nowrap">Studio</span>
          </button>

          <button
            onClick={() => onTabChange("tags")}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "tags"
                ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Tag
              className="h-3 w-3 shrink-0"
              style={{ color: "var(--accent-secondary)" }}
            />
            <span className="whitespace-nowrap">Tags Library</span>
            <span
              className="rounded-full px-1.5 py-0.2 text-[9px] font-mono border border-[var(--glass-border)] shrink-0"
              style={{
                backgroundColor: "var(--accent-glow)",
                color: "var(--accent-primary)",
              }}
            >
              {tags.length}
            </span>
          </button>
        </div>
      )}

      {/* Zone 3 (Right): Engine, Theme & Tools */}
      <div className="flex items-center space-x-1.5 shrink-0">
        <EnginePicker />

        <div className="h-3.5 w-[1px] bg-white/10 shrink-0" />

        <ThemePicker />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenVoiceClone}
          className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] transition hover:border-white/20 hover:bg-white/[0.06] cursor-pointer whitespace-nowrap shrink-0"
          title="Clone Voice from Audio"
        >
          <Mic
            className="h-3 w-3 shrink-0"
            style={{ color: "var(--accent-primary)" }}
          />
          <span className="hidden lg:inline text-[11px] whitespace-nowrap">Clone Voice</span>
        </motion.button>

        {/* Refresh Live Sync Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefreshApp}
          disabled={isRefreshing}
          className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            refreshSuccess
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 font-semibold"
              : "border-[var(--glass-border)] bg-white/[0.03] text-[var(--text-main)] hover:border-white/20 hover:bg-white/[0.06]"
          }`}
          title="Refresh & Synchronize Studio (⌘R)"
        >
          <RefreshCw
            className={`h-3 w-3 shrink-0 ${isRefreshing ? "animate-spin text-[var(--accent-primary)]" : ""}`}
            style={{ color: refreshSuccess ? undefined : "var(--accent-primary)" }}
          />
          <span className="text-[11px] whitespace-nowrap">
            {refreshSuccess ? "Synced!" : "Refresh"}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveCurrentProject}
          disabled={isSaving}
          className="flex items-center space-x-1 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-2 py-1 text-xs text-[var(--text-faint)] transition hover:border-white/20 hover:text-[var(--text-main)] cursor-pointer shrink-0"
          title="Save (⌘S)"
        >
          <Save className="h-3 w-3 shrink-0" />
        </motion.button>

        <button
          onClick={onToggleInspector}
          title={showInspector ? "Hide Inspector" : "Show Inspector"}
          className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg border transition cursor-pointer shrink-0 ${
            showInspector
              ? "border-white/20 shadow-sm"
              : "border-white/[0.08] bg-white/[0.03] text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white/10"
          }`}
          style={{
            backgroundColor: showInspector ? "var(--accent-glow)" : undefined,
            borderColor: showInspector ? "var(--accent-primary)" : undefined,
            color: showInspector ? "var(--accent-primary)" : undefined,
          }}
        >
          {showInspector ? (
            <PanelRightClose className="h-3 w-3 shrink-0" />
          ) : (
            <PanelRightOpen className="h-3 w-3 shrink-0" />
          )}
        </button>
      </div>
    </header>
  );
};
