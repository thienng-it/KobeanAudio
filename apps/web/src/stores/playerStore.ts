import { create } from "zustand";

interface PlayerState {
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  showSpectrogram: boolean;
  zoom: number;

  setAudioUrl: (url: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;
  toggleSpectrogram: () => void;
  setZoom: (zoom: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  audioUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  playbackRate: 1.0,
  isMuted: false,
  showSpectrogram: false,
  zoom: 0,

  setAudioUrl: (audioUrl) => set({ audioUrl, currentTime: 0 }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleSpectrogram: () => set((state) => ({ showSpectrogram: !state.showSpectrogram })),
  setZoom: (zoom) => set({ zoom }),
}));
