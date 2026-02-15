# Technical Design Document: Redhue MVP

## How We'll Build It

### Executive Summary

**System:** Redhue — AI-Powered Wildfire Incident Commander Assistant
**Version:** MVP (Hackathon Prototype)
**Build Time:** 36 hours at Stanford TreeHacks
**Builder:** Solo vibe-coder using Claude Code
**Development Machine:** Windows Surface with VSCode
**Priority:** Functionality > UI > Simplicity

---

## Recommended Approach: Serverless Full-Stack with AI Backbone

Based on your requirements, timeline, experience, and the Gemini research findings, here's the optimal path. Everything is serverless — you manage zero infrastructure.

**Why this approach is perfect for you:**
1. Claude Code can scaffold the entire Next.js project in minutes
2. Supabase handles database, vector search, and auth in one dashboard — you already know it
3. Vercel deploys automatically on every git push — zero DevOps
4. Every service has a generous free tier — $0 hackathon cost
5. The voice → AI → database → response pipeline has exactly 4 moving parts, each well-documented

**Limitations to know:**
- Supabase free tier has connection limits (could matter if judges all test simultaneously — unlikely)
- Deepgram free credits may require advance signup — do this BEFORE the hackathon
- First cold-start API call on Vercel free tier can be slow (~3-5 seconds) — warm it up before demo

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER (IC on iPhone)                   │
│                                                         │
│  ┌───────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Push-to-  │    │ Situation│    │   Analyze Tab    │  │
│  │ Talk Mic  │    │  Cards   │    │  (Alignment Score)│  │
│  └─────┬─────┘    └────▲─────┘    └───────▲──────────┘  │
│        │               │                  │             │
└────────┼───────────────┼──────────────────┼─────────────┘
         │               │                  │
    ┌────▼────┐    ┌─────┴──────┐    ┌──────┴───────┐
    │DEEPGRAM │    │  NEXT.JS   │    │   NEXT.JS    │
    │ Nova-2  │    │    API     │    │     API      │
    │ (Voice) │    │  Routes    │    │   Routes     │
    └────┬────┘    └─────▲──────┘    └──────▲───────┘
         │               │                  │
    ┌────▼────┐    ┌─────┴──────┐    ┌──────┴───────┐
    │  Text   │    │ SUPABASE   │    │   CLAUDE     │
    │Transcript│──▶│  pgvector  │    │ Opus 4.6 /   │
    └────┬────┘    │ (Similar   │    │ Sonnet 4.5   │
         │         │  Fires DB) │    │ (Critique +  │
    ┌────▼────┐    └────────────┘    │  Reasoning)  │
    │ CLAUDE  │                      └──────────────┘
    │Sonnet4.5│
    │(Entity  │
    │Extract) │
    └─────────┘
```

### Data Flow — Complete Pipeline

```
FEATURE 1: Voice Injection
═══════════════════════════
IC taps mic → Browser MediaRecorder captures audio blob
→ Audio blob sent to Deepgram Nova-2 REST API
→ Raw transcript returned (< 1 second)
→ Transcript sent to Claude Sonnet 4.5 with extraction prompt
→ Structured JSON returned: {fuel, behavior, terrain, wind, threat}
→ Entity tags rendered on screen

FEATURE 2: Analogous Fire Retrieval
════════════════════════════════════
Structured JSON → Converted to narrative string
→ Narrative embedded via OpenAI text-embedding-3-large
→ Vector sent to Supabase pgvector similarity search
→ Top 3-5 matching historical fires returned
→ Fire cards rendered with name, year, conditions, tactics, outcome

FEATURE 3: Plan Critique (Analyze Tab)
═══════════════════════════════════════
IC taps mic → Speaks proposed plan
→ Deepgram transcribes → Plan text captured
→ Plan text + matched historical fires + original situation
   sent to Claude Opus 4.6 with critique prompt
→ Claude returns: Historical Alignment Score (0-100)
   + color rating + 2-3 reasoning bullets
