import { create } from "zustand";
import { AudioFileItem } from "@kobeanaudio/types";
import {
  deleteAudioFile,
  fetchAudioFiles,
  pickNativeFolder,
  revealInFinder,
  validateTargetDirectory,
} from "@/lib/api";

interface AudioFilesState {
  files: AudioFileItem[];
  isLoading: boolean;
  searchQuery: string;
  selectedFilter: "all" | "exports" | "takes";
  isSidebarOpen: boolean;
  lastExportedPath: string | null;
  customDirectories: string[];

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: "all" | "exports" | "takes") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  loadAudioFiles: () => Promise<void>;
  removeAudioFile: (filename: string) => Promise<void>;
  revealInExplorer: (pathOrFilename: { path?: string; filename?: string }) => Promise<void>;
  pickCustomFolder: () => Promise<string | null>;
  addCustomDirectory: (path: string) => void;
  setLastExportedPath: (path: string | null) => void;
}

const CUSTOM_DIRS_KEY = "kobeanaudio_custom_dirs_v1";

export const useAudioFilesStore = create<AudioFilesState>((set, get) => ({
  files: [],
  isLoading: false,
  searchQuery: "",
  selectedFilter: "all",
  isSidebarOpen: false,
  lastExportedPath: null,
  customDirectories: ["~/Downloads", "~/Desktop", "~/Music", "./audio_output"],

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setLastExportedPath: (lastExportedPath) => set({ lastExportedPath }),

  loadAudioFiles: async () => {
    set({ isLoading: true });
    try {
      const files = await fetchAudioFiles();
      set({ files, isLoading: false });
    } catch (e) {
      console.error("[AudioFilesStore] Error loading files:", e);
      set({ isLoading: false });
    }
  },

  removeAudioFile: async (filename: string) => {
    try {
      await deleteAudioFile(filename);
      set((state) => ({
        files: state.files.filter((f) => f.filename !== filename),
      }));
    } catch (e) {
      console.error("[AudioFilesStore] Error deleting file:", e);
      throw e;
    }
  },

  revealInExplorer: async (pathOrFilename) => {
    try {
      await revealInFinder(pathOrFilename);
    } catch (e) {
      console.error("[AudioFilesStore] Error revealing in Finder:", e);
    }
  },

  pickCustomFolder: async () => {
    try {
      const res = await pickNativeFolder();
      if (res.status === "selected" && res.path) {
        get().addCustomDirectory(res.path);
        return res.path;
      }
      return null;
    } catch (e) {
      console.error("[AudioFilesStore] Error picking folder:", e);
      return null;
    }
  },

  addCustomDirectory: (path: string) => {
    const trimmed = path.trim();
    if (!trimmed) return;
    const existing = get().customDirectories;
    if (!existing.includes(trimmed)) {
      const updated = [trimmed, ...existing];
      if (typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_DIRS_KEY, JSON.stringify(updated));
      }
      set({ customDirectories: updated });
    }
  },
}));
