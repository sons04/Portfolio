export const theme = {
  colors: {
    bg: "#040816",
    primary: "#6fe7ff",
    accent: "#00d4ff",
    node: "#2dfcdb",
    text: "#e6f1ff",
    muted: "#7f8fa6",
    earthOcean: "#0b2a5c",
    earthLand: "#2c6e49",
    earthIce: "#cfe9ff",
    earthCloud: "#ffffff",
    star: "#cfe9ff",
    nebulaA: "#163a8a",
    nebulaB: "#0b2a5c"
  },
  glowIntensity: 0.8,
  bloomThreshold: 0.45
} as const;

export function applyThemeCssVars() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--t-bg", theme.colors.bg);
  root.style.setProperty("--t-primary", theme.colors.primary);
  root.style.setProperty("--t-accent", theme.colors.accent);
  root.style.setProperty("--t-node", theme.colors.node);
  root.style.setProperty("--t-text", theme.colors.text);
  root.style.setProperty("--t-muted", theme.colors.muted);
  root.style.setProperty("--t-earth-ocean", theme.colors.earthOcean);
  root.style.setProperty("--t-earth-land", theme.colors.earthLand);
  root.style.setProperty("--t-earth-ice", theme.colors.earthIce);
  root.style.setProperty("--t-earth-cloud", theme.colors.earthCloud);
  root.style.setProperty("--t-star", theme.colors.star);
  root.style.setProperty("--t-nebula-a", theme.colors.nebulaA);
  root.style.setProperty("--t-nebula-b", theme.colors.nebulaB);
  root.style.setProperty("--t-glow", String(theme.glowIntensity));
  root.style.setProperty("--t-bloom-threshold", String(theme.bloomThreshold));
}

