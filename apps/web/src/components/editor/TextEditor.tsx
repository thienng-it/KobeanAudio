"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  User,
  LayoutTemplate,
  AlignLeft,
  BookOpen,
  Sparkles,
  Check,
  Clock,
  Type,
  FileText,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useTagStore, StudioTag } from "@/stores/tagStore";
import {
  TEMPLATES,
  ScriptTemplate,
  autoTagScript,
  extractBlocksFromRaw,
  compileBlocksToRaw,
} from "@/lib/templateAutoTagger";
import { TagInsertionDialog } from "@/components/tags/TagInsertionDialog";
import { generateAudio } from "@/lib/api";
import {
  dropdownMotion,
  buttonTapMotion,
  buttonSubtleTapMotion,
  cardHoverMotion,
} from "@/lib/motion";

interface TextEditorProps {
  onOpenTagsLibrary?: () => void;
}

interface ScriptBlock {
  id: string;
  speaker: string;
  text: string;
}

const PALETTE_CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "emotion", label: "Emotions", icon: "🎭" },
  { id: "pacing", label: "Pacing", icon: "⏱️" },
  { id: "scene", label: "Scene", icon: "🎬" },
  { id: "gesture", label: "Gestures", icon: "🗣️" },
  { id: "style", label: "Styles", icon: "🎙️" },
];

