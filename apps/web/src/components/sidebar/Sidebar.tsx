"use client";

import React, { useState } from "react";
import {
  Folder,
  Plus,
  Trash2,
  Mic,
  Cpu,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
  AudioWaveform,
  Volume2,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useEngineStore } from "@/stores/engineStore";

interface SidebarProps {
  onOpenVoiceClone: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenVoiceClone }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const { projects, activeProject, setActiveProject, createNewProject, removeProject } =
    useProjectStore();
  const { engines, activeEngine } = useEngineStore();

  const activeEngineInfo = engines.find((e) => e.id === activeEngine);
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      className={`relative flex flex-col border-r border-[var(--glass-border)] bg-[var(--bg-surface)] backdrop-blur-2xl transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Title / App Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-lg"
              style={{
                backgroundImage: "var(--accent-gradient)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              <AudioWaveform className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[var(--text-main)]">
              KobeanAudio
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] transition"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Action Buttons */}
      {!collapsed && (
        <div className="space-y-2 p-3">
          <button
            onClick={() => createNewProject("Untitled Studio")}
            className="flex w-full items-center justify-center space-x-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-90"
            style={{
              backgroundImage: "var(--accent-gradient)",
              boxShadow: "0 0 16px var(--accent-glow)",
            }}
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>

          <button
            onClick={onOpenVoiceClone}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[var(--text-main)] transition hover:bg-white/[0.08]"
          >
            <Mic className="h-4 w-4 text-[var(--accent-primary)]" />
            <span>Clone Voice</span>
          </button>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-3">
        {!collapsed && (
          <>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Projects ({projects.length})
            </div>
            <div className="space-y-1">
              {filteredProjects.map((p) => {
                const isActive = activeProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveProject(p)}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs cursor-pointer transition ${
                      isActive
                        ? "bg-white/[0.12] text-[var(--text-main)] border border-[var(--accent-primary)]/40 shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Folder
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-faint)]"
                        }`}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(p.id);
                      }}
                      className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Hardware / Engine Status Widget */}
      {!collapsed && activeEngineInfo && (
        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="flex items-center space-x-1.5 font-medium text-[var(--text-main)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeEngineInfo.name.split(" ")[0]}</span>
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent-primary)]">
                {activeEngineInfo.speed_factor}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-faint)] font-mono">
              <span>RAM: {activeEngineInfo.ram_usage}</span>
              <span>M3 Metal: Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