→ Gauge + reasoning rendered on Analyze tab
```

---

## Tech Stack Decision

### Final Stack (Confirmed)

| Layer | Tool | Version/Tier | Why This One | Cost |
|-------|------|-------------|-------------|------|
| **Coding Agent** | Claude Code (CLI) | Latest | You know it already, strong multi-file generation | Hackathon credits |
| **Frontend** | Next.js (React) | 14+ (App Router) | Standard, huge AI training data, instant Vercel deploy | Free |
| **Styling** | Tailwind CSS | 3.x | Utility-first, fast to iterate, Claude Code knows it deeply | Free |
| **Hosting** | Vercel | Hobby (Free) | Git push = deployed, perfect Next.js integration | Free |
| **Database** | Supabase (Postgres + pgvector) | Free tier | You know Supabase, handles DB + vector search in one | Free |
| **Voice-to-Text** | Deepgram Nova-2 | Free credits ($200) | <300ms latency, handles outdoor noise, simple REST API | Free |
| **LLM — Entity Extraction** | Claude Sonnet 4.5 | Via Anthropic API | Fast, accurate extraction, cheaper than Opus for simple tasks | Hackathon credits |
| **LLM — Plan Critique** | Claude Opus 4.6 | Via Anthropic API | Best reasoning for nuanced tactical critique | Hackathon credits |
| **Embeddings** | OpenAI text-embedding-3-large | API | Top-tier accuracy for retrieval tasks | ~$0.50 total |
| **Maps (stretch)** | Mapbox GL JS | Free tier | Dark tactical aesthetic — only if time permits | Free |

### Alternative Options Compared (For Reference)

| Decision | Chosen | Alternative 1 | Alternative 2 |
|----------|--------|---------------|---------------|
| Frontend | Next.js on Vercel | Plain HTML/JS (simpler but no SSR, worse DX) | Remix (good but less AI training data) |
| Database | Supabase pgvector | Pinecone (vector-only, need separate DB) | Context stuffing (simpler but slower per query) |
| Voice | Deepgram Nova-2 | Web Speech API (free but unreliable, browser-dependent) | OpenAI Whisper (slower, ~1-2s latency) |
| LLM | Claude Opus 4.6 / Sonnet 4.5 | GPT-4o (good but no hackathon credits) | Gemini (large context but weaker reasoning) |
| Embeddings | OpenAI text-embedding-3-large | Voyage AI voyage-3-large (slightly more accurate, extra API account) | text-embedding-3-small (cheaper, less accurate) |
| Coding Agent | Claude Code | Cursor Composer (great but new tool to learn in 36hrs) | GitHub Copilot (weaker multi-file generation) |

---

## Project Structure

```
redhue/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.js             # Root layout (dark/light mode wrapper)
│   │   ├── page.js               # Home — Listen Mode (mic button)
│   │   ├── matches/
│   │   │   └── page.js           # Analogous Fires display
│   │   ├── analyze/
│   │   │   └── page.js           # Plan Critique + Alignment Score
│   │   └── api/
│   │       ├── transcribe/
│   │       │   └── route.js      # Deepgram voice-to-text endpoint
│   │       ├── extract/
│   │       │   └── route.js      # Claude entity extraction endpoint
│   │       ├── search/
│   │       │   └── route.js      # Supabase vector similarity search
│   │       ├── analyze/
│   │       │   └── route.js      # Claude plan critique endpoint
│   │       └── embed/
│   │           └── route.js      # OpenAI embedding generation
│   ├── components/
│   │   ├── MicButton.jsx         # Push-to-talk button (60px+, glove-friendly)
│   │   ├── EntityTags.jsx        # Fuel, Wind, Behavior, Threat display tags
│   │   ├── FireCard.jsx          # Historical fire match card
│   │   ├── FireCarousel.jsx      # Scrollable list of fire cards
│   │   ├── AlignmentGauge.jsx    # 0-100 color-coded score gauge
│   │   ├── ReasoningBullets.jsx  # "Because" explanation bullets
│   │   ├── ThemeToggle.jsx       # Day/night mode switch
│   │   ├── NavBar.jsx            # Bottom tab navigation
│   │   └── LoadingSpinner.jsx    # Feedback during API calls
│   ├── lib/
│   │   ├── deepgram.js           # Deepgram API client
│   │   ├── anthropic.js          # Claude API client (extraction + critique)
│   │   ├── openai.js             # OpenAI embeddings client
│   │   ├── supabase.js           # Supabase client + vector search
│   │   ├── scoring.js            # Alignment score calculation logic
│   │   └── constants.js          # Prompts, thresholds, config values
│   ├── data/
│   │   └── demo-scenarios.json   # 3 hardcoded fallback demo scenarios
│   └── styles/
│       └── globals.css           # Tailwind config + custom dark/light tokens
├── scripts/
│   ├── prepare-data.js           # Filter ICS-209 CSV → JSON narratives
│   ├── generate-embeddings.js    # Batch embed all fire narratives
│   └── seed-supabase.js          # Upload vectors to Supabase
├── public/
│   └── redhue-logo.svg           # App logo
├── .env.local                    # API keys (NEVER commit this)
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

**Why this structure:**
- Next.js App Router is the current standard — Claude Code generates it fluently
- API routes live alongside frontend — no separate backend to manage
- `lib/` isolates each external service — easy to debug one at a time
- `scripts/` folder handles pre-hackathon data prep (not part of the running app)
- `data/demo-scenarios.json` is your safety net for the live demo

---

## Pre-Hackathon Setup (Do This NOW)

### Accounts to Create Before 9:30 PM

- [ ] **Vercel** account — vercel.com (sign up with GitHub)
- [ ] **Supabase** account — supabase.com (create a new project, note the URL + anon key)
- [ ] **Deepgram** account — deepgram.com (sign up, claim free $200 credits)
- [ ] **OpenAI** account — platform.openai.com (for text-embedding-3-large API key)
- [ ] **Anthropic** account — console.anthropic.com (confirm hackathon credits are loaded)
- [ ] **GitHub** repository — create `redhue` repo (empty, private)

### Data Preparation (Can Be Done Before Hackathon)

This is data prep, not code. You're just cleaning a CSV file.

**Step 1: Download ICS-209-PLUS**
- Source: https://github.com/mkiang/ics209-plus-wf (the "Holy Grail" dataset)
- Download the CSV file

**Step 2: Filter to California**
- Open in Excel or Google Sheets
- Filter: State = "CA", Final Size > 100 acres
- Result: ~2,000 rows
- Save as `ca-fires-filtered.csv`

**Step 3: Review the fields you'll use**
Key columns to keep:
- Incident name
- Discovery date
- Fuel model / vegetation
- Weather conditions (wind speed, direction, temperature, humidity)
- Fire behavior (rate of spread, spotting)
- Terrain description
- Suppression tactics used
- Resources deployed (engines, dozers, aircraft)
- Structures threatened/destroyed
- Outcome (contained, escaped, casualties)
- Final fire size

