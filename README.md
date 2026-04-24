# Neocortex UI

Futuristic React + Tailwind interface for a "living AI brain" composed of three cognitive layers:
**Structure Cortex** (Ontology), **Temporal Cortex** (Cognee + GraphRAG memory), and
**Cognitive Filter** (Context Adapter), coordinated by a floating **Executive Cortex** (MCP agent).

## Stack
- React 18 + Vite
- Tailwind CSS (custom cortex palette + glow shadows)
- Framer Motion (transitions, pulses, particles)
- React Flow (ontology + GraphRAG graphs)
- Zustand (global state)

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Layout

```
┌──────────────────────────── TopBar (vitals + debug + replay) ───────────────────────────┐
│                                                                                         │
│  ┌──────── Structure ───────┐  ┌──────── Temporal ────────┐  ┌──── Cognitive ─────────┐ │
│  │ Ontology (blue)          │  │ Cognee | GraphRAG tabs   │  │ Query → Blocks → Token │ │
│  │ • Uploader               │  │ • Timeline scrubber      │  │   Efficiency + Budget  │ │
│  │ • Pipeline tracker       │  │ • Entity history         │  │ • Hallucination Guard  │ │
│  │ • Concept graph          │  │ • Community force graph  │  │                        │ │
│  └──────────────────────────┘  └──────────────────────────┘  └────────────────────────┘ │
│                                                                                         │
│                                          ┌─────────────────────────────────────────┐    │
│                                          │  Executive Cortex (floating, draggable) │    │
│                                          │  MCP agent · debug · RAW vs FILTERED    │    │
│                                          └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Color semantics
- 🔵 `cortex-blue`   — Ontology / structural knowledge
- 🟣 `cortex-purple` — Cognee temporal memory
- 🟢 `cortex-green`  — GraphRAG communities / reasoning
- 🟠 `cortex-amber`  — Agent / MCP
- 🔵 `cortex-cyan`   — Adapter / data-flow accents
- 🌹 `cortex-rose`   — Rejected / hallucination-filtered facts

## Advanced features wired
- **Thought Replay** — `TopBar ▶` toggle; the central BrainCore pulses/tints by pipeline stage (query → ontology → cognee → graphrag → adapter → agent).
- **Hallucination Guard** — collapsible block inside the adapter with strike-through + rejection reason.
- **Context Budget Control** — Minimal / Balanced / Rich preset pill.
- **Token Efficiency Meter** — raw vs filtered bar with compression %.
- **Debug RAW vs FILTERED** — inside the floating agent panel.

## Folder structure
See the top of the repo — components are grouped by cortex layer.
"# NeoCortex_UI" 
