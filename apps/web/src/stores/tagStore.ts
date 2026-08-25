import { create } from "zustand";
import { BUILTIN_TAGS, TagCategory, TagItem } from "@/lib/tagDefinitions";
import { useProjectStore } from "./projectStore";

export type StudioTag = TagItem;
export type CustomTag = TagItem;
export type { TagCategory, TagItem };

interface TagStoreState {
  tags: TagItem[];
  customTags: TagItem[];
  searchQuery: string;
  selectedCategory: TagCategory | "all";
  selectedEngineFilter: string | "all";

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: TagCategory | "all") => void;
  setSelectedEngineFilter: (engine: string | "all") => void;
  loadSavedCustomTags: () => void;
  addCustomTag: (newTag: Omit<TagItem, "id" | "isCustom">) => TagItem;
  deleteCustomTag: (id: string) => void;
  insertTagIntoScript: (syntax: string) => void;
  exportCustomTags: () => string;
  importCustomTags: (jsonStr: string) => { success: boolean; count: number; error?: string };
}

const STORAGE_KEY = "kobeanaudio_custom_tags_v1";

export const useTagStore = create<TagStoreState>((set, get) => ({
  tags: BUILTIN_TAGS,
  customTags: [],
  searchQuery: "",
  selectedCategory: "all",
  selectedEngineFilter: "all",

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedEngineFilter: (selectedEngineFilter) => set({ selectedEngineFilter }),

  loadSavedCustomTags: () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TagItem[];
        if (Array.isArray(parsed)) {
          set({
            customTags: parsed,
            tags: [...BUILTIN_TAGS, ...parsed],
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load custom tags from localStorage", e);
    }
  },

  addCustomTag: (newTagData) => {
    const newTag: TagItem = {
      ...newTagData,
      id: `custom-tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isCustom: true,
    };

    const updatedCustom = [...get().customTags, newTag];
    set({
      customTags: updatedCustom,
      tags: [...BUILTIN_TAGS, ...updatedCustom],
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
      } catch (e) {
        console.error("Failed to save custom tag", e);
      }
    }

    return newTag;
  },

  deleteCustomTag: (id) => {
    const updatedCustom = get().customTags.filter((t) => t.id !== id);
    set({
      customTags: updatedCustom,
      tags: [...BUILTIN_TAGS, ...updatedCustom],
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
      } catch (e) {
        console.error("Failed to update custom tags in localStorage", e);
      }
    }
  },

  insertTagIntoScript: (syntax: string) => {
    const { textContent, setTextContent } = useProjectStore.getState();
    const updated = textContent ? `${textContent} ${syntax} ` : `${syntax} `;
    setTextContent(updated);
  },

  exportCustomTags: () => {
    const custom = get().customTags;
    return JSON.stringify(custom, null, 2);
  },

  importCustomTags: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: "Invalid JSON: root must be an array of tags." };
      }

      const validatedTags: TagItem[] = [];
      for (const item of parsed) {
        if (!item.name || !item.syntax) continue;
        validatedTags.push({
          id: `custom-tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: String(item.name).trim(),
          syntax: String(item.syntax).trim(),
          category: (item.category as TagCategory) || "custom",
          description: String(item.description || ""),
          exampleSnippet: String(item.exampleSnippet || item.syntax || ""),
          engines: Array.isArray(item.engines) ? item.engines : ["gemini", "orpheus", "kokoro"],
          isCustom: true,
        });
      }

      if (validatedTags.length === 0) {
        return { success: false, count: 0, error: "No valid tags found in JSON." };
      }

      const existing = get().customTags;
      const combined = [...existing, ...validatedTags];
      set({
        customTags: combined,
        tags: [...BUILTIN_TAGS, ...combined],
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      }

      return { success: true, count: validatedTags.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || "Failed to parse JSON." };
    }
  },
}));