You do NOT need to write the embedding scripts yet — that happens during the hackathon.

### Development Environment Setup

```bash
# 1. Install Node.js (if not already installed)
# Download from: https://nodejs.org (LTS version)

# 2. Install Claude Code CLI (your coding agent)
npm install -g @anthropic-ai/claude-code

# 3. Verify installations
node --version
claude --version

# 4. Create project directory
mkdir redhue
cd redhue

# 5. You're ready. Do NOT init the project yet — that's hackathon code.
```

### API Keys to Have Ready (in a secure note)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPGRAM_API_KEY=your-deepgram-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

---

## Building Each Feature

### Feature 1: Context-Aware Voice Injection

**Complexity:** Medium
**Estimated Build Time:** 6-8 hours
**Dependencies:** Deepgram account, Claude API

#### Voice Capture (Frontend)

**How it works:** A push-to-talk button captures audio using the browser's MediaRecorder API. When the IC releases the button, the audio blob is sent to your API route, which forwards it to Deepgram.

**Claude Code prompt to build this:**
```
Build a push-to-talk voice capture component for a Next.js app.
Requirements:
- Large circular button (minimum 80px diameter) with a microphone icon
- Press and hold to record, release to send
- Visual feedback: pulsing animation while recording, loading spinner while processing
- Uses browser MediaRecorder API to capture audio as webm/opus
- On release, sends audio blob to /api/transcribe endpoint via POST
- Displays returned transcript text on screen
- Must work on mobile Safari and Chrome
- Use Tailwind CSS for styling
- Dark mode default with high contrast white text
```

#### Transcription (API Route: /api/transcribe)

**Claude Code prompt:**
```
Create a Next.js API route at /api/transcribe that:
- Accepts a POST request with an audio blob in the body
- Sends the audio to Deepgram Nova-2 REST API for transcription
- Uses the DEEPGRAM_API_KEY from environment variables
- Returns the transcript text as JSON: { transcript: "..." }
- Handles errors gracefully with appropriate status codes
- Target latency: under 1 second
```

#### Entity Extraction (API Route: /api/extract)

**Claude Code prompt:**
```
Create a Next.js API route at /api/extract that:
- Accepts a POST request with { transcript: "..." }
- Sends the transcript to Claude Sonnet 4.5 via Anthropic API
- Uses this system prompt:

"You are a wildland fire tactical aide. Extract structured entities from
the incident commander's radio traffic. Return ONLY valid JSON with these fields:
{
  "fuel": "vegetation type (e.g., Brush, Grass, Oak Woodland, Chaparral)",
  "behavior": "fire behavior (e.g., Spotting, Crowning, Backing, Running)",
  "rate_of_spread": "estimated ROS if mentioned",
  "wind_speed": "wind speed if mentioned",
  "wind_direction": "wind direction if mentioned",
  "terrain": "terrain description (e.g., Steep Canyon, Flat, Ridge)",
  "threat": "what is threatened (e.g., Structures, Powerlines, Evacuation Route)",
  "threat_detail": "specific details about the threat",
  "resources_on_scene": "any resources mentioned"
}
If a field is not mentioned, set it to null. Do not infer or guess."

- Returns the parsed JSON object
- Handles errors gracefully
```

#### Entity Display (Frontend Component: EntityTags.jsx)

**Claude Code prompt:**
```
Create a React component called EntityTags that:
- Receives a JSON object with fire entity fields (fuel, behavior, wind_speed, etc.)
- Displays each non-null field as a large, high-contrast tag/chip
- Tags should be color-coded by category:
  - Red/orange for fire behavior (fuel, behavior, rate_of_spread)
  - Blue for weather (wind_speed, wind_direction)
  - Brown for terrain
  - Yellow/warning for threats
- Each tag shows LABEL: VALUE in uppercase (e.g., "FUEL: BRUSH")
- Tags are minimum 44px height, large bold text
- Readable in 3 seconds or less
- Tailwind CSS, supports dark and light mode
- Tags wrap responsively on mobile screens
```

---

### Feature 2: Analogous Fire Retrieval

**Complexity:** Medium-Hard
**Estimated Build Time:** 8-10 hours
**Dependencies:** Supabase pgvector, OpenAI embeddings, prepared fire data

#### Data Preparation Script (scripts/prepare-data.js)

**Claude Code prompt:**
```
Create a Node.js script at scripts/prepare-data.js that:
- Reads ca-fires-filtered.csv (ICS-209-PLUS data filtered to California)
- For each fire incident, creates a narrative string combining key fields:
  "Fire: [name]. Year: [year]. Fuel: [fuel type]. Wind: [speed] [direction].
   Terrain: [terrain]. Behavior: [behavior]. Tactics Used: [tactics].
   Resources: [resources]. Outcome: [contained/escaped]. Structures: [count].
   Final Size: [acres]."
- Outputs a JSON array of objects: { id, name, year, narrative, ...original_fields }
- Saves to data/ca-fires-prepared.json
- Handles missing fields gracefully (skip nulls in narrative)
- Log count of fires processed
```

#### Embedding Generation Script (scripts/generate-embeddings.js)

**Claude Code prompt:**
```
Create a Node.js script at scripts/generate-embeddings.js that:
- Reads data/ca-fires-prepared.json
- For each fire, calls OpenAI API to generate an embedding using text-embedding-3-large
- Processes in batches of 100 to avoid rate limits
- Adds the embedding vector to each fire object
- Saves the result to data/ca-fires-embedded.json
- Uses OPENAI_API_KEY from .env.local
- Shows progress: "Embedded 100/2000 fires..."
- Handles rate limiting with exponential backoff
```

