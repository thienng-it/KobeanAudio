import { create } from "zustand";

export type StudioThemeId =
  | "system"
  | "studio-dark"
  | "studio-light"
  | "claude-warm"
  | "claude-dark"
  | "cyber-mist"
  | "warm-espresso"
  | "midnight-sage"
  | "arctic-aurora"
  | "obsidian-violet";

export interface StudioTheme {
  id: StudioThemeId;
  name: string;
  category: "standard" | "atmosphere";
  tagline: string;
  icon: string;
  dots: [string, string, string];
  isLight?: boolean;
}

export const STUDIO_THEMES: StudioTheme[] = [
  // Standard & Basics
  {
    id: "system",
    name: "System Default",
    category: "standard",
    tagline: "Syncs automatically with macOS Light/Dark",
    icon: "💻",
    dots: ["#38BDF8", "#F8FAFC", "#0F172A"],
  },
  {
    id: "claude-dark",
    name: "Claude Dark",
    category: "standard",
    tagline: "Warm Charcoal & Burnt Terracotta",
    icon: "🍫",
    dots: ["#D97706", "#CC6B49", "#1F1D1A"],
  },
  {
    id: "claude-warm",
    name: "Claude Warm",
    category: "standard",
    tagline: "Warm Linen Paper & Terracotta (Claude Style)",
    icon: "🏺",
    dots: ["#D97706", "#CC6B49", "#FBF7F1"],
    isLight: true,
  },
  {
    id: "studio-dark",
    name: "Studio Dark",
    category: "standard",
    tagline: "Minimalist OLED Obsidian & Cool Slate",
    icon: "🌑",
    dots: ["#64748B", "#94A3B8", "#090A0F"],
  },
  {
    id: "studio-light",
    name: "Studio Light",
    category: "standard",
    tagline: "Frosted Porcelain & Crisp Zinc (Apple Light)",
    icon: "☀️",
    dots: ["#0284C7", "#E2E8F0", "#FFFFFF"],
    isLight: true,
  },

  // Atmospheric Glass Themes
  {
    id: "cyber-mist",
    name: "Cyber Mist",
    category: "atmosphere",
    tagline: "Soft Nordic Slate & Icy Cyan (Eyes-Friendly)",
    icon: "🌌",
    dots: ["#38BDF8", "#818CF8", "#0F172A"],
  },
  {
    id: "warm-espresso",
    name: "Warm Espresso",
    category: "atmosphere",
    tagline: "Mocha Obsidian & Amber Gold (Analog Warmth)",
    icon: "☕",
    dots: ["#F59E0B", "#D97706", "#1C1917"],
  },
  {
    id: "midnight-sage",
    name: "Midnight Sage",
    category: "atmosphere",
    tagline: "Deep Eucalyptus & Soothing Mint",
    icon: "🌿",
    dots: ["#10B981", "#34D399", "#064E3B"],
  },
  {
    id: "arctic-aurora",
    name: "Arctic Aurora",
    category: "atmosphere",
    tagline: "Luminous Teal & Electric Ice Glass",
    icon: "❄️",
    dots: ["#06B6D4", "#2DD4BF", "#083344"],
  },
  {
    id: "obsidian-violet",
    name: "Obsidian Violet",
    category: "atmosphere",
    tagline: "Deep Midnight Velvet & Twilight Lilac",
    icon: "🪐",
    dots: ["#A855F7", "#C084FC", "#1E1B4B"],
  },
];

interface ThemeState {
  theme: StudioThemeId;
  resolvedTheme: string;
  setTheme: (theme: StudioThemeId) => void;
  applyTheme: (theme: StudioThemeId) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "claude-dark",
  resolvedTheme: "claude-dark",

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("kobeanaudio_theme", theme);
      } catch {}
    }
    get().applyTheme(theme);
  },

  applyTheme: (theme) => {
    if (typeof window === "undefined") return;

    let target = theme;
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      target = isDark ? "studio-dark" : "studio-light";
    }

    set({ resolvedTheme: target });
    document.documentElement.setAttribute("data-theme", target);
  },
}));
