# AGENTS.md — Master Plan for Redhue

## Project Overview
**App:** Redhue — AI-Powered Wildfire Incident Commander Assistant
**Goal:** Voice-first decision support tool for wildfire ICs during initial attack (0–3 hours)
**Stack:** Next.js + Supabase (pgvector) + Deepgram Nova-2 + Claude Opus 4.6/Sonnet 4.5 + OpenAI text-embedding-3-large
**Deployed On:** Vercel (Free Hobby Tier)
**Builder:** Solo vibe-coder using Claude Code
**Event:** Stanford TreeHacks 2026 — Sustainability Track (36-hour hackathon)
**Current Phase:** Phase 1 — Foundation

---

## How I Should Think
1. **Understand Intent First**: Before answering, identify what the user actually needs
2. **Ask If Unsure**: If critical information is missing, ask before proceeding
3. **Plan Before Coding**: Propose a brief plan, ask for approval, then implement
4. **Verify After Changes**: Run the dev server and test after each change — fix before moving on
5. **Explain Trade-offs**: When recommending something, mention alternatives simply
6. **Speed Over Perfection**: This is a 36-hour hackathon. Working > elegant. Ship it.
7. **Demo-First Thinking**: Every feature should be demoable to judges. If it can't be shown, deprioritize it.

## Plan → Execute → Verify
1. **Plan:** Outline a brief approach and ask for approval before coding.
2. **Execute:** Implement one feature at a time. Small, testable chunks.
3. **Verify:** Run `npm run dev`, test in browser (especially mobile Safari/Chrome), fix before moving on.

## Context & Memory
- This file (`AGENTS.md`) is the single source of truth for project status.
- `agent_docs/` contains detailed specs — load only the file relevant to the current task.
- `CLAUDE.md` contains Claude Code-specific rules and commands.
- Update the "Current State" section below after completing each milestone.

## Context Files
Refer to these for details (load only when needed):
- `agent_docs/tech_stack.md` — Tech stack, libraries, versions, setup commands
- `agent_docs/code_patterns.md` — Code style, component patterns, API route patterns
- `agent_docs/project_brief.md` — Persistent project rules, conventions, quality gates
- `agent_docs/product_requirements.md` — Full PRD with features, user stories, success criteria
- `agent_docs/testing.md` — Verification strategy, manual checks, demo testing
- `data/demo-scenarios.json` — 3 hardcoded fallback scenarios for live demo

---

## Current State (UPDATE THIS AFTER EACH MILESTONE!)
**Last Updated:** [Update when starting]
**Working On:** Phase 1 — Project initialization
**Recently Completed:** Pre-hackathon setup (accounts, data download, API keys)
**Blocked By:** None

---

## Roadmap

### Phase 1: Foundation (Hours 0–6)
- [ ] Initialize Next.js project with Tailwind CSS
- [ ] Configure .env.local with all API keys
- [ ] Set up Supabase table with pgvector extension
- [ ] Run data prep script: CSV → JSON narratives
- [ ] Run embedding script: narratives → OpenAI text-embedding-3-large vectors
- [ ] Seed Supabase with embedded fire data
- [ ] Build basic page layout: 3 tabs (Listen, Matches, Analyze) + navigation
- [ ] Implement dark/light mode theme toggle
- [ ] Deploy skeleton to Vercel
- [ ] Verify deployed app loads on iPhone

### Phase 2: Voice Pipeline (Hours 6–14)
- [ ] Build MicButton component (push-to-talk, 80px+, glove-friendly)
- [ ] Build /api/transcribe route (Deepgram Nova-2)
- [ ] Build /api/extract route (Claude Sonnet 4.5 entity extraction)
- [ ] Build EntityTags component (color-coded situation tags)
- [ ] Connect: tap mic → transcribe → extract → display tags
- [ ] Test voice pipeline on iPhone (Safari + Chrome)
- [ ] Build demo fallback system (3 hardcoded scenarios + hidden toggle)
- [ ] Verify: speak a fire description → see entity tags on phone

### Phase 3: Analogous Fire Retrieval (Hours 14–22)
- [ ] Build /api/search route (embed query → Supabase pgvector match)
- [ ] Build FireCard component (single historical fire display)
- [ ] Build FireCarousel component (scrollable list of matches)
- [ ] Connect: entity extraction → search → display fire cards
- [ ] Test end-to-end: speak → tags → matching fires appear
- [ ] Optimize latency (target <2 seconds total pipeline)

### Phase 4: Plan Critique — Analyze Tab (Hours 22–28)
- [ ] Build /api/analyze route (Claude Opus 4.6 tactical critique)
- [ ] Build AlignmentGauge component (0–100 color-coded score)
- [ ] Build ReasoningBullets component (2–3 "Because" explanations)
- [ ] Connect Analyze tab: mic → plan transcript → critique → score + reasoning
- [ ] Test all 3 demo scenarios through complete pipeline
- [ ] Verify: speak plan → see alignment score with historical reasoning

### Phase 5: Polish & Pitch (Hours 28–36)
- [ ] CSS cleanup: consistent dark/light mode, fonts, spacing
- [ ] Ensure all buttons ≥60px, all text high-contrast
- [ ] Test demo fallback: 3 scenarios cycle smoothly
- [ ] Final deploy to Vercel, test on iPhone
- [ ] Write Devpost submission
- [ ] Practice pitch 3–5 times (5-minute target)
- [ ] Rehearse judge Q&A answers

---

## The Three Core Features (The Trifecta)

### Feature 1: Context-Aware Voice Injection
IC speaks naturally → Deepgram transcribes → Claude Sonnet 4.5 extracts entities → Tags display on screen.
**Files:** `MicButton.jsx`, `EntityTags.jsx`, `/api/transcribe/route.js`, `/api/extract/route.js`

### Feature 2: Analogous Fire Retrieval
Situation entities → narrative string → OpenAI embedding → Supabase pgvector search → Top 3–5 historical fire matches.
**Files:** `FireCard.jsx`, `FireCarousel.jsx`, `/api/search/route.js`

### Feature 3: Plan Simulation & Critique (Analyze Tab)
IC speaks plan → Deepgram transcribes → Claude Opus 4.6 scores against historical matches → Alignment Score + reasoning.
**Files:** `AlignmentGauge.jsx`, `ReasoningBullets.jsx`, `/api/analyze/route.js`

---

## What NOT To Do
- Do NOT delete files without explicit confirmation
- Do NOT modify the Supabase schema after data is seeded without a backup plan
- Do NOT add features not in the current phase — stay focused on the trifecta
- Do NOT skip testing on mobile after changes
- Do NOT use deprecated libraries or patterns
- Do NOT over-engineer — this is a 36-hour hackathon, not a production system
- Do NOT add authentication, user accounts, or login flows — not needed for demo
- Do NOT build a map feature unless all 3 core features are done and working
- Do NOT spend more than 30 minutes stuck on any single issue — ask for help or find a workaround
