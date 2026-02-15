# Code Patterns — Redhue

## Component Patterns

### All Components Must Follow These Rules
- Tailwind CSS only — no inline styles, no CSS modules
- Support dark and light mode via CSS variables
- All interactive elements: minimum 60px height
- All body text: minimum 16px (1rem)
- No hover states — touch-only interactions
- Use `'use client'` directive for components with interactivity or browser APIs

### Component Template
```jsx
'use client'

import { useState } from 'react'

export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue)

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Component content */}
    </div>
  )
}
```

### Theme CSS Variables (globals.css)
```css
:root {
  /* Light mode (secondary) */
  --bg-primary: #F5F5F5;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #E5E5E5;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --accent: #FF6B35;
  --border: #DDDDDD;
}

[data-theme='dark'] {
  /* Dark mode (default) */
  --bg-primary: #0A0A0A;
  --bg-secondary: #1A1A1A;
  --bg-tertiary: #2A2A2A;
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --accent: #FF6B35;
  --border: #333333;
}

/* Score colors — same in both modes */
:root {
  --score-green: #22C55E;
  --score-yellow: #EAB308;
  --score-red: #EF4444;
}
```

---

## API Route Patterns

### Standard API Route Template
```javascript
// src/app/api/[endpoint]/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.requiredField) {
      return NextResponse.json({ error: 'Missing required field' }, { status: 400 })
    }

    // Process
    const result = await someOperation(body)

    // Return
    return NextResponse.json(result)

  } catch (error) {
    console.error('[API_NAME] Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
```

---

## LLM Prompt Templates

### Entity Extraction Prompt (Claude Sonnet 4.5)
Used in `/api/extract/route.js`

```
SYSTEM PROMPT:
You are a wildland fire tactical aide. An incident commander is reporting a fire situation via radio. Extract structured entities from their speech.

Return ONLY valid JSON with these fields:
{
  "fuel": "vegetation type (e.g., Brush, Grass, Oak Woodland, Chaparral, Mixed Timber)",
  "behavior": "fire behavior (e.g., Spotting, Crowning, Backing, Running, Creeping, Torching)",
  "rate_of_spread": "estimated rate if mentioned (e.g., Fast, Moderate, Slow, or specific chains/hour)",
  "wind_speed": "wind speed if mentioned (e.g., 25mph, Light, Gusty)",
  "wind_direction": "wind direction if mentioned (e.g., NE, Southwest, Upslope)",
  "terrain": "terrain description (e.g., Steep Canyon, Flat, Ridge, Drainage, Saddle)",
  "threat": "what is threatened (e.g., Structures, Powerlines, Evacuation Route, Highway)",
  "threat_detail": "specific details about the threat if mentioned",
  "resources_on_scene": "any resources mentioned (e.g., 2 engines, 1 dozer, air tanker)"
}

RULES:
- If a field is not mentioned in the speech, set it to null
- Do not infer or guess — only extract what was explicitly stated
- Normalize fuel types to standard wildfire terminology
- Return ONLY the JSON object, no other text
```

### Plan Critique Prompt (Claude Opus 4.6)
Used in `/api/analyze/route.js`

```
SYSTEM PROMPT:
You are an expert wildland fire tactical analyst with decades of experience. An incident commander has described their current fire situation and proposed a tactical plan. You have been provided with 3-5 historically similar fires and their outcomes.

Your job is to calculate a Historical Alignment Score and provide reasoning.

SCORING METHODOLOGY:
1. Situational Similarity (40%): How closely do the matched historical fires align with the current situation? Use the similarity scores provided.
2. Tactical Match (40%): Does the IC's proposed plan match tactics that SUCCEEDED in the similar historical fires? Award points if the plan aligns with successful tactics. Deduct if the plan matches tactics that FAILED.
3. Negative Outcome Penalty (20%): Did any of the similar fires result in escaped fires, injuries, or fatalities? If yes, apply a penalty to warn the IC.

RESPONSE FORMAT (return ONLY valid JSON):
{
  "score": <number 0-100>,
  "rating": "GREEN" | "YELLOW" | "RED",
  "reasoning": [
    "First critical consideration citing a specific historical fire by name and year",
    "Second consideration with tactical recommendation",
    "Third consideration if applicable"
  ],
  "recommended_adjustment": "One specific actionable adjustment to the IC's plan"
}

RATING THRESHOLDS:
- GREEN (70-100): Plan strongly aligns with historical success
- YELLOW (40-69): Plan has partial alignment, caution advised
- RED (0-39): Plan conflicts with historical patterns, reconsider

RULES:
- Always cite specific historical fire names and years in reasoning
- Be direct and concise — each reasoning bullet max 2 sentences
- Focus on actionable intelligence, not general advice
- Never say "I think" — present as data-driven findings from historical records
- Return ONLY the JSON object, no other text
```