#### Supabase Setup

**Database table (create in Supabase dashboard or via SQL):**

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the historical fires table
CREATE TABLE historical_fires (
    id SERIAL PRIMARY KEY,
    incident_name TEXT NOT NULL,
    year INTEGER,
    fuel TEXT,
    wind_speed TEXT,
    wind_direction TEXT,
    terrain TEXT,
    behavior TEXT,
    tactics_used TEXT,
    resources_deployed TEXT,
    structures_threatened INTEGER,
    structures_destroyed INTEGER,
    outcome TEXT,
    final_size_acres NUMERIC,
    narrative TEXT NOT NULL,
    embedding VECTOR(3072)  -- text-embedding-3-large outputs 3072 dimensions
);

-- Create index for fast similarity search
CREATE INDEX ON historical_fires
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create the similarity search function
CREATE OR REPLACE FUNCTION match_fires(
    query_embedding VECTOR(3072),
    match_count INT DEFAULT 5,
    match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id INT,
    incident_name TEXT,
    year INTEGER,
    fuel TEXT,
    wind_speed TEXT,
    wind_direction TEXT,
    terrain TEXT,
    behavior TEXT,
    tactics_used TEXT,
    resources_deployed TEXT,
    structures_threatened INTEGER,
    structures_destroyed INTEGER,
    outcome TEXT,
    final_size_acres NUMERIC,
    narrative TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hf.id,
        hf.incident_name,
        hf.year,
        hf.fuel,
        hf.wind_speed,
        hf.wind_direction,
        hf.terrain,
        hf.behavior,
        hf.tactics_used,
        hf.resources_deployed,
        hf.structures_threatened,
        hf.structures_destroyed,
        hf.outcome,
        hf.final_size_acres,
        hf.narrative,
        1 - (hf.embedding <=> query_embedding) AS similarity
    FROM historical_fires hf
    WHERE 1 - (hf.embedding <=> query_embedding) > match_threshold
    ORDER BY hf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

#### Seed Script (scripts/seed-supabase.js)

**Claude Code prompt:**
```
Create a Node.js script at scripts/seed-supabase.js that:
- Reads data/ca-fires-embedded.json
- Uploads each fire record (with embedding) to the Supabase historical_fires table
- Uses the SUPABASE_SERVICE_ROLE_KEY for write access
- Processes in batches of 50 rows
- Shows progress: "Uploaded 50/2000 fires..."
- Handles errors per batch (skip failures, log them, continue)
```

#### Search API Route (/api/search)

**Claude Code prompt:**
```
Create a Next.js API route at /api/search that:
- Accepts POST with { situation: "narrative string from entity extraction" }
- Calls OpenAI text-embedding-3-large to embed the situation text
- Calls the Supabase match_fires function with the embedding vector
- Returns top 5 matches as JSON array with all fire fields + similarity score
- Each match includes: incident_name, year, fuel, behavior, terrain,
  tactics_used, outcome, similarity score
- Target latency: under 2 seconds total
```

#### Fire Cards Display (Frontend)

**Claude Code prompt:**
```
Create two React components for displaying historical fire matches:

1. FireCard.jsx:
- Displays a single historical fire match
- Shows: fire name + year as header, similarity percentage,
  key conditions (fuel, wind, terrain), tactics used, outcome
- Color-code outcome: green for "contained", red for "escaped"
- Large readable text, high contrast, dark/light mode support
- Minimum tap target 60px for any interactive elements

2. FireCarousel.jsx:
- Accepts an array of fire match objects
- Renders a vertical scrollable list of FireCard components
- Shows "Searching historical fires..." loading state
- Shows "No similar fires found" empty state
- Mobile-optimized scrolling
```

---

### Feature 3: Plan Simulation & Critique (Analyze Tab)

**Complexity:** Medium
**Estimated Build Time:** 6-8 hours
**Dependencies:** Features 1 & 2 working, Claude Opus 4.6

#### Analyze API Route (/api/analyze)

**Claude Code prompt:**
```
Create a Next.js API route at /api/analyze that:
- Accepts POST with:
  {
    plan_transcript: "IC's spoken tactical plan",
    situation: { fuel, behavior, terrain, wind, threat... },
    matched_fires: [ array of top 3-5 historical fire matches ]
  }
- Sends all context to Claude Opus 4.6 with this system prompt:

"You are an expert wildland fire tactical analyst. An incident commander
has described their current fire situation and proposed a tactical plan.
You have been provided with 3-5 historically similar fires and their outcomes.

Your job is to calculate a Historical Alignment Score and provide reasoning.

SCORING METHODOLOGY:
1. Situational Similarity (40%): How closely do the matched historical fires
   align with the current situation? Use the similarity scores provided.

2. Tactical Match (40%): Does the IC's proposed plan match tactics that
   SUCCEEDED in the similar historical fires? Award points if the plan
   aligns with successful tactics. Deduct if the plan matches tactics
   that FAILED.

3. Negative Outcome Penalty (20%): Did any of the similar fires result
   in escaped fires, injuries, or fatalities? If yes, apply a penalty
   to warn the IC.

RESPONSE FORMAT (return ONLY valid JSON):
{
  "score": 0-100,
  "rating": "GREEN" | "YELLOW" | "RED",
  "reasoning": [
    "First critical consideration citing a specific historical fire",
    "Second consideration with tactical recommendation",
    "Third consideration if applicable"
  ],
  "recommended_adjustment": "One specific actionable adjustment to the plan"
}

RATING THRESHOLDS:
- GREEN (70-100): Plan strongly aligns with historical success
- YELLOW (40-69): Plan has partial alignment, caution advised
- RED (0-39): Plan conflicts with historical patterns, reconsider

RULES:
- Always cite specific historical fire names in reasoning
- Be direct and concise — each bullet max 2 sentences
- Focus on actionable intelligence, not general advice
- Never say 'I think' — present as data-driven findings"

- Returns the parsed JSON response
- Handles errors gracefully
- Target: under 3 seconds (Opus is slower but more thorough)
```

#### Alignment Score Display (Frontend)

**Claude Code prompt:**
```
Create two React components for the Analyze tab:

1. AlignmentGauge.jsx:
- Displays a score from 0-100 as a large, prominent gauge
- Color-coded: GREEN (#22C55E) for 70-100, YELLOW (#EAB308) for 40-69,
  RED (#EF4444) for 0-39
- Show the number prominently (72px+ font size)
- Show "XX% Historical Alignment" as label
- Include a simple horizontal bar or circular gauge visualization
- Animate the score counting up when it appears
- Dark and light mode support

2. ReasoningBullets.jsx:
- Displays an array of 2-3 reasoning strings
- Each bullet is prefixed with an appropriate icon:
  ⚠ for warnings, ✓ for positive alignment, ✕ for conflicts
- Large readable text (18px+)
- Include the recommended_adjustment as a highlighted callout at the bottom
- Dark and light mode support
```

---

### Demo Fallback System

**This is your safety net. Build it early, not last.**

**Claude Code prompt:**
```
Create a demo fallback system for the Redhue app:

1. Create data/demo-scenarios.json with 3 hardcoded scenarios:

SCENARIO 1 — "The Wind-Driven Brush Fire" (Yellow Score)
- Voice input: "We have a wind-driven fire in heavy brush, spotting 200 yards
  ahead, structures threatened on the north ridge, winds 30mph from the northeast"
- Extracted entities: {fuel: "Heavy Brush", behavior: "Spotting 200yd",
  wind_speed: "30mph", wind_direction: "NE", terrain: "Ridge",
  threat: "Structures - North Ridge"}
- Matched fires: [2007 Witch Fire, 2017 Thomas Fire, 2018 Carr Fire]
- IC Plan: "Going direct with engines on the south flank"
- Alignment Score: 42% YELLOW
- Reasoning: ["Direct attack failed in 60% of similar wind-driven fires.
  2007 Witch Fire escaped initial attack under identical conditions.",
  "Recommend indirect dozer lines with 2-dozer width minimum.",
  "Air tanker support critical — steep terrain failures in 2017 Thomas Fire."]
- Recommended adjustment: "Switch to indirect attack with dozer lines and
  request air tanker support within 30 minutes"

SCENARIO 2 — "The Grass Fire" (Green Score)
- Voice input: "Grass fire moving slowly in flat terrain, light winds 10mph,
  no structures nearby, single engine on scene"
- Extracted entities: {fuel: "Grass", behavior: "Slow spread",
  wind_speed: "10mph", terrain: "Flat", threat: "None immediate"}
- Matched fires: [similar contained grass fires]
- IC Plan: "Direct attack with single engine, wet line around perimeter"
- Alignment Score: 88% GREEN
- Reasoning: ["Plan strongly aligns with successful containment in 85% of
  similar grass fires.", "Low wind and flat terrain favor direct attack.",
  "Monitor for wind shift — grass fires can change rapidly."]
- Recommended adjustment: "Request one additional engine for safety margin"

SCENARIO 3 — "The Canyon Fire" (Red Score)
- Voice input: "Fire in steep canyon with mixed chaparral, upslope winds
  increasing, spotted across the creek, evacuation route threatened"
- Extracted entities: {fuel: "Mixed Chaparral", behavior: "Spotting across creek",
  wind_speed: "Increasing upslope", terrain: "Steep Canyon",
  threat: "Evacuation Route"}
- Matched fires: [2003 Cedar Fire, 2021 Caldor Fire]
- IC Plan: "Hold the line at the creek and wait for air support"
- Alignment Score: 28% RED
- Reasoning: ["Critical: Fire has already spotted across the creek — holding
  the creek line is no longer viable. 2003 Cedar Fire escaped identically.",
  "Steep canyon + upslope winds = extreme blowup potential within 1 hour.",
  "Immediate evacuation alert recommended for downwind communities."]
- Recommended adjustment: "Abandon creek line, establish new anchor point
  on the ridge road, and issue immediate evacuation alert"

2. Create a component DemoModeToggle.jsx:
- Hidden toggle activated by tapping the app logo 3 times rapidly
- When active, shows a subtle "DEMO" badge in the corner
- Replaces live API calls with hardcoded scenario data
- Allows cycling through scenarios with a swipe or button

3. Create a hook useDemoMode.js:
- Returns { isDemoMode, currentScenario, nextScenario, toggleDemoMode }
- When isDemoMode is true, all API calls return demo data instead
- Seamlessly integrates — the UI looks identical in demo mode vs live mode
```

---

## UI/UX Implementation

### Theme System (Day/Night Mode)

**Claude Code prompt:**
```
Set up a dark/light theme system for a Next.js app with Tailwind CSS:

- Dark mode is DEFAULT (firefighters often work at night)
- Theme toggle is a sun/moon icon button in the top-left corner
- Use CSS variables for all colors so the entire app switches instantly
- Persist theme choice in a React state (no localStorage needed for hackathon)

Color tokens:
DARK MODE:
  --bg-primary: #0A0A0A (near-black)
  --bg-secondary: #1A1A1A (card backgrounds)
  --bg-tertiary: #2A2A2A (input fields)
  --text-primary: #FFFFFF
  --text-secondary: #A0A0A0
  --accent: #FF6B35 (Redhue brand — fire orange)
  --border: #333333

LIGHT MODE:
  --bg-primary: #F5F5F5
  --bg-secondary: #FFFFFF
  --bg-tertiary: #E5E5E5
  --text-primary: #1A1A1A
  --text-secondary: #666666
  --accent: #FF6B35 (same brand color)
  --border: #DDDDDD

Score colors (same in both modes):
  --score-green: #22C55E
  --score-yellow: #EAB308
  --score-red: #EF4444
```

### Navigation (Bottom Tab Bar)

```
┌──────────────────────────────────────┐
│  [🎤 Listen]  [🔥 Matches]  [📊 Analyze] │
└──────────────────────────────────────┘
```

- 3 tabs, always visible at bottom of screen
- Active tab highlighted with accent color
- Each tab is a full page in Next.js App Router
- Minimum 60px height for glove-friendly tapping
- State persists across tabs (situation data carries from Listen → Matches → Analyze)

### Responsive Design Rules

- **Max width:** 480px container (phone-optimized)
- **Font sizes:** Minimum 16px body, 24px+ headers, 72px+ for alignment score
- **Touch targets:** Minimum 60px height for all buttons and interactive elements
- **Padding:** Generous (16px+ on all sides)
- **No hover states** — this is touch-only
- **No scrolling required** for critical information on any single screen

---

## API Keys & Environment Configuration

### .env.local (NEVER commit to git)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deepgram
DEEPGRAM_API_KEY=your-deepgram-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-anthropic-key

# OpenAI (Embeddings only)
OPENAI_API_KEY=your-openai-key

# App Config
NEXT_PUBLIC_APP_NAME=Redhue
```

### .gitignore (Critical)

```
.env.local
.env*.local
node_modules/
.next/
data/ca-fires-embedded.json
```

---

## 36-Hour Build Plan

### Friday Night: Hours 0–6 (9:30 PM – 3:30 AM)

**Goal:** Skeleton app that connects to all services.

| Hour | Task | Deliverable |
|------|------|------------|
| 0-1 | Init Next.js project with Claude Code, install deps, configure Tailwind, set up .env.local | Running dev server with dark mode shell |
| 1-2 | Set up Supabase table + pgvector extension + match_fires function | Database ready with SQL schema |
| 2-4 | Run data prep script: CSV → JSON → embeddings → seed Supabase | ~2,000 fire records with vectors in Supabase |
| 4-5 | Build basic page layout: 3 tabs, navigation, theme toggle | Navigable shell app |
| 5-6 | Deploy to Vercel, confirm it works on phone | Live URL accessible on iPhone |

**Checkpoint:** A blank but deployed app with a working database full of historical fire data.

### Saturday Morning: Hours 6–14 (3:30 AM – 11:30 AM)

**Goal:** Voice pipeline works end-to-end. "You speak, JSON appears."

| Hour | Task | Deliverable |
|------|------|------------|
| 6-7 | Sleep / power nap (seriously — you need this) | Rested brain |
| 7-9 | Build MicButton component + /api/transcribe route (Deepgram) | Tap mic → see transcript text |
| 9-11 | Build /api/extract route (Claude Sonnet 4.5) + EntityTags component | Speak → see extracted entity tags |
| 11-12 | Test voice pipeline on iPhone, fix mobile Safari issues | Working voice → entities on phone |
| 12-14 | Build demo fallback system (demo-scenarios.json + DemoModeToggle) | Safety net ready |

**Checkpoint:** Tap mic on phone, speak a fire description, see entity tags appear. Demo fallback works.

### Saturday Afternoon: Hours 14–22 (11:30 AM – 7:30 PM)

**Goal:** The "brain" works. "You speak, app shows matching historical fires."

| Hour | Task | Deliverable |
|------|------|------------|
| 14-16 | Build /api/search route (embed situation → Supabase pgvector query) | API returns similar fires |
| 16-18 | Build FireCard + FireCarousel components | Matches display as cards |
| 18-20 | Connect voice → extraction → search → display pipeline end-to-end | Full Feature 1 + Feature 2 flow |
| 20-22 | Test, debug, optimize latency | Smooth <2 second pipeline |

**Checkpoint:** Speak a fire description → see entity tags → see 3-5 matching historical fires with details.

### Saturday Night: Hours 22–28 (7:30 PM – 1:30 AM)

**Goal:** Analyze tab works. The "closer" feature is live.

| Hour | Task | Deliverable |
|------|------|------------|
| 22-24 | Build /api/analyze route (Claude Opus 4.6 critique prompt) | API returns score + reasoning |
| 24-26 | Build AlignmentGauge + ReasoningBullets components | Score and reasoning display |
| 26-27 | Connect Analyze tab: mic → plan transcription → critique → display | Full Feature 3 flow |
| 27-28 | Test all 3 demo scenarios through the complete pipeline | All 3 features work end-to-end |

**Checkpoint:** Complete trifecta works. Speak situation → see matches → speak plan → see alignment score with reasoning.

### Sunday Morning: Hours 28–36 (1:30 AM – 9:30 AM)

**Goal:** Polish, practice, prepare to win.

| Hour | Task | Deliverable |
|------|------|------------|
| 28-29 | Sleep / power nap | Rested for pitch |
| 29-31 | CSS polish: ensure dark/light mode looks clean, fonts consistent, spacing tight | Professional-looking app |
| 31-32 | Test demo fallback: confirm 3 scenarios cycle smoothly | Bulletproof demo backup |
| 32-33 | Final deployment to Vercel, test on iPhone one last time | Live, working URL |
| 33-34 | Write Devpost submission (description, screenshots, tech stack, video if required) | Devpost ready |
| 34-36 | Practice pitch 3-5 times with timer. Practice answering judge questions. | Confident, timed delivery |

---

## Demo Strategy & Judge Preparation

### The 5-Minute Demo Script

**Minute 0:00–0:45 — The Hook**
"In the first 3 hours of a wildfire, the Incident Commander makes decisions that determine whether a fire is contained or becomes a disaster. They're juggling 5 different tools, processing a thousand inputs, wearing heavy gear, in smoke and noise. Right now, there is no tool that takes what they know from past fires and puts it in their ear at the moment they need it. That's the gap. That's Redhue."

**Minute 0:45–1:15 — What Redhue Is**
"Redhue is a voice-first AI decision support tool. The IC speaks naturally — no typing, no menus. Redhue understands the fire, searches thousands of historical California wildfire records, and surfaces what worked and what failed in fires just like this one. Then, the IC can stress-test their plan before committing resources."

**Minute 1:15–3:30 — Live Demo**
1. Hold up iPhone showing Redhue in dark mode
2. Tap the mic button: "We have a wind-driven fire in heavy brush, spotting 200 yards ahead, structures threatened on the north ridge, winds 30 miles per hour from the northeast."
3. [Pause] Show entity tags appearing: FUEL: HEAVY BRUSH, BEHAVIOR: SPOTTING 200YD, WIND: 30MPH NE, THREAT: STRUCTURES
4. Tap Matches tab: "Redhue found 3 analogous fires. The top match is the 2007 Witch Fire — similar conditions, and direct attack failed."
5. Tap Analyze tab, tap mic: "I'm planning to go direct with engines on the south flank."
6. [Pause] Show alignment score: 42% YELLOW
7. Read the reasoning: "Direct attack failed in 60% of similar conditions. Recommend indirect dozer lines. Air tanker support critical based on the 2017 Thomas Fire."
8. "The IC now has the wisdom of thousands of past fires — in 2 seconds, hands-free."

**Minute 3:30–4:15 — The Impact**
"We're not replacing the incident commander. We're giving them institutional memory. When a veteran firefighter retires, their 30 years of hard-won knowledge leaves with them. Redhue keeps that knowledge alive and makes it accessible to every IC in California."

**Minute 4:15–5:00 — Future Vision + Ask**
"This prototype uses the ICS-209-PLUS dataset — 35,000+ wildfire incidents. The next step is partnership with CAL FIRE and FireWERX to integrate real-time data feeds and expand the historical database. We're Redhue — AI-powered institutional memory for wildfire response."

### Anticipated Judge Questions & Answers

**Q: "How accurate is the matching? Can you trust it?"**
A: "Great question. We're not predicting the future — we're quantifying the past. The Historical Alignment Score tells you how closely your plan aligns with tactics that succeeded in similar historical fires. It's transparent — every score comes with specific fire citations so the IC can verify the reasoning. It's a decision support tool, not a decision-making tool."

**Q: "What data are you using? How much?"**
A: "The ICS-209-PLUS dataset — it's the gold standard for wildfire incident reporting. 35,000+ incidents from 1999-2020 with daily snapshots of fire behavior, resources, tactics, and outcomes. We filtered to California fires over 100 acres — about 2,000 records. Each one is embedded as a vector using OpenAI's text-embedding-3-large model and searched via Supabase pgvector for similarity matching."

**Q: "How does the voice recognition work in noisy field conditions?"**
A: "We use Deepgram Nova-2, which handles background noise significantly better than alternatives like Whisper. It processes in under 300 milliseconds. And we use push-to-talk rather than always-listening, so the IC controls when it's capturing audio."

**Q: "What happens if the AI gives bad advice?"**
A: "Redhue never gives orders — it gives context. The alignment score is always accompanied by reasoning that cites specific historical fires. The IC makes the final call. And the scoring methodology is transparent: 40% situational similarity, 40% tactical match, 20% negative outcome penalty. There's no black box."

**Q: "How is this different from WFDSS or Technosylva?"**
A: "Those are strategic planning tools for long-duration fires — they run on desktops and take minutes to configure. Redhue is tactical and designed for the initial attack period — 0 to 3 hours — when decisions are fastest and most critical. It's voice-first, hands-free, and fits in a pocket. It fills the gap between prediction tools and operational decision-making."

**Q: "Could this actually be used by CAL FIRE?"**
A: "That's the goal. CAL FIRE's own innovation strategy calls for improved 'intelligence, situational awareness, and connectivity' on the fireline. FireWERX and the AI Collaborative are actively seeking AI prototypes for wildfire response. This demo proves the concept — the next step is partnership for real-world data integration and field testing."

**Q: "What would you build next?"**
A: "Real-time weather API integration so Redhue automatically knows current wind conditions. Map visualization showing where matched historical fires burned. And multi-user support so division supervisors can see the same intelligence as the IC. But the core concept — voice in, historical wisdom out, plan critique back — that's proven today."

---

## Troubleshooting Guide

### Common Issues & Fixes

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Mic doesn't work on iPhone | Safari requires HTTPS for MediaRecorder | Vercel deploys with HTTPS by default — test on deployed URL, not localhost |
| Deepgram returns empty transcript | Audio format not supported | Ensure MediaRecorder uses 'audio/webm;codecs=opus' — Deepgram handles this natively |
| Entity extraction returns garbage | Transcript was too noisy/short | Add a minimum length check — if transcript < 10 words, ask IC to repeat |
| Vector search returns irrelevant matches | Embeddings quality issue | Check that narrative strings are rich enough — add more fields to the narrative template |
| Analyze takes too long (>5 seconds) | Opus 4.6 is slower on complex prompts | Shorten the prompt, reduce matched_fires to top 3, or fall back to Sonnet 4.5 |
| Vercel cold start is slow | First request after idle period | Before demo: open the app 2 minutes early to warm up the serverless functions |
| App looks broken on iPhone | CSS issue with mobile Safari | Test on actual iPhone during build, not just browser DevTools mobile view |
| Demo mode won't activate | Triple-tap detection timing | Increase the tap window to 1.5 seconds between taps |

### Emergency Demo Protocol

If something breaks during the live demo:
1. **Stay calm.** Judges respect composure under pressure.
2. **Switch to demo mode** (triple-tap logo). Pre-loaded scenarios will work perfectly.
3. **Say:** "Let me show you the full capability with a pre-loaded scenario" — judges understand live demos have variables.
4. **Continue the pitch** as if nothing happened. The story and the concept matter more than live API calls.

---

## Cost Breakdown

### Hackathon Build (36 Hours)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Free (Hobby) | $0 | Hosting + deployment |
| Supabase | Free (Hobby) | $0 | 500MB DB, pgvector included |
| Deepgram | Free ($200 credit) | $0 | Sign up before hackathon |
| Claude API | Hackathon credits | $0 | Entity extraction + plan critique |
| OpenAI Embeddings | Pay-as-you-go | ~$0.50 | One-time cost to embed ~2,000 fires |
| Claude Code | Existing subscription | $0 | Your coding agent |
| **Total** | | **~$0.50** | |

### Post-Hackathon (If Continuing Development)

| Service | Monthly Cost | At Scale |
|---------|-------------|----------|
| Vercel Pro | $20 | Better performance |
| Supabase Pro | $25 | More connections + storage |
| Deepgram | Pay-per-use | ~$0.0059/min |
| Claude API | Pay-per-use | ~$15-50/mo depending on usage |
| OpenAI Embeddings | Pay-per-use | Negligible |
| **Total** | **~$60-100/mo** | For initial production use |

---

## Important Limitations

### What This Hackathon Prototype CAN'T Do

1. **No real-time fire data:** It matches against historical records, not live satellite/sensor feeds.
   - *Workaround:* Frame this as "institutional memory" not "real-time intelligence"

2. **No offline capability:** Requires internet for all API calls.
   - *Workaround:* Demo fallback scenarios work without API calls if pre-loaded

3. **Historical data gaps:** ICS-209-PLUS data may have inconsistent fields across years.
   - *Workaround:* Pre-clean the data; narrative strings handle missing fields gracefully

4. **Single-user only:** No multi-user, no shared state between IC and crew.
   - *Workaround:* Frame as "IC's personal AI aide" — multi-user is a future feature

5. **Alignment score is heuristic, not physics-based:** It quantifies historical alignment, not physical fire behavior modeling.
   - *Workaround:* This is actually a STRENGTH for judges — it's honest and defensible

### When You'd Need to Upgrade

- **Real-world field testing:** Need offline mode, mesh networking, ruggedized UI testing
- **CAL FIRE partnership:** Need compliance review, data security audit, integration with existing systems
- **Scale beyond California:** Need national fire dataset, multi-state deployment

---

## Success Checklist

### Before the Hackathon (Do NOW)
- [ ] All accounts created (Vercel, Supabase, Deepgram, OpenAI, Anthropic)
- [ ] All API keys saved in a secure note
- [ ] ICS-209-PLUS CSV downloaded
- [ ] CSV filtered to California fires > 100 acres
- [ ] Claude Code installed and working
- [ ] Node.js installed on Windows Surface
- [ ] GitHub repo created

### During the Hackathon
- [ ] Hour 6: Skeleton app deployed with database seeded
- [ ] Hour 14: Voice → entity extraction working on phone
- [ ] Hour 14: Demo fallback system built and tested
- [ ] Hour 22: Analogous fire matching working end-to-end
- [ ] Hour 28: Analyze tab with alignment score working
- [ ] Hour 32: UI polished, dark/light mode working
- [ ] Hour 34: Devpost submission complete
- [ ] Hour 36: Pitch practiced 3+ times

### Before the Demo
- [ ] App loaded on iPhone 2 minutes early (warm up serverless)
- [ ] Demo mode tested and ready as backup
- [ ] Phone volume up, mic permissions granted
- [ ] Timer practiced — fits in 5 minutes
- [ ] Answers to judge questions rehearsed

---

*Technical Design for: Redhue*
*Approach: AI-Built Serverless Full-Stack*
*Build Time: 36 hours*
*Coding Agent: Claude Code*
*Estimated Cost: ~$0.50*

---
*Document created: February 2026*
*Status: Ready for Build*
*Next Step: Hackathon starts → execute the 36-hour build plan*
