# Product Requirements — Redhue

## Core Features (The Trifecta — All P0 Critical)

### Feature 1: Context-Aware Voice Injection
**What:** IC speaks naturally into the app. Redhue transcribes and extracts structured entities (Fuel, Behavior, Rate of Spread, Terrain, Wind, Threat) and displays them as large, readable tags.

**User Story:** As an incident commander arriving at a fire, I want to speak my situation assessment naturally so that the app understands my fire without me typing anything.

**Flow:** IC Voice → Push-to-Talk → Deepgram Nova-2 → Claude Sonnet 4.5 → JSON → UI Tags

**Success Criteria:**
- [ ] Push-to-talk mic button ≥80px diameter with microphone icon
- [ ] Visual feedback: pulsing animation while recording, spinner while processing
- [ ] Transcription completes in <1 second
- [ ] Entity extraction returns structured JSON
- [ ] Entities display as large, color-coded tags
- [ ] Works on iPhone Safari and Chrome

### Feature 2: Analogous Fire Retrieval
**What:** Using extracted situation data, Redhue searches ~2,000 historical California wildfires and surfaces the top 3–5 most similar past fires with details.

**User Story:** As an IC, I want to instantly see past fires that match my current situation so I can learn from what worked and what failed.

**Flow:** Situation JSON → Narrative → OpenAI Embedding → Supabase pgvector → Top 3-5 Matches → Fire Cards

**Data Source:** ICS-209-PLUS dataset filtered to California, fires >100 acres (~2,000 records)

**Success Criteria:**
- [ ] Returns 3–5 analogous fires within 2 seconds
- [ ] Each fire card shows: name, year, conditions, tactics, outcome
- [ ] Matches are relevant (same fuel/weather/terrain profile)
- [ ] Cards are scrollable and readable at a glance

### Feature 3: Plan Simulation & Critique (Analyze Tab)
**What:** IC speaks their proposed plan. Redhue compares against historical matches and returns a Historical Alignment Score (0–100) with reasoning.

**User Story:** As an IC, I want to stress-test my tactical plan against historical outcomes before committing resources.

**Scoring Methodology:**
| Component | Weight | Measures |
|-----------|--------|----------|
| Situational Similarity | 40% | How close is current fire to historical match? |
| Tactical Match | 40% | Does proposed plan match successful past tactics? |
| Negative Outcome Penalty | 20% | Did similar fires result in escapes/injuries? |

**Display:** Color-coded gauge + score + 2-3 reasoning bullets.
- GREEN ≥70: Plan aligns with historical success
- YELLOW 40–69: Partial alignment, caution advised
- RED <40: Plan conflicts with historical patterns

**Success Criteria:**
- [ ] IC can speak plan via same push-to-talk interface
- [ ] Score calculates and displays within 3 seconds
- [ ] Color-coded gauge renders correctly
- [ ] 2–3 reasoning bullets cite specific historical fires by name
- [ ] Recommended adjustment provided

---

## Demo Fallback System (P0 — Build Early)
- 3 hardcoded scenarios: Wind-Driven Brush Fire (Yellow), Grass Fire (Green), Canyon Fire (Red)
- Activated by triple-tapping the Redhue logo
- Subtle "DEMO" badge when active
- Replaces all live API calls with pre-loaded data
- UI looks identical to live mode

---

## NOT in MVP
- Real-time weather API integration
- Map visualization
- Resource tracking
- Multi-user support
- FIRIS/Tablet Command integration
- Offline/mesh network capability
- Authentication/login
- After Action Review generation

---

## UI/UX Requirements

**Design Vibe:** Dark base, defined UI, fast, authoritative. Functional beauty under stress.

**Key Screens:**
1. **Listen Mode (Home):** Massive mic button, minimal clutter, theme toggle
2. **Matches:** Entity tags at top, scrollable fire cards below
3. **Analyze:** Push-to-talk for plan, alignment gauge, reasoning bullets

**Navigation:** Bottom tab bar with 3 tabs (Listen, Matches, Analyze), always visible, ≥60px height

**Constraints:**
- 3-second rule: any info readable in 3 seconds
- Glove-friendly: all buttons ≥60px
- Dark mode default, light mode toggle for daytime
- Max container width: 480px
- No hover states — touch only
- High contrast in both modes

---

## Success Metric
**Win the Stanford TreeHacks Sustainability Track.**

Secondary: Demo runs clean with zero crashes during 5-minute judge presentation.