### Narrative Generation Template
Used in `scripts/prepare-data.js` to create searchable narratives from CSV data:

```
For each fire record, generate a string like:
"Fire: [incident_name]. Year: [year]. Fuel: [fuel_type]. Wind: [wind_speed] [wind_direction]. Terrain: [terrain]. Behavior: [fire_behavior]. Rate of Spread: [ros]. Tactics Used: [tactics]. Resources Deployed: [resources]. Structures Threatened: [count]. Structures Destroyed: [count]. Outcome: [contained/escaped]. Final Size: [acres] acres."

Skip any null fields — don't include them in the string.
```

---

## State Management Pattern

### Global App State
Use React Context to share state across the 3 tabs (Listen → Matches → Analyze). This avoids prop drilling.

```jsx
// src/lib/AppContext.js
'use client'

import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  // Situation data from voice extraction
  const [situation, setSituation] = useState(null)
  // Raw transcript
  const [transcript, setTranscript] = useState('')
  // Matched historical fires
  const [matchedFires, setMatchedFires] = useState([])
  // Analysis results
  const [analysis, setAnalysis] = useState(null)
  // Demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  // Loading states
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <AppContext.Provider value={{
      situation, setSituation,
      transcript, setTranscript,
      matchedFires, setMatchedFires,
      analysis, setAnalysis,
      isDemoMode, setIsDemoMode,
      isListening, setIsListening,
      isProcessing, setIsProcessing,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
```

### Demo Mode Hook
```jsx
// src/lib/useDemoMode.js
'use client'

import { useState, useRef } from 'react'
import demoScenarios from '@/data/demo-scenarios.json'

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const tapCount = useRef(0)
  const tapTimer = useRef(null)

  // Triple-tap logo to activate demo mode
  const handleLogoTap = () => {
    tapCount.current++
    if (tapCount.current === 3) {
      setIsDemoMode(prev => !prev)
      tapCount.current = 0
    }
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 1500)
  }

  const currentScenario = demoScenarios[scenarioIndex]
  const nextScenario = () => setScenarioIndex((i) => (i + 1) % demoScenarios.length)

  return { isDemoMode, currentScenario, nextScenario, handleLogoTap }
}
```

---

## Voice Capture Pattern

### Push-to-Talk with MediaRecorder
```jsx
// Core logic for MicButton component
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus'
  })
  const chunks = []

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
    stream.getTracks().forEach(track => track.stop())
    // Send to /api/transcribe
    await processAudio(blob)
  }

  mediaRecorder.start()
  return mediaRecorder
}
```

**Important Mobile Safari Notes:**
- MediaRecorder is supported in Safari 14.5+
- Must use `audio/webm` or `audio/mp4` — check `MediaRecorder.isTypeSupported()`
- HTTPS is required for `getUserMedia` — Vercel handles this automatically
- Test on actual iPhone, not just browser DevTools

---

## Error Handling Pattern

### User-Facing Errors
Never show raw error messages. Always show a friendly message:

```jsx
const ERROR_MESSAGES = {
  TRANSCRIPTION_FAILED: "Couldn't hear that clearly. Try speaking closer to the mic.",
  EXTRACTION_FAILED: "Couldn't understand the fire details. Try describing again.",
  SEARCH_FAILED: "Error searching historical fires. Retrying...",
  ANALYZE_FAILED: "Couldn't analyze the plan. Try again.",
  MIC_PERMISSION: "Microphone access needed. Check your browser settings.",
  NETWORK: "Connection issue. Check your internet.",
}
```

### API Error Handling
```javascript
// Wrap all API calls with retry logic
async function apiCallWithRetry(fn, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1))) // Backoff
    }
  }
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MicButton.jsx`, `FireCard.jsx` |
| Pages | lowercase | `page.js`, `layout.js` |
| API Routes | lowercase | `route.js` in named folders |
| Utilities | camelCase | `generateEmbedding.js` |
| CSS variables | kebab-case | `--bg-primary`, `--text-secondary` |
| Constants | SCREAMING_SNAKE | `SCORE_GREEN_THRESHOLD = 70` |
| Environment vars | SCREAMING_SNAKE | `ANTHROPIC_API_KEY` |
