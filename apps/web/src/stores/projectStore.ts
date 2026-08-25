import { create } from "zustand";
import { GenerationRecord, Project } from "@kobeanaudio/types";
import { createProject, deleteProject, fetchProjectGenerations, fetchProjects, updateProject } from "@/lib/api";

const DEFAULT_PASSAGE = `Read the following transcript based on the director's note.

# Director's note
Pace: Natural conversational pace. Accent: British (RP).

## Scene:
A cozy, sunlit recording studio in autumn with soft ambient warmth and gentle background acoustics.

## Sample Context:
Welcome to KobeanAudio Studio. Use a warm, confident, clear storytelling voice with natural inflection and comfortable pauses between sentences.

## Transcript:
Speaking 1: [reading] [title] Welcome to KobeanAudio [warm, celebratory] [pause: 1.0s]

[reading] [warm, informative] This is the new standard in AI speech synthesis, powered by cutting-edge voice models right here on your Mac. <laugh> It sounds remarkably human! [pause: 1.5s]

[reading] [excited, clear] You can choose between Kokoro for lightning speed, Orpheus for emotional narration, Chatterbox for voice cloning, or Google Gemini for studio director notes. [brief pause] Enjoy creating!`;

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  textContent: string;
  generations: GenerationRecord[];
  isLoadingProjects: boolean;
  isSaving: boolean;
  error: string | null;

  setTextContent: (text: string) => void;
  setActiveProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createNewProject: (name?: string) => Promise<Project>;
  saveCurrentProject: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  loadGenerations: (projectId: string) => Promise<void>;
  addGenerationRecord: (gen: GenerationRecord) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  textContent: DEFAULT_PASSAGE,
  generations: [],
  isLoadingProjects: false,
  isSaving: false,
  error: null,

  setTextContent: (textContent) => set({ textContent }),

  setActiveProject: (project) => {
    set({
      activeProject: project,
      textContent: project ? project.textContent : DEFAULT_PASSAGE,
    });
    if (project) {
      get().loadGenerations(project.id);
    }
  },

  loadProjects: async () => {
    set({ isLoadingProjects: true, error: null });
    try {
      const projects = await fetchProjects();
      set({ projects, isLoadingProjects: false });
      if (projects.length > 0 && !get().activeProject) {
        get().setActiveProject(projects[0]);
      }
    } catch (e: any) {
      set({ error: e.message, isLoadingProjects: false });
    }
  },

  createNewProject: async (name = "Untitled Audio Studio") => {
    try {
      const newProj = await createProject({
        name,
        description: "Studio narration project",
        text_content: get().textContent,
        engine: "kokoro",
        voice_id: "af_heart",
      });
      set((state) => ({
        projects: [newProj, ...state.projects],
        activeProject: newProj,
      }));
      return newProj;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  saveCurrentProject: async () => {
    const current = get().activeProject;
    if (!current) return;
    set({ isSaving: true });
    try {
      const updated = await updateProject(current.id, {
        text_content: get().textContent,
      });
      set((state) => ({
        activeProject: updated,
        projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
        isSaving: false,
      }));
    } catch (e: any) {
      set({ isSaving: false, error: e.message });
    }
  },

  removeProject: async (id) => {
    try {
      await deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        activeProject: state.activeProject?.id === id ? null : state.activeProject,
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadGenerations: async (projectId) => {
    try {
      const gens = await fetchProjectGenerations(projectId);
      set({ generations: gens });
    } catch (e: any) {
      console.error("Error loading generations:", e);
    }
  },

  addGenerationRecord: (gen) => {
    set((state) => ({
      generations: [gen, ...state.generations],
    }));
  },
}));
