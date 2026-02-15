# Product Requirements Document: Redhue MVP

## Product Overview

**App Name:** Redhue
**Tagline:** The wisdom of 10,000 past fires — in your ear, in 2 seconds.
**Launch Goal:** Win the Stanford TreeHacks Sustainability Track
**Target Launch:** 36-hour hackathon build (February 2026)
**Builder:** Solo vibe-coder on Windows Surface with VSCode
**Coding Assistants:** Cursor (Composer mode), Claude API credits (hackathon-provided)

---

## Who It's For

### Primary User: Wildfire Incident Commander (IC)

A pragmatic, experienced field leader responsible for life-or-death decisions in the first 0–3 hours of a wildfire. They are comfortable with apps and tablets but have zero patience for complexity. They wear heavy gloves, work in smoke and noise, and need answers — not dashboards.

**Their Current Pain:**

- Juggling 5+ fragmented tools (Tablet Command, FIRIS, Watch Duty, radio, Windy.com) with no integration
- Drowning in raw data streams when they need distilled, decision-relevant information
- No tool bridges historical fire intelligence with real-time tactical recommendations
- Relying on personal "slide files" (mental memories of past fires) that retire when the firefighter does

**What They Need:**

- Hands-free input (they're wearing gloves and managing a scene)
- Instant historical context ("fires like this one went bad when...")
- Explainable, defensible recommendations — not black-box predictions
- A tool that works in 3 seconds of attention, not 3 minutes of navigation

### Secondary User: On-Site Firefighters

Crew members who need to quickly process tactical information relayed from the IC. They benefit from the same clarity and speed requirements.

### Example User Story

"Meet Captain Martinez, a CAL FIRE IC who just arrived at a wind-driven brush fire threatening a residential ridge. He's got engines arriving, dispatch on the radio, and residents asking about evacuations — all at once. He pulls out his phone, opens Redhue, and hits the big mic button. He says: 'Wind-driven fire in heavy brush, spotting 200 yards, structures threatened on the north ridge.' Within seconds, Redhue extracts the key details and surfaces 3 analogous past fires — including one where direct attack failed and dozer lines saved the day. Martinez taps Analyze, speaks his plan: 'Going direct with engines on the south flank.' Redhue returns a yellow 62% alignment score with a warning: 'In similar conditions, direct attack failed 60% of the time. Consider indirect dozer lines.' Martinez adjusts his plan with confidence, backed by the lessons of thousands of past fires."

---

## The Problem We're Solving

In the first 0–3 hours of a wildfire — the initial attack period — the decisions made by the Incident Commander often determine whether a fire is contained or becomes a catastrophic disaster. ICs have more data than ever (satellite imagery, drone feeds, weather sensors, AI cameras), but more data does not mean better decisions. In fact, raw data streams overwhelm commanders when they need distilled, actionable intelligence.

CAL FIRE's own innovation strategy highlights the need for improved "intelligence, situational awareness, and connectivity" tools on the fireline. The gap is clear: no existing tool combines voice-first input, historical pattern matching, and tactical plan critique into a single, simple interface designed for the chaos of the fireline.

Redhue fills this gap. It is not a prediction engine. It is an AI-powered institutional memory — digitizing the hard-won lessons of thousands of past California wildfires and surfacing them exactly when they matter most.

**Why Existing Solutions Fall Short:**

| Tool | What It Does | Why It's Not Enough |
|------|-------------|-------------------|
| WFDSS | Federal strategic planning & fire modeling | Built for long-duration fires, not real-time initial attack. Desktop-first, clunky. |
| FIRIS / WIFIRE | Real-time fire perimeters from aircraft IR sensors | Predicts where the fire will go, but doesn't tell the IC what to do about it. |
| Technosylva | High-end predictive modeling for utilities/agencies | Expensive, complex, focused on pre-positioning — not field tactical decisions. |
| Tablet Command | iPad-based resource tracking (drag-drop units on map) | Manual data entry. Tracks resources but doesn't think or advise. |
| ATAK | Military-origin blue force tracking | Extremely complex UI, high learning curve. Not decision support. |
| Watch Duty | Volunteer-powered fire alerts and photos | Fast intelligence, but no analysis, no recommendations, no history. |
| CalTopo / OnX Hunt | Offline topographic maps | Firefighters use hiking apps because official tools have worse maps. No AI. |
| Windy.com | Wind pattern visualization | Weather only. No fire behavior context or tactical advice. |

**Redhue's Position:** The only tool using voice to bridge historical intelligence and tactical action during initial attack.

---

## User Journey

### Discovery → First Use → Success

**1. Discovery Phase (Pre-Hackathon Context)**

- How they find us: Hackathon demo, pitch to CAL FIRE / FireWERX / AI Collaborative
- What catches attention: "An AI that listens to you and tells you what worked in fires like this one"
- Decision trigger: Seeing the 3-second voice-to-recommendation loop live

**2. First Use (First 10 Seconds)**

- Open Redhue on phone → see a massive mic button on a dark tactical screen
- Tap the mic → speak naturally about the fire situation
- See extracted entity tags appear instantly (FUEL: BRUSH, WIND: 25MPH, THREAT: STRUCTURES)

**3. Core Usage Loop**

- **Trigger:** IC arrives at a new fire or conditions change
- **Action:** Tap mic, describe situation in natural speech
- **Reward:** Instant analogous fire matches with actionable intelligence
- **Investment:** Tap Analyze, speak proposed plan, get Historical Alignment Score with reasoning

**4. Success Moment**

- "Aha!" moment: IC sees a past fire match they remember personally — and Redhue's recommendation aligns with what they learned the hard way
- Trust trigger: The "Because" reasoning cites specific past incidents, not vague AI guesses

---

## MVP Features

### Must Have for Launch (P0 — The Trifecta)

#### 1. Context-Aware Voice Injection

**What:** The IC speaks naturally into the app. Redhue transcribes and extracts structured entities (Fuel Type, Fire Behavior, Rate of Spread, Terrain, Threat Level, Weather Conditions) and displays them as large, readable tags on the dashboard.

**User Story:** As an incident commander arriving at a fire, I want to speak my situation assessment naturally so that the app understands my fire without me typing anything.

**Technical Flow:**
```
IC Voice → Push-to-Talk Button → Deepgram Nova-2 (transcription)
→ Claude 3.5 Sonnet (entity extraction) → JSON → UI Tags
```

**Success Criteria:**
- [ ] Push-to-talk mic button is ≥60px and works with gloved hands
- [ ] Transcription completes in <1 second
- [ ] Entity extraction returns structured JSON with fuel, behavior, terrain, threat fields
- [ ] Extracted entities display as large, high-contrast tags on screen
- [ ] Works in Safari and Chrome on iPhone

**Priority:** P0 (Critical)

---

#### 2. Analogous Fire Retrieval

**What:** Using the extracted situation data, Redhue searches a historical database of ~2,000 California wildfires (ICS-209-PLUS dataset) and surfaces the top 3–5 most similar past fires. Each match displays the fire name, year, conditions, what tactics were used, and the outcome.

**User Story:** As an incident commander, I want to instantly see past fires that match my current situation so that I can learn from what worked and what failed before.

**Technical Flow:**
```
Situation JSON → Embed with text-embedding-3-small
→ Supabase pgvector similarity search (or Claude context stuffing as fallback)
→ Top 3-5 matches → Display as fire cards
```

**Data Source:** ICS-209-PLUS dataset filtered to California, fires >100 acres (~2,000 records). Fields used: fuel type, weather conditions, fire behavior, terrain, suppression tactics, outcome.

**Success Criteria:**
- [ ] Returns 3–5 analogous fires within 2 seconds of entity extraction
- [ ] Each fire card shows: name, year, conditions, tactics used, outcome
- [ ] Matches are relevant (same fuel/weather/terrain profile)
- [ ] Cards are scrollable and readable at a glance (3-second rule)

**Priority:** P0 (Critical)

---

#### 3. Plan Simulation & Critique (Analyze Tab)

**What:** The IC speaks their proposed tactical plan. Redhue compares the plan against what worked and failed in the matched historical fires and returns a Historical Alignment Score (0–100) with reasoning and recommended adjustments.

**User Story:** As an incident commander, I want to stress-test my tactical plan against historical outcomes so that I can adjust my approach before committing resources.

**Scoring Methodology (Weighted Heuristic):**

| Component | Weight | What It Measures |
|-----------|--------|-----------------|
| Situational Similarity | 40% | How close is the current fire's fuel/weather/terrain to the historical match? (Cosine similarity) |
| Tactical Match | 40% | Does the IC's proposed plan match tactics that succeeded in similar fires? |
| Negative Outcome Penalty | 20% | Did similar fires result in escapes, injuries, or fatalities? Lowers score as a warning. |

**Display:** Color-coded gauge (Green / Yellow / Red) with score percentage and 2–3 bullet points of reasoning.

**Example Output:**
> **78% Historical Alignment**
> "High alignment on tactics, but historical data suggests adding air tanker support due to steep terrain failures in the 2017 Thomas Fire."

**Success Criteria:**
- [ ] IC can speak their plan via the same push-to-talk interface
- [ ] Score calculates and displays within 2 seconds
- [ ] Score is displayed as a color-coded gauge (Green ≥70, Yellow 40–69, Red <40)
- [ ] 2–3 bullet points of "Because" reasoning accompany every score
- [ ] Reasoning cites specific historical fires by name

**Priority:** P0 (Critical)

---

### Nice to Have (If Time Allows During Hackathon)

- **Map visualization:** Mapbox dark-mode tactical map showing matched fire locations
- **Weather overlay:** Live wind data from Synoptic API
- **Demo scenarios:** 3 pre-loaded hardcoded scenarios for a foolproof demo if live voice has issues

### NOT in MVP (Post-Hackathon Only)

- Real-time resource tracking (engine/crew locations)
- Multi-user support (IC + division supervisors)
- Integration with FIRIS, Tablet Command, or ATAK
- Offline / mesh network capability
- After Action Review (AAR) generation
- Expanded dataset beyond California

*Why we're waiting: These are all v2+ features. The hackathon prototype proves the core concept — voice in, historical intelligence out, plan critique back.*

---

## How We'll Know It's Working

### Hackathon Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Win sustainability track | 1st place | Judge decision |
| Demo runs clean | Zero crashes during 3-min pitch | Practice runs |
| Voice-to-results latency | <2 seconds (flexible for complex inputs) | Stopwatch during demo |
| Judge engagement | Questions indicate genuine interest, not confusion | Post-pitch Q&A quality |

---

## Look & Feel

**Design Vibe:** Dark base, defined UI elements, fast, authoritative. Functional beauty under stress. The sweet spot between functionality and front-end attractiveness.

**Visual Principles:**

1. **The 3-Second Rule:** Any information not readable in 3 seconds is useless on a fireline
2. **Glove-Friendly:** All interactive elements ≥60px height, generous tap targets, no small toggles
3. **Dual Mode:** Light mode (daytime/bright sun) and dark mode (nighttime operations) with easy toggle
4. **High Contrast:** White/bright text on dark backgrounds (dark mode), dark text on light backgrounds (light mode). No subtle grays.
5. **Authoritative, Not Flashy:** This is a tactical tool, not a consumer app. Clean lines, no decorative elements, military-grade clarity.

**Color System:**

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | Pure black (#000000) or near-black (#0A0A0A) | Off-white (#F5F5F5) |
| Primary text | White (#FFFFFF) | Near-black (#1A1A1A) |
| Accent / Brand | Red-orange (fire-inspired, for Redhue branding) | Same |
| Alignment Score — Green | #22C55E | Same |
| Alignment Score — Yellow | #EAB308 | Same |
| Alignment Score — Red | #EF4444 | Same |
| Entity tags | High-contrast colored chips | Same |

**Typography:** Inter or Roboto Mono — high readability, strong at small and large sizes.

**Key Screens:**

| Screen | Purpose | Key Elements |
|--------|---------|-------------|
| **Listen Mode** (Home) | Voice input | Massive pulsing mic button, minimal clutter, mode toggle (day/night) |
| **Situation Card** | Entity display | Large tags for extracted entities (FUEL, WIND, BEHAVIOR, THREAT) |
| **Analogous Fires** | Historical matches | Carousel of fire cards (name, year, conditions, outcome) |
| **Analyze Tab** | Plan critique | Push-to-talk for plan input, alignment gauge, reasoning bullets |

### Wireframe — Listen Mode (Home Screen)

```
┌──────────────────────────────┐
│  ☀/🌙 Toggle     REDHUE     │
├──────────────────────────────┤
│                              │
│                              │
│         ┌────────┐           │
│         │  🎤    │           │
│         │ (60px) │           │
│         └────────┘           │
│     TAP TO SPEAK             │
│                              │
│                              │
├──────────────────────────────┤
│  [Listen]  [Matches] [Analyze]│
└──────────────────────────────┘
```

### Wireframe — Situation + Matches

```
┌──────────────────────────────┐
│  ☀/🌙           REDHUE      │
├──────────────────────────────┤
│ FUEL: BRUSH  WIND: 25MPH NE │
│ BEHAVIOR: SPOTTING 200YD     │
│ THREAT: STRUCTURES - NORTH   │
├──────────────────────────────┤
│ ▸ SIMILAR: 2007 Witch Fire   │
│   Conditions: Heavy brush,   │
│   Santa Ana winds. Direct    │
│   attack failed. Dozer lines │
│   contained in 2.5 hrs.      │
├──────────────────────────────┤
│ ▸ SIMILAR: 2018 Carr Fire    │
│   ...                        │
├──────────────────────────────┤
│  [Listen]  [Matches] [Analyze]│
└──────────────────────────────┘
```

### Wireframe — Analyze Tab

```
┌──────────────────────────────┐
│  ☀/🌙           REDHUE      │
├──────────────────────────────┤
│                              │
│    YOUR PLAN: "Direct attack │
│    with engines, south flank"│
│                              │
│    ┌──────────────────┐      │
│    │   62% ALIGNMENT  │      │
│    │   [====----]     │      │
│    │   ● YELLOW       │      │
│    └──────────────────┘      │
│                              │
│ ⚠ Direct attack failed 60%  │
│   in similar conditions      │
│ ✓ Consider indirect dozer    │
│   lines (2007 Witch Fire)    │
│ ⚠ Add air tanker support     │
│   (steep terrain risk)       │
│                              │
│    [🎤 SPEAK NEW PLAN]       │
├──────────────────────────────┤
│  [Listen]  [Matches] [Analyze]│
└──────────────────────────────┘
```

---

## Technical Considerations

**Platform:** Mobile web app (responsive, optimized for phone/tablet browsers)
**Primary Browser Targets:** Safari (iPhone) and Chrome (iPhone) — pick easiest for development
**Device:** Demo on iPhone 16 Pro
**Development Machine:** Windows Surface with VSCode
**Coding Assistant:** Cursor (Composer mode) for multi-file code generation
**Responsive:** Mobile-first
**Performance:** Voice-to-results <2 seconds (flexible for complex queries)
**Accessibility:** Glove-friendly (60px+ buttons), high contrast, day/night mode toggle
**Security/Privacy:** Voice recordings encrypted and private — not stored beyond the session
**Data:** ICS-209-PLUS dataset (~2,000 CA fires), pre-processed and stored in Supabase

**Tech Stack (from Research):**

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js (React) on Vercel | Standard, instant deployment |
| Backend / DB | Supabase (Postgres + pgvector) | Database, auth, and vector search in one |
| Voice Input | Deepgram Nova-2 | <300ms latency, handles outdoor noise |
| LLM | Claude 3.5 Sonnet (via Vercel AI SDK) | Best reasoning for tactical critique + entity extraction |
| Embeddings | OpenAI text-embedding-3-small | Cheap, fast, good enough for hackathon |
| Maps (stretch) | Mapbox GL JS | Dark-mode tactical aesthetics |

---

## Quality Standards

**What This App Will NOT Accept:**

- Placeholder content in the demo ("Lorem ipsum", fake UI screenshots)
- Half-working features — each of the 3 core features works end-to-end or is cut
- Bright white default screen (dark mode is default; light mode is the toggle)
- Tiny buttons or text that can't be read in 3 seconds
- A "black box" score with no reasoning — every alignment score must have a "Because"
- Slow response times that break the illusion of real-time intelligence

**Hackathon-Specific Quality Rules:**

- If a feature breaks during the build, hardcode 3 perfect demo scenarios as fallback
- Practice the demo at least 3 times before presenting
- Test voice input in a noisy environment before the pitch

---

## Budget & Constraints

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | Free (Hobby tier) | Hosting + deployment |
| Supabase | Free (Hobby tier) | Database + vector search |
| Deepgram | Free ($200 new user credit) | Voice transcription |
| Claude API | Free (hackathon credits) | LLM for extraction + critique |
| OpenAI Embeddings | ~$0.02 for 2,000 fire records | Negligible |
| Mapbox (stretch) | Free tier | If maps are attempted |
| **Total** | **~$0** | Hackathon-friendly |

**Timeline:** 36 hours. No code before hacking starts at 9:30 PM PT.

**Team:** Solo builder.

---

## Demo & Pitch Script Outline (3 Minutes)

| Segment | Time | Content |
|---------|------|---------|
| **The Hook** | 0:00–0:30 | "In the first 3 hours of a wildfire, the Incident Commander is blind. They're processing 1,000 inputs under extreme stress. Mistakes here cost lives." |
| **The Solution** | 0:30–1:00 | "Meet Redhue. It's an AI Chief of Staff. It listens to the IC, understands the fire, and instantly finds matching historical events." |
| **Live Demo** | 1:00–2:30 | Hold phone → tap mic → speak: "Wind-driven fire in heavy brush, spotting 200 yards, structures threatened on the ridge." → Show extracted tags → Show analogous fires → Tap Analyze → Speak plan → Show alignment score with reasoning |
| **The Ask / Vision** | 2:30–3:00 | "We aren't replacing the commander. We're giving them the wisdom of 10,000 past fires. We are Redhue." |

---

## Open Questions & Assumptions

**Assumptions:**
- ICS-209-PLUS data is sufficient to demonstrate meaningful "analogous fire" matching
- Context stuffing (~2,000 fires into Claude's context window) may work as a simpler alternative to full vector search
- Push-to-talk is more reliable than always-listening for a hackathon demo
- Judges will value a working prototype with 3 strong features over a broader but shallower demo

**Open Questions:**
- Is Deepgram's free tier sufficient for the hackathon, or do we need to sign up for credits in advance?
- Should we pre-process the ICS-209 data into narrative strings before the hackathon starts (this is data prep, not code)?
- What's the fallback if voice input fails during the live demo? (Answer: hardcoded demo scenarios)

---

## Definition of Done for Hackathon

The Redhue prototype is ready to present when:

- [ ] Push-to-talk voice input works on iPhone (Safari or Chrome)
- [ ] Entity extraction returns structured tags from natural IC speech
- [ ] Analogous fire retrieval returns 3–5 relevant historical matches
- [ ] Analyze tab accepts spoken plan and returns Historical Alignment Score
- [ ] Every score includes "Because" reasoning citing specific past fires
- [ ] Day/night mode toggle works
- [ ] All buttons are ≥60px and glove-friendly
- [ ] 3 hardcoded demo scenarios exist as fallback
- [ ] Demo practiced 3+ times
- [ ] Deployed on Vercel with a live URL
- [ ] Posted to TreeHacks Devpost

---

## Next Steps

After this PRD is approved:
1. ✅ Deep Research Prompt (Part 1) — Complete
2. ✅ Product Requirements Document (Part 2) — This document
3. → Create Technical Design Document (Part 3)
4. → Hackathon starts: Build with Cursor + Claude
5. → Demo and pitch

---

*Document created: February 2026*
*Status: Draft — Ready for Technical Design*
*Builder: Solo vibe-coder*
*Event: Stanford TreeHacks 2026 — Sustainability Track*
