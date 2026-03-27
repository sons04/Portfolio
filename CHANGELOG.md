# Changelog — Portfolio Transformation

## Summary

Transform from "cool demo" to a cohesive, premium, recruiter-optimized product with design system, glassmorphism, cinematic scroll, and performance hardening.

---

## Files Created

### Design system & styles
- **src/styles/theme.css** — Global design tokens (colors, spacing, radii, typography, glass presets, reduced motion)

### UI primitives
- **src/ui/GlassCard.tsx** — Reusable glassmorphism card (variants: hero, panel, compact)
- **src/ui/Pill.tsx** — Tech tag chips
- **src/ui/IconButton.tsx** — Accessible icon buttons
- **src/ui/Fade.tsx** — Opacity + translateY transition wrapper

### Domain & validation
- **src/domain/experience.ts** — ExperienceNode and ExperienceSection types
- **src/domain/validateTimeline.ts** — Zod validation for timeline.json

---

## Files Modified

### Core
- **index.html** — Added Google Fonts (Inter, Space Grotesk)
- **main.tsx** — Import theme.css; removed applyThemeCssVars
- **package.json** — Added zod, clsx (via npm install)

### Styles
- **src/styles.css** — Removed duplicate :root/body; added UI primitive styles, project card expandable styles, contact styles, mobile narrative panel

### Components
- **src/App.tsx** — Hero uses GlassCard + Pill
- **src/components/globe/GlobeHero.tsx** — Lighting (ambient, hemisphere, directional, rim), postprocessing (Bloom, Vignette, ChromaticAberration), snap scroll, panel fade transitions, Fade/IconButton, lat/lon tooltip, DPR cap
- **src/components/globe/Earth.tsx** — Material tuning (roughness, metalness)
- **src/components/globe/timeline.ts** — Uses validateTimeline + typed ExperienceNode
- **src/components/skills/SkillsGalaxy.tsx** — Domain clusters (Cloud, Frontend, Web3, Security), improved tooltip (glass styling)
- **src/components/sections/ProjectsCarousel.tsx** — Expandable cards with outcomes, metrics, system boundaries, Pill, GlassCard
- **src/components/sections/ContactSection.tsx** — TODO placeholders, copy buttons, mailto fallback, form validation

---

## Breaking changes

- **theme.ts** — `applyThemeCssVars()` no longer called; theme.css provides CSS vars
- **timeline.json** — Now validated with Zod; invalid data falls back to empty array
