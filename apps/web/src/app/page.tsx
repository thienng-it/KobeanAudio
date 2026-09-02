"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

import { useEngineStore } from "@/stores/engineStore";
import { useProjectStore } from "@/stores/projectStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useThemeStore, StudioThemeId } from "@/stores/themeStore";
import { useTagStore } from "@/stores/tagStore";
import { useAudioFilesStore } from "@/stores/audioFilesStore";
import { generateAudio } from "@/lib/api";
import { SPRINGS } from "@/lib/motion";

import { TopNav } from "@/components/navigation/TopNav";
import { TextEditor } from "@/components/editor/TextEditor";
import { StudioInspector } from "@/components/inspector/StudioInspector";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { AudioTrimDialog } from "@/components/player/AudioTrimDialog";
import { VoiceCloneDialog } from "@/components/voice-clone/VoiceCloneDialog";
import { ExportDialog } from "@/components/export/ExportDialog";
import { TagsManagerPage } from "@/components/tags/TagsManagerPage";
import { AudioFilesSidebar } from "@/components/sidebar/AudioFilesSidebar";

export default function StudioPage() {
  const {
    activeEngine,
    selectedVoiceId,
    selectedGeminiModel,
    temperature,
    speed,
    pitch,
    emotionExaggeration,
    outputFormat,
    normalizeLufs,
    trimSilence,
    loadEngines,
    loadVoices,
    loadQuotaStatus,
    setLastTelemetry,
  } = useEngineStore();

  const {
    textContent,
    activeProject,
    loadProjects,
    saveCurrentProject,
    addGenerationRecord,
  } = useProjectStore();

  const { setAudioUrl, setIsPlaying } = usePlayerStore();
  const { theme, setTheme } = useThemeStore();
  const { loadSavedCustomTags } = useTagStore();
  const { isSidebarOpen, setSidebarOpen, toggleSidebar, loadAudioFiles } = useAudioFilesStore();

  const [activeTab, setActiveTab] = useState<"studio" | "tags">("studio");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamProgress, setStreamProgress] = useState<{ percent: number; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showInspector, setShowInspector] = useState(true);
  const [voiceCloneOpen, setVoiceCloneOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [trimOpen, setTrimOpen] = useState(false);
  const [selectedExportGenId, setSelectedExportGenId] = useState<string | undefined>(undefined);


  // Initial load & theme hydration
  useEffect(() => {
    loadEngines();
    loadVoices();
    loadProjects();
    loadQuotaStatus();
    loadSavedCustomTags();
    loadAudioFiles();

    const savedTheme = localStorage.getItem("kobeanaudio_theme") as StudioThemeId | null;
    const initial = savedTheme || "cyber-mist";
    setTheme(initial);

    // Dynamic OS appearance listener for 'system' theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const active = (localStorage.getItem("kobeanaudio_theme") as StudioThemeId) || "system";
      if (active === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mediaQuery.matches ? "studio-dark" : "studio-light"
        );
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveCurrentProject();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [textContent, activeEngine, selectedVoiceId, isGenerating]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStopGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsGenerating(false);
    setStreamProgress(null);
  };

  const handleGenerate = async () => {
    if (!textContent.trim() || isGenerating) return;

    // Reset abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setErrorMessage(null);
    setStreamProgress({ percent: 15, message: "Connecting to neural speech engine..." });

    // Simulate realistic progressive status while synthesis occurs
    let progressVal = 15;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      progressVal = Math.min(92, progressVal + Math.floor(Math.random() * 8) + 4);
      const phaseMsg =
        progressVal < 35
          ? "Synthesizing acoustic features..."
          : progressVal < 65
          ? "Generating neural waveform..."
          : progressVal < 85
          ? "Applying broadcast LUFS normalization..."
          : "Finalizing master audio take...";
      setStreamProgress({ percent: progressVal, message: phaseMsg });
    }, 450);

    try {
      const payload = {
        text: textContent,
        engine: activeEngine,
        voiceId: selectedVoiceId,
        geminiModel: selectedGeminiModel,
        temperature,
        speed,
        pitch,
        emotionExaggeration,
        outputFormat,
        normalizeLufs,
        trimSilence,
        projectId: activeProject?.id,
      };

      const result = await generateAudio(payload, abortController.signal);
      const url = result.audio_url || result.audioUrl || null;
      setAudioUrl(url);
      setIsPlaying(true);
      addGenerationRecord(result);
      
      setLastTelemetry({
        modelUsed: result.model_used || result.gemini_model || result.geminiModel,
        wasCascaded: result.was_cascaded || false,
        cascadeReason: result.cascade_reason || null,
        generatedAt: new Date().toLocaleTimeString(),
      });

      // Refresh real-time quota status and audio files list in background
      loadQuotaStatus();
      loadAudioFiles();
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.message?.includes("aborted")) {
        // Ignored gracefully on cancellation
        return;
      }
      setErrorMessage(e.message || "Failed to generate audio. Check local models or API key.");
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setIsGenerating(false);
      setStreamProgress(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="relative flex h-screen w-screen min-w-[980px] min-h-[640px] flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-main)]">
      {/* Fluid Ambient Liquid Gradient Orbs for Authentic Liquid Glass Refraction */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-50 transition-opacity">
        <div className="orb-ambient-1 absolute -top-[15%] -left-[10%] h-[550px] w-[550px] rounded-full blur-[110px]" />
        <div className="orb-ambient-2 absolute top-[30%] -right-[10%] h-[600px] w-[600px] rounded-full blur-[120px]" />
        <div className="orb-ambient-3 absolute -bottom-[15%] left-[20%] h-[500px] w-[500px] rounded-full blur-[100px]" />
      </div>

      {/* 1. macOS Window Header & Engine / Workspace Segmented Switcher */}
      <div className="relative z-30 shrink-0">
        <TopNav
          onOpenVoiceClone={() => setVoiceCloneOpen(true)}
          showInspector={showInspector}
          onToggleInspector={() => setShowInspector(!showInspector)}
          showAudioSidebar={isSidebarOpen}
          onToggleAudioSidebar={toggleSidebar}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* 2. Main Studio Canvas / Tags Library Workspace */}
      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* Studio Workspace Container */}
        <div
          className={`flex-1 min-h-0 overflow-hidden ${
            activeTab === "studio" ? "flex" : "hidden"
          }`}
        >
          {/* Left: IDE-style Audio Files & Asset Explorer Sidebar */}
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={SPRINGS.popover}
                className="h-full min-h-0 overflow-hidden shrink-0"
              >
                <AudioFilesSidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  onOpenExport={() => {
                    setSelectedExportGenId(activeProject?.id);
                    setExportOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center: Distraction-free Script & Director Notes Canvas */}
          <main className="flex flex-1 min-h-0 flex-col overflow-hidden p-3 sm:p-3.5">
            <TextEditor onOpenTagsLibrary={() => setActiveTab("tags")} />
          </main>

          {/* Right: Studio Inspector (Voice Character, Precision Sliders, DSP & Takes) */}
          <AnimatePresence initial={false}>
            {showInspector && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 330, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={SPRINGS.popover}
                className="h-full min-h-0 overflow-hidden shrink-0"
              >
                <StudioInspector
                  onOpenExport={(genId) => {
                    setSelectedExportGenId(genId || activeProject?.id);
                    setExportOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags & Emotions Library View Container */}
        <div
          className={`flex-1 min-h-0 overflow-hidden ${
            activeTab === "tags" ? "flex" : "hidden"
          }`}
        >
          <TagsManagerPage onNavigateToStudio={() => setActiveTab("studio")} />
        </div>

        {/* Floating Notification / Error Overlay */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-1/2 top-4 -translate-x-1/2 z-50 flex items-center space-x-2 rounded-2xl border border-red-500/30 bg-[#140A0D]/95 px-4 py-2.5 text-xs text-red-300 shadow-2xl backdrop-blur-2xl"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Floating Bottom Audio Master Transport Dock */}
      <div className="relative z-30 shrink-0">
        <AudioPlayer
          onOpenExport={() => {
            setSelectedExportGenId(activeProject?.id);
            setExportOpen(true);
          }}
          onOpenTrim={() => setTrimOpen(true)}
          onGenerate={handleGenerate}
          onStop={handleStopGenerate}
          isGenerating={isGenerating}
          progress={streamProgress}
          canGenerate={!!textContent.trim()}
        />
      </div>

      {/* Dialogs */}
      <VoiceCloneDialog
        isOpen={voiceCloneOpen}
        onClose={() => setVoiceCloneOpen(false)}
      />

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        generationId={selectedExportGenId}
      />

      <AudioTrimDialog
        isOpen={trimOpen}
        onClose={() => setTrimOpen(false)}
      />
    </div>
  );
}

