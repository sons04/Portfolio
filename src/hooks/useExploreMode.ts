import { useGlobeStore } from "../store/globeStore";

export function useExploreMode() {
  const mode = useGlobeStore((s) => s.mode);
  const setMode = useGlobeStore((s) => s.setMode);
  const toggleExplore = useGlobeStore((s) => s.toggleExplore);

  return {
    mode,
    isExplore: mode === "explore",
    isNarrative: mode === "narrative",
    setMode,
    toggleExplore
  };
}