export const TextEditor: React.FC<TextEditorProps> = ({ onOpenTagsLibrary }) => {
  const { textContent, setTextContent } = useProjectStore();
  const { tags } = useTagStore();

  const [scene, setScene] = useState("");
  const [pacing, setPacing] = useState("");
  const [style, setStyle] = useState("");

  // Mode: "visual" (block dialogue) vs "raw" (plain script)
  const [mode, setMode] = useState<"visual" | "raw">("visual");

  // Visual Blocks state
  const [blocks, setBlocks] = useState<ScriptBlock[]>([
    {
      id: "block-1",
      speaker: "Narrator",
      text: "[reading] [title] Welcome to KobeanAudio Neural Studio.",
    },
    {
      id: "block-2",
      speaker: "Director",
      text: "[warm, confident] Effortlessly orchestrate multi-speaker voices with expressive tags.",
    },
  ]);

  // Drawer & Accordion State
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedPaletteCat, setSelectedPaletteCat] = useState("all");
  const [showDirectorDetails, setShowDirectorDetails] = useState(false);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Template Modal State
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<ScriptTemplate | null>(
    null
  );
  const [autoTagSuccessNotice, setAutoTagSuccessNotice] = useState<string | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const templateRef = React.useRef<HTMLDivElement>(null);

  // Tag Insertion & Audition Modal State
  const [selectedInsertTag, setSelectedInsertTag] = useState<StudioTag | null>(null);
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [playingTagId, setPlayingTagId] = useState<string | null>(null);
  const [loadingTagId, setLoadingTagId] = useState<string | null>(null);
  const audioCache = React.useRef<Record<string, string>>({});
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAuditionTag = async (tag: StudioTag) => {
    if (playingTagId === tag.id) {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      setPlayingTagId(null);
      return;
    }
    if (currentAudioRef.current) currentAudioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();

    const sample = tag.exampleSnippet || `${tag.syntax} Sample nuance.`;
    if (audioCache.current[tag.id]) {
      const audio = new Audio(audioCache.current[tag.id]);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingTagId(null);
      audio.onerror = () => setPlayingTagId(null);
      setPlayingTagId(tag.id);
      audio.play().catch(() => setPlayingTagId(null));
      return;
    }

    try {
      setLoadingTagId(tag.id);
      const res = await generateAudio({
        text: sample,
        engine: "kokoro",
        voiceId: "af_heart",
        outputFormat: "wav",
      });
      if (res && res.audio_url) {
        const fullUrl = res.audio_url.startsWith("http")
          ? res.audio_url
          : `http://127.0.0.1:8000${res.audio_url}`;
        audioCache.current[tag.id] = fullUrl;
        const audio = new Audio(fullUrl);
        currentAudioRef.current = audio;
        audio.onended = () => setPlayingTagId(null);
        audio.onerror = () => setPlayingTagId(null);
        setLoadingTagId(null);
        setPlayingTagId(tag.id);
        audio.play().catch(() => setPlayingTagId(null));
      } else {
        throw new Error("No url");
      }
    } catch (err) {
      setLoadingTagId(null);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const clean = sample.replace(/\[[^\]]*\]/g, "").replace(/<[^>]*>/g, "").trim() || tag.name;
        const utter = new SpeechSynthesisUtterance(clean);
        utter.rate = 1.0;
        utter.onend = () => setPlayingTagId(null);
        utter.onerror = () => setPlayingTagId(null);
        setPlayingTagId(tag.id);
        window.speechSynthesis.speak(utter);
      } else {
        setPlayingTagId(null);
      }
    }
  };

  // Close template dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Synchronize initial textContent with blocks
  useEffect(() => {
    if (textContent.trim() && blocks.length <= 2 && blocks[0].text.includes("Welcome to KobeanAudio")) {
      const extracted = extractBlocksFromRaw(textContent);
      if (extracted.length > 0) {
        setBlocks(
          extracted.map((b, i) => ({
            id: `block-${i + 1}-${Date.now()}`,
            speaker: b.speaker,
            text: b.text,
          }))
        );
      }
    }
  }, [textContent]);

  // Synchronize changes to store
  const syncToRaw = (newBlocks: ScriptBlock[]) => {
    const raw = compileBlocksToRaw(newBlocks);
    setTextContent(raw);
  };

  const handleRawChange = (val: string) => {
    setTextContent(val);
    const extracted = extractBlocksFromRaw(val);
    if (extracted.length > 0) {
      setBlocks(
        extracted.map((b, i) => ({
          id: `block-${i + 1}`,
          speaker: b.speaker,
          text: b.text,
        }))
      );
    }
  };

  const handleUpdateBlock = (id: string, field: "speaker" | "text", val: string) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, [field]: val } : b));
    setBlocks(updated);
    syncToRaw(updated);
  };

  const handleAddBlock = () => {
    const newBlock: ScriptBlock = {
      id: `block-${Date.now()}`,
      speaker: `Speaker ${blocks.length + 1}`,
      text: "",
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    syncToRaw(updated);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    syncToRaw(updated);
  };

  // Drag and drop block reordering
  const handleBlockDragStart = (idx: number) => {
    setDraggedBlockIdx(idx);
  };

  const handleBlockDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedBlockIdx === null) return;
    setDragOverIdx(idx);
  };

  const handleBlockDrop = (idx: number) => {
    if (draggedBlockIdx === null || draggedBlockIdx === idx) {
      setDraggedBlockIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...blocks];
    const [moved] = updated.splice(draggedBlockIdx, 1);
    updated.splice(idx, 0, moved);
    setBlocks(updated);
    syncToRaw(updated);
    setDraggedBlockIdx(null);
    setDragOverIdx(null);
  };

  // Insert tag into raw or block
  const insertTagToBlock = (blockId: string, syntax: string) => {
    const target = blocks.find((b) => b.id === blockId);
    if (!target) return;
    handleUpdateBlock(blockId, "text", `${syntax} ${target.text}`);
  };

  const insertTagToRawScript = (syntax: string) => {
    setTextContent(`${textContent} ${syntax} `);
  };

  // Handle template selection trigger
  const handleTemplateSelectTrigger = (templateId: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplateForModal(tmpl);
  };

  // Action 1: Auto-Tag & Style Existing Script
  const applyAutoTagToCurrentScript = (template: ScriptTemplate) => {
    const currentScript = textContent || compileBlocksToRaw(blocks);
    const tagged = autoTagScript(currentScript, template);

    setScene(template.directorNotes?.scene || template.scene || "");
    setPacing(template.directorNotes?.pacing || template.pace || "");
    setStyle(template.directorNotes?.style || "");

    setTextContent(tagged);
    const extracted = extractBlocksFromRaw(tagged);
    if (extracted.length > 0) {
      setBlocks(
        extracted.map((b, i) => ({
          id: `block-${i + 1}-${Date.now()}`,
          speaker: b.speaker,
          text: b.text,
        }))
      );
    }

    setSelectedTemplateForModal(null);
    setAutoTagSuccessNotice(`Applied archetype styling: ${template.name}`);
    setTimeout(() => setAutoTagSuccessNotice(null), 3000);
  };

  // Action 2: Apply Demo Script & Replace
  const applyDemoTemplate = (template: ScriptTemplate) => {
    setScene(template.directorNotes?.scene || template.scene || "");
    setPacing(template.directorNotes?.pacing || template.pace || "");
    setStyle(template.directorNotes?.style || "");

    const demo = template.demoScript || template.rawText || "";
    setTextContent(demo);
    const extracted = extractBlocksFromRaw(demo);
    if (extracted.length > 0) {
      setBlocks(
        extracted.map((b, i) => ({
          id: `block-${i + 1}-${Date.now()}`,
          speaker: b.speaker,
          text: b.text,
        }))
      );
    }

    setSelectedTemplateForModal(null);
    setAutoTagSuccessNotice(`Loaded showcase script: ${template.name}`);
    setTimeout(() => setAutoTagSuccessNotice(null), 3000);
  };

  // Filter palette tags
  const paletteTags = tags.filter((t) => {
    if (selectedPaletteCat === "all") return true;
    return t.category === selectedPaletteCat;
  });

  // Calculate statistics
  const currentText = mode === "visual" ? compileBlocksToRaw(blocks) : textContent;
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const charCount = currentText.length;
  const estSeconds = Math.max(1, Math.round(wordCount / 2.6));
  const formattedDuration =
    estSeconds < 60
      ? `${estSeconds}s`
      : `${Math.floor(estSeconds / 60)}m ${estSeconds % 60}s`;

  return (
    <div className="liquid-glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-main)]">
      {/* 1. Unified Minimalist Toolbar Row */}
      <div className="flex shrink-0 flex-wrap items-center justify-between border-b border-[var(--glass-border)] bg-[var(--bg-surface)] px-3.5 py-2 gap-2">
        {/* Left: Mode Segmented Pill */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg bg-black/10 dark:bg-black/40 p-0.5 border border-[var(--glass-border)]">
            <button
              onClick={() => setMode("visual")}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                mode === "visual"
                  ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                  : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
              }`}
            >
              <LayoutTemplate className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
              <span>Studio Blocks</span>
            </button>
            <button
              onClick={() => setMode("raw")}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                mode === "raw"
                  ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold shadow-sm border border-white/20"
                  : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
              }`}
            >
              <AlignLeft className="h-3 w-3" style={{ color: "var(--accent-secondary)" }} />
              <span>Plain Script</span>
            </button>
          </div>
        </div>

        {/* Center: Template & Auto-Tag */}
        <div className="flex items-center space-x-2">
          {/* Custom Template Dropdown Popover */}
          <div ref={templateRef} className="relative shrink-0">
            <motion.button
              {...buttonSubtleTapMotion}
              onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
              className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-white/20 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
              <span className="font-medium text-[11px]">Templates ({TEMPLATES.length})</span>
              <ChevronDown className="h-3 w-3 opacity-40 shrink-0" />
            </motion.button>

            <AnimatePresence>
              {templateDropdownOpen && (
                <motion.div
                  {...dropdownMotion}
                  className="glass-popover absolute left-0 top-full mt-1.5 w-64 rounded-2xl p-2 z-50 text-[var(--text-main)]"
                >
                  <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] border-b border-[var(--glass-border)] pb-1">
                    Select Story Format
                  </div>
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          handleTemplateSelectTrigger(t.id);
                          setTemplateDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition hover:bg-white/10 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span>{t.icon}</span>
                          <div className="truncate">
                            <span className="font-medium text-[11px] block">{t.name}</span>
                            <span className="text-[9px] text-[var(--text-faint)] block truncate">{t.context || t.scene}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            {...buttonTapMotion}
            onClick={() => setSelectedTemplateForModal(TEMPLATES[0])}
            className="flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition cursor-pointer"
            style={{
              backgroundColor: "var(--accent-glow)",
              borderColor: "var(--accent-primary)",
              color: "var(--accent-primary)",
            }}
            title="Auto-apply director scene notes, emotions, and pauses"
          >
            <Wand2 className="h-3 w-3" />
            <span className="hidden sm:inline">Auto-Tag</span>
          </motion.button>
        </div>

        {/* Right: Tag Palette Toggle */}
        <div className="flex items-center space-x-2">
          <motion.button
            {...buttonSubtleTapMotion}
            onClick={() => setPaletteOpen(!paletteOpen)}
            className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              paletteOpen
                ? "font-semibold shadow-sm"
                : "border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text-main)]"
            }`}
            style={{
              backgroundColor: paletteOpen ? "var(--accent-glow)" : undefined,
              borderColor: paletteOpen ? "var(--accent-primary)" : undefined,
              color: paletteOpen ? "var(--accent-primary)" : undefined,
            }}
            title="Toggle Draggable Tags Drawer"
          >
            <Tag className="h-3 w-3" />
            <span>Tags Drawer</span>
          </motion.button>
        </div>
      </div>


      {/* 2. Sleek Draggable Tags Drawer (Collapsible) */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3.5 py-2 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
                {PALETTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedPaletteCat(cat.id)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                      selectedPaletteCat === cat.id
                        ? "bg-white/[0.2] dark:bg-white/[0.14] font-semibold border border-white/20"
                        : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
                    }`}
                    style={{
                      color: selectedPaletteCat === cat.id ? "var(--accent-primary)" : undefined,
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-[var(--text-faint)] shrink-0 hidden sm:inline">
                Drag badge onto any word
              </span>
            </div>

            {/* Draggable Tags Strip */}
            <div className="flex items-center overflow-x-auto space-x-1.5 py-0.5 scrollbar-none">
              {paletteTags.slice(0, 18).map((tag) => (
                <div
                  key={tag.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", tag.syntax + " ");
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => {
                    setSelectedInsertTag(tag);
                    setInsertModalOpen(true);
                  }}
                  className="group flex cursor-grab active:cursor-grabbing items-center space-x-1 shrink-0 rounded-md border border-[var(--glass-border)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] font-medium transition hover:border-[var(--accent-primary)] cursor-pointer"
                  style={{
                    color: "var(--text-main)",
                  }}
                  title={`Click to insert '${tag.syntax}' at specific location, or drag into text`}
                >
                  <GripVertical className="h-2 w-2 opacity-40 group-hover:opacity-100" />
                  <span className="font-semibold" style={{ color: "var(--accent-primary)" }}>
                    {tag.syntax}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Tag Notification Banner */}
      <AnimatePresence>
        {autoTagSuccessNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center space-x-2 border-b px-3.5 py-1.5 text-xs"
            style={{
              backgroundColor: "var(--accent-glow)",
              borderColor: "var(--accent-primary)",
              color: "var(--accent-primary)",
            }}
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>{autoTagSuccessNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Script Canvas Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-16 space-y-3">
        {mode === "visual" ? (
          <>
            {/* Scene Context Accordion (Clean summary when collapsed) */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 backdrop-blur-md">
              <button
                onClick={() => setShowDirectorDetails(!showDirectorDetails)}
                className="flex w-full items-center justify-between text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <SlidersHorizontal className="h-3 w-3 shrink-0" style={{ color: "var(--accent-primary)" }} />
                  <span className="font-medium text-[var(--text-main)]">Director Scene & Pace:</span>
                  <span className="truncate text-[11px] text-[var(--text-muted)]">
                    {scene ? `${scene.slice(0, 55)}...` : "None"} • {pacing || "Default"}
                  </span>
                </div>
                {showDirectorDetails ? (
                  <ChevronUp className="h-3 w-3 text-[var(--text-faint)] shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[var(--text-faint)] shrink-0 ml-2" />
                )}
              </button>

              <AnimatePresence>
                {showDirectorDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 mt-2 border-t border-[var(--glass-border)]"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-faint)] uppercase">
                        Scene
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. In an intimate podcast studio..."
                        value={scene}
                        onChange={(e) => setScene(e.target.value)}
                        className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-faint)] uppercase">
                        Pacing
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. energetic, deliberate..."
                        value={pacing}
                        onChange={(e) => setPacing(e.target.value)}
                        className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--text-faint)] uppercase">
                        Performance Style
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. conversational, broadcast..."
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Blocks List */}
            <div className="space-y-2.5">
              {blocks.map((block, idx) => {
                const isOver = dragOverIdx === idx;
                return (
                  <motion.div
                    key={block.id}
                    layout
                    onDragOver={(e) => handleBlockDragOver(e, idx)}
                    onDrop={() => handleBlockDrop(idx)}
                    className={`rounded-2xl border p-3.5 transition backdrop-blur-xl ${
                      isOver
                        ? "border-[var(--accent-primary)] shadow-lg"
                        : "border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-[var(--glass-border-highlight)]"
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div
                          draggable={true}
                          onDragStart={() => handleBlockDragStart(idx)}
                          className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--text-faint)] hover:text-[var(--text-main)]"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-3 w-3" />
                        </div>
                        <User className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
                        <input
                          type="text"
                          value={block.speaker}
                          onChange={(e) => handleUpdateBlock(block.id, "speaker", e.target.value)}
                          className="rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-semibold text-[var(--text-main)] hover:border-[var(--glass-border)] focus:border-[var(--accent-primary)] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => insertTagToBlock(block.id, "[pause: 1.0s]")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          +pause
                        </button>
                        <button
                          onClick={() => insertTagToBlock(block.id, "[warm]")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-mono text-amber-500 dark:text-amber-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                        >
                          +warm
                        </button>

                        {blocks.length > 1 && (
                          <button
                            onClick={() => handleRemoveBlock(block.id)}
                            className="rounded p-1 text-[var(--text-faint)] hover:text-red-400 transition ml-1 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dialogue Textarea */}
                    <textarea
                      value={block.text}
                      onChange={(e) => handleUpdateBlock(block.id, "text", e.target.value)}
                      placeholder="Type dialogue here. Drag badges from the drawer or drop tags..."
                      rows={Math.max(2, Math.min(6, Math.ceil(block.text.length / 50)))}
                      className="mt-2.5 w-full resize-none rounded-xl border border-transparent bg-transparent p-1 font-mono text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--glass-border)] focus:bg-black/5 dark:focus:bg-black/20 focus:p-2 focus:outline-none transition leading-relaxed"
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Add Block Button */}
            <button
              onClick={handleAddBlock}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-[var(--glass-border)] bg-[var(--bg-surface)] py-2.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Dialogue Block</span>
            </button>
          </>
        ) : (
          /* Raw Editor Mode */
          <div className="flex h-full flex-col">
            <textarea
              value={textContent}
              onChange={(e) => handleRawChange(e.target.value)}
              placeholder="Compose your script here... Use [tag] or <gesture> tags anywhere in the dialogue."
              className="h-full w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-4 font-mono text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Status & Statistics Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--glass-border)] bg-[var(--bg-surface)] px-4 py-2 text-xs">
        <div className="flex items-center space-x-3 text-[var(--text-muted)] text-[11px]">
          <span className="flex items-center space-x-1">
            <Type className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
            <span>{charCount} chars</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <BookOpen className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
            <span>{wordCount} words</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" style={{ color: "var(--accent-secondary)" }} />
            <span>~{formattedDuration}</span>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-faint)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span>Local Studio SQLite</span>
        </div>
      </div>

      {/* Modal: Template Choice */}
      <AnimatePresence>
        {selectedTemplateForModal && (
          <motion.div
            key="template-choice-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTemplateForModal(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              key="template-choice-card"
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-5 shadow-2xl text-[var(--text-main)]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{selectedTemplateForModal.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">
                      {selectedTemplateForModal.name}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">{selectedTemplateForModal.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplateForModal(null)}
                  className="text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5">
                <button
                  onClick={() => applyAutoTagToCurrentScript(selectedTemplateForModal)}
                  className="group flex w-full flex-col text-left rounded-xl border p-3.5 transition cursor-pointer"
                  style={{
                    backgroundColor: "var(--accent-glow)",
                    borderColor: "var(--accent-primary)",
                  }}
                >
                  <div className="flex items-center space-x-1.5">
                    <Wand2 className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>
                      Auto-Tag & Style My Current Script
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Keeps all your written words, while injecting scene notes, emotion markers, and pauses.
                  </p>
                </button>

                <button
                  onClick={() => applyDemoTemplate(selectedTemplateForModal)}
                  className="group flex w-full flex-col text-left rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5 transition hover:border-[var(--accent-primary)] cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5">
                    <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      Replace with Archetype Demo Script
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Overwrites the editor with the pre-written showcase script.
                  </p>
                </button>
              </div>

              <div className="mt-3.5 flex justify-end">
                <button
                  onClick={() => setSelectedTemplateForModal(null)}
                  className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Tag Insertion Modal */}
      <TagInsertionDialog
        isOpen={insertModalOpen}
        onClose={() => {
          setInsertModalOpen(false);
          setSelectedInsertTag(null);
        }}
        tag={selectedInsertTag}
        onAuditionTag={handleAuditionTag}
        isPlayingAudition={selectedInsertTag ? playingTagId === selectedInsertTag.id : false}
        isLoadingAudition={selectedInsertTag ? loadingTagId === selectedInsertTag.id : false}
      />
    </div>
  );
};
