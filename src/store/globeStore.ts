import { create } from "zustand";

export type GlobeMode = "narrative" | "explore";

interface GlobeState {
  mode: GlobeMode;
  setMode: (mode: GlobeMode) => void;
  toggleExplore: () => void;
}

export const useGlobeStore = create<GlobeState>((set) => ({
  mode: "explore",
  setMode: (mode) => set({ mode }),
  toggleExplore: () =>
    set((s) => ({ mode: s.mode === "narrative" ? "explore" : "narrative" }))
}));
