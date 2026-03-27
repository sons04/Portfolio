# How to Edit Your Data

## Timeline (Career Experience)

**Location:** `src/data/timeline.json`

Each entry has:
- `id` — unique slug
- `stageTitle` — scroll stage label (optional)
- `heading` — role + company
- `locationLabel` — location name
- `coordinates` — `{ lat, lon }` (lat -90 to 90, lon -180 to 180)
- `timeframe` — e.g. "Mar 2023 – present"
- `sections` — array of:
  - `{ type: "bullets", title: "...", items: ["..."] }`
  - `{ type: "text", title: "...", text: "..." }`
- `citations` — optional `[{ label, url }]`

Invalid JSON will log an error and fall back to an empty timeline.

---

## Projects

**Location:** `src/components/sections/ProjectsCarousel.tsx`

Edit the `projects` array. Each project has:
- `title` — project name
- `summary` — 1-line summary
- `outcomes` — array of bullet outcomes
- `metric` — at least one quantified outcome (time saved, cost reduced, etc.)
- `systemBoundaries` — what you owned vs integrated
- `tags` — tech pills

---

## Contact Links

**Location:** `src/components/sections/ContactSection.tsx`

Edit the `CONTACT` object at the top:

```ts
const CONTACT = {
  email: "your.email@example.com",
  linkedIn: "https://www.linkedin.com/in/yourprofile",
  github: "https://github.com/yourusername"
};
```

---

## Skills Galaxy

**Location:** `src/components/skills/SkillsGalaxy.tsx`

Edit the `skills` array and `skillOffsets` to add/remove skills or change domain clusters. Each skill has:
- `id`, `label`, `detail`, `domain` (cloud, frontend, web3, security)
