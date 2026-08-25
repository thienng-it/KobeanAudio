"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag as TagIcon,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  Terminal,
  Wand2,
  GripVertical,
  X,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useTagStore, CustomTag, StudioTag, TagCategory } from "@/stores/tagStore";
import { useProjectStore } from "@/stores/projectStore";
import {
  dropdownMotion,
  buttonTapMotion,
  buttonSubtleTapMotion,
  cardHoverMotion,
} from "@/lib/motion";

interface TagsManagerPageProps {
  onNavigateToStudio?: () => void;
}

const CATEGORIES: { id: TagCategory | "all"; label: string; icon: string }[] = [
  { id: "all", label: "All Tags", icon: "✨" },
  { id: "emotion", label: "Emotions & Inflections", icon: "🎭" },
  { id: "pause", label: "Pacing & Pauses", icon: "⏱️" },
  { id: "gesture", label: "Audio Gestures", icon: "🗣️" },
  { id: "director", label: "Director Notes", icon: "🎬" },
  { id: "ssml", label: "SSML Markup", icon: "⚡" },
  { id: "custom", label: "Custom Tags", icon: "🌟" },
];

export const TagsManagerPage: React.FC<TagsManagerPageProps> = ({ onNavigateToStudio }) => {
  const {
    tags,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    addCustomTag,
    deleteCustomTag,
    exportCustomTags,
    importCustomTags,
  } = useTagStore();

  const { textContent, setTextContent } = useProjectStore();

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [playgroundText, setPlaygroundText] = useState(
    "[reading] [title] KobeanAudio Neural Studio [warm, celebratory] [pause: 1.0s]\n<laugh> Experience effortless control over 200+ director notes and expressive voice tags."
  );
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // New Custom Tag Form State
  const [newTagName, setNewTagName] = useState("");
  const [newTagSyntax, setNewTagSyntax] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>("emotion");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagExample, setNewTagExample] = useState("");
  const [newTagEngines, setNewTagEngines] = useState<
    ("gemini" | "orpheus" | "kokoro" | "chatterbox" | "piper" | "qwen3")[]
  >(["gemini", "orpheus", "kokoro"]);

  const selectedCategoryItem = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0],
    [selectedCategory]
  );

  const selectedCategoryCount = useMemo(() => {
    return selectedCategory === "all"
      ? tags.length
      : tags.filter((t) => t.category === selectedCategory).length;
  }, [tags, selectedCategory]);

  // Filtered tag list
  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      const matchCat =
        selectedCategory === "all" ? true : t.category === selectedCategory;
      const matchSearch = searchQuery.trim()
        ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchCat && matchSearch;
    });
  }, [tags, selectedCategory, searchQuery]);

  const handleCopySyntax = (tag: StudioTag) => {
    navigator.clipboard.writeText(tag.syntax);
    setCopiedId(tag.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleInsertTag = (tag: StudioTag) => {
    setTextContent(textContent ? `${textContent} ${tag.syntax} ` : `${tag.syntax} `);
    setInsertedId(tag.id);
    setTimeout(() => setInsertedId(null), 1800);
  };

  const handleInsertIntoPlayground = (syntax: string) => {
    setPlaygroundText((prev) => (prev ? `${prev} ${syntax} ` : `${syntax} `));
  };

  const handleSendPlaygroundToStudio = () => {
    setTextContent(playgroundText);
    if (onNavigateToStudio) onNavigateToStudio();
  };

  const handleCreateCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !newTagSyntax.trim()) return;

    let formattedSyntax = newTagSyntax.trim();
    if (!formattedSyntax.startsWith("[") && !formattedSyntax.startsWith("<")) {
      formattedSyntax = `[${formattedSyntax}]`;
    }

    addCustomTag({
      name: newTagName.trim(),
      syntax: formattedSyntax,
      category: newTagCategory,
      description: newTagDescription.trim() || "Custom user-defined studio tag",
      exampleSnippet: newTagExample.trim() || formattedSyntax,
      engines: newTagEngines,
    });

    setNewTagName("");
    setNewTagSyntax("");
    setNewTagDescription("");
    setNewTagExample("");
    setCreateModalOpen(false);
  };

  const handleExport = () => {
    const jsonStr = exportCustomTags();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kobeanaudio_custom_tags_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importCustomTags(content);
      if (res.success) {
        setImportNotice(`Successfully imported ${res.count} custom tags.`);
        setTimeout(() => setImportNotice(null), 3500);
      } else {
        setImportNotice(`Failed to import tags: ${res.error}`);
        setTimeout(() => setImportNotice(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-main)] select-none">
      {/* 1. Header Toolbar */}
      <div className="relative z-40 overflow-visible border-b border-[var(--glass-border)] bg-[var(--bg-surface)] px-6 py-3 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg p-[1px] shadow-sm shrink-0"
              style={{ backgroundImage: "var(--accent-gradient)" }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[var(--bg-base)]">
                <TagIcon className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-[var(--text-main)]">
                  Tags & Expressive Library
                </h1>
                <span
                  className="rounded-full border border-[var(--glass-border)] px-2 py-0.2 font-mono text-[10px]"
                  style={{
                    backgroundColor: "var(--accent-glow)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {tags.length}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Click any tag to copy syntax or insert directly into dialogue blocks.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <label className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-muted)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-primary)] hover:text-[var(--text-main)]">
              <Upload className="h-3 w-3" style={{ color: "var(--accent-primary)" }} />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs text-[var(--text-muted)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-secondary)] hover:text-[var(--text-main)] cursor-pointer"
              title="Export custom tags"
            >
              <Download className="h-3 w-3" style={{ color: "var(--accent-secondary)" }} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-lg border px-3 py-1 text-xs font-semibold shadow-sm transition cursor-pointer"
              style={{
                backgroundColor: "var(--accent-glow)",
                borderColor: "var(--accent-primary)",
                color: "var(--accent-primary)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Tag</span>
            </button>
          </div>
        </div>

        {importNotice && (
          <div
            className="mt-2 rounded-xl border px-3 py-1.5 text-xs"
            style={{
              backgroundColor: "var(--accent-glow)",
              borderColor: "var(--accent-primary)",
              color: "var(--accent-primary)",
            }}
          >
            {importNotice}
          </div>
        )}

        {/* 2. Unified Search & Category Dropdown Selector */}
        <div className="mt-2.5 flex items-center space-x-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              type="text"
              placeholder="Filter tags by name, mood, or syntax..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] py-1.5 pl-8.5 pr-7 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Clean Category Dropdown Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center space-x-2 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 text-xs text-[var(--text-main)] shadow-sm backdrop-blur-md transition hover:border-[var(--accent-primary)] cursor-pointer"
            >
              <span className="text-sm">{selectedCategoryItem.icon}</span>
              <span className="font-semibold">{selectedCategoryItem.label}</span>
              <span
                className="rounded-full px-1.5 py-0.2 text-[9px] font-mono border border-[var(--glass-border)]"
                style={{
                  backgroundColor: "var(--accent-glow)",
                  color: "var(--accent-primary)",
                }}
              >
                {selectedCategoryCount}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[var(--text-faint)] transition duration-200 ${
                  categoryDropdownOpen ? "rotate-180 text-[var(--accent-primary)]" : ""
                }`}
              />
            </button>

            {/* Dropdown Floating Popover */}
            <AnimatePresence>
              {categoryDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCategoryDropdownOpen(false)}
                  />
                  <motion.div
                    {...dropdownMotion}
                    className="glass-popover absolute left-0 top-full mt-1.5 w-64 rounded-2xl p-1.5 z-50 text-[var(--text-main)]"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                      Filter by Category
                    </div>
                    <div className="space-y-0.5 max-h-60 overflow-y-auto">
                      {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        const count =
                          cat.id === "all"
                            ? tags.length
                            : tags.filter((t) => t.category === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-white/[0.2] dark:bg-white/[0.14] text-[var(--text-main)] font-semibold border border-white/20 shadow-sm"
                                : "text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{cat.icon}</span>
                              <span className="font-medium">{cat.label}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="rounded-full bg-black/10 dark:bg-black/30 px-1.5 py-0.2 text-[9px] font-mono opacity-80">
                                {count}
                              </span>
                              {isSelected && (
                                <Check
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{ color: "var(--accent-primary)" }}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Sleek Compact Tag Cards Grid + Live Test Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Tag Cards Responsive Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredTags.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <TagIcon className="h-9 w-9 text-[var(--text-faint)] mb-2.5 opacity-40" />
              <p className="text-sm font-medium text-[var(--text-muted)]">No tags match your search</p>
              <p className="text-xs text-[var(--text-faint)] mt-0.5">
                Try searching for a different keyword or select &quot;All Tags&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredTags.map((tag) => {
                const isCopied = copiedId === tag.id;
                const isInserted = insertedId === tag.id;

                return (
                  <motion.div
                    key={tag.id}
                    layout
                    whileHover={{ scale: 1.01 }}
                    className="group relative flex flex-col justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3.5 shadow-sm backdrop-blur-xl transition hover:border-[var(--glass-border-highlight)] hover:bg-[var(--bg-surface-elevated)]"
                  >
                    <div>
                      {/* Card Header: Syntax Pill + Category */}
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <div
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", tag.syntax + " ");
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => handleCopySyntax(tag)}
                          className="flex cursor-grab active:cursor-grabbing items-center space-x-1.5 rounded-lg border px-2 py-0.8 font-mono text-xs font-bold transition shadow-sm hover:opacity-90"
                          style={{
                            backgroundColor: "var(--accent-glow)",
                            borderColor: "var(--accent-primary)",
                            color: "var(--accent-primary)",
                          }}
                          title="Click to copy, or drag into dialogue"
                        >
                          <GripVertical className="h-3 w-3 opacity-50" />
                          <code>{tag.syntax}</code>
                        </div>

                        <span className="rounded-md bg-black/5 dark:bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                          {tag.category}
                        </span>
                      </div>

                      {/* Tag Name & Short Description */}
                      <h3 className="text-xs font-bold text-[var(--text-main)] transition">
                        {tag.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {tag.description}
                      </p>

                      {/* Inline Quote Snippet */}
                      {tag.exampleSnippet && (
                        <div className="mt-2 rounded-lg bg-black/5 dark:bg-black/25 px-2 py-1 font-mono text-[10px] text-[var(--text-muted)] truncate border border-[var(--glass-border)]">
                          <span className="text-[var(--text-faint)] select-none mr-1">“</span>
                          {tag.exampleSnippet}
                          <span className="text-[var(--text-faint)] select-none ml-1">”</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Quick Actions */}
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--glass-border)] pt-2.5">
                      {/* Compatible Engines Indicators */}
                      <div className="flex items-center space-x-1">
                        {tag.engines.slice(0, 3).map((eng) => (
                          <span
                            key={eng}
                            className="rounded bg-black/5 dark:bg-white/5 px-1 py-0.2 text-[8px] font-mono uppercase text-[var(--text-faint)]"
                            title={`Compatible with ${eng}`}
                          >
                            {eng === "gemini" ? "Gemini" : eng}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopySyntax(tag)}
                          className={`flex items-center space-x-1 rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold"
                              : "text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                          }`}
                          title="Copy syntax to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleInsertTag(tag)}
                          className="flex items-center space-x-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition cursor-pointer"
                          style={{
                            backgroundColor: isInserted ? "var(--accent-glow)" : "transparent",
                            color: "var(--accent-primary)",
                          }}
                          title="Insert tag directly into Studio script"
                        >
                          {isInserted ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Inserted</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>Insert</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleInsertIntoPlayground(tag.syntax)}
                          title="Send to Live Playground"
                          className="rounded-lg p-1 text-[var(--text-faint)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)] transition cursor-pointer"
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>

                        {tag.isCustom && (
                          <button
                            onClick={() => deleteCustomTag(tag.id)}
                            className="rounded-lg p-1 text-[var(--text-faint)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete custom tag"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Dock: Interactive Live Tag Playground */}
        <div className="hidden xl:flex w-80 flex-col border-l border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] backdrop-blur-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-3.5 w-3.5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                Live Tag Playground
              </h2>
            </div>
            <button
              onClick={() => setPlaygroundText("")}
              className="text-[10px] text-[var(--text-faint)] hover:text-[var(--text-main)] transition cursor-pointer"
              title="Clear playground"
            >
              Clear
            </button>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Click <Wand2 className="inline h-3 w-3" style={{ color: "var(--accent-primary)" }} /> on any tag card to append it here and test the script structure.
          </p>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1">
              Formatted Preview:
            </label>
            <textarea
              value={playgroundText}
              onChange={(e) => setPlaygroundText(e.target.value)}
              className="w-full flex-1 resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 font-mono text-xs text-[var(--text-main)] leading-relaxed focus:border-[var(--accent-primary)] focus:outline-none"
              placeholder="Paste or compose tagged script here..."
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-[var(--glass-border)]">
            <button
              onClick={handleSendPlaygroundToStudio}
              className="flex w-full items-center justify-center space-x-2 rounded-xl py-2 text-xs font-semibold text-white shadow-md transition cursor-pointer"
              style={{
                backgroundImage: "var(--accent-gradient)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Apply Script to Studio</span>
            </button>

            {onNavigateToStudio && (
              <button
                onClick={onNavigateToStudio}
                className="flex w-full items-center justify-center space-x-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                <span>Back to Studio Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Custom Tag */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            key="create-custom-tag-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setCreateModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              key="create-custom-tag-card"
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-5 shadow-2xl text-[var(--text-main)]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center space-x-2">
                  <TagIcon className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Create Custom Studio Tag</h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustomTag} className="mt-3.5 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-[var(--text-main)]">Tag Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarcastic Smirk, Dramatic Whisper..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-main)]">Tag Syntax *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. [sarcastic] or <smirk>"
                      value={newTagSyntax}
                      onChange={(e) => setNewTagSyntax(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--accent-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-main)]">Category</label>
                    <select
                      value={newTagCategory}
                      onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}
                      className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                    >
                      <option value="emotion">Emotion & Mood</option>
                      <option value="pause">Pacing & Pauses</option>
                      <option value="gesture">Audio Gesture</option>
                      <option value="director">Director Style</option>
                      <option value="ssml">SSML Markup</option>
                      <option value="custom">Custom Tag</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-main)]">Description & Effect</label>
                  <input
                    type="text"
                    placeholder="e.g. Inflects a subtle ironic undertone to dialogue."
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-main)]">Example Snippet</label>
                  <input
                    type="text"
                    placeholder="e.g. [sarcastic] Oh, absolutely wonderful news."
                    value={newTagExample}
                    onChange={(e) => setNewTagExample(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--glass-border)]">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white shadow-md transition cursor-pointer"
                    style={{
                      backgroundImage: "var(--accent-gradient)",
                      boxShadow: "0 0 16px var(--accent-glow)",
                    }}
                  >
                    Save Custom Tag
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
