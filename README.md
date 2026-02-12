# React Portfolio — Futuristic Globe (R3F)

This project implements the “high-end futuristic 3D globe motif” described in
`High-end futuristic 3D globe motif for a React portfolio with Three.js and React Three Fiber.pdf`.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## What’s included

- React + Vite + TypeScript
- React Three Fiber globe hero:
  - Earth base sphere + holographic grid overlay
  - Atmosphere Fresnel glow (additive shader)
  - Network points + animated arcs
  - Postprocessing (Bloom + SMAA, SSAO on high tier)
  - Pause controls + `prefers-reduced-motion` support
  - Non-WebGL fallback

## Build

```bash
npm run build
npm run preview
```

