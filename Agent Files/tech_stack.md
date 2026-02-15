# Tech Stack & Tools — Redhue

## Complete Stack

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| Frontend | Next.js (React) | 14+ (App Router) | Pages, routing, API routes |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Hosting | Vercel | Free Hobby Tier | Auto-deploy from GitHub |
| Database | Supabase (Postgres + pgvector) | Free Tier | Fire data storage + vector similarity search |
| Voice-to-Text | Deepgram Nova-2 | REST API | Speech transcription (<300ms) |
| LLM (Extraction) | Claude Sonnet 4.5 | claude-sonnet-4-5-20250929 | Entity extraction from IC speech |
| LLM (Critique) | Claude Opus 4.6 | claude-opus-4-6 | Tactical plan critique + alignment scoring |
| Embeddings | OpenAI text-embedding-3-large | API | 3072-dim vectors for fire similarity matching |
| Coding Agent | Claude Code | CLI | AI writes all code |

## Setup Commands

```bash
# Initialize project
npx create-next-app@latest redhue --typescript --tailwind --eslint --app --src-dir
cd redhue

# Install dependencies
npm install @supabase/supabase-js          # Supabase client
npm install @anthropic-ai/sdk              # Claude API
npm install openai                          # OpenAI embeddings
npm install csv-parse                       # CSV parsing for data prep

# Dev dependencies
npm install -D @types/node @types/react
```

## API Clients — How to Initialize

### Supabase Client (src/lib/supabase.js)
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// For server-side operations (seeding, admin)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

### Anthropic Client (src/lib/anthropic.js)
```javascript
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Entity extraction — use Sonnet (fast + cheap)
export async function extractEntities(transcript) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    system: `You are a wildland fire tactical aide...`, // Full prompt in code_patterns.md
    messages: [{ role: 'user', content: transcript }]
  })
  return JSON.parse(response.content[0].text)
}

// Plan critique — use Opus (best reasoning)
export async function analyzePlan(plan, situation, matchedFires) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1000,
    system: `You are an expert wildland fire tactical analyst...`, // Full prompt in code_patterns.md
    messages: [{ role: 'user', content: JSON.stringify({ plan, situation, matchedFires }) }]
  })
  return JSON.parse(response.content[0].text)
}
```

### OpenAI Client (src/lib/openai.js)
```javascript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
  })
  return response.data[0].embedding // 3072-dimensional vector
}
```

### Deepgram (src/lib/deepgram.js)
```javascript
export async function transcribeAudio(audioBlob) {
  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
      'Content-Type': audioBlob.type || 'audio/webm',
    },
    body: audioBlob,
  })
  const data = await response.json()
  return data.results.channels[0].alternatives[0].transcript
}
```

## Supabase Database Schema

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Historical fires table
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
    embedding VECTOR(3072)
);

-- Index for fast similarity search
CREATE INDEX ON historical_fires
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Similarity search function
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

## Deployment

### Vercel
- Connect GitHub repo → auto-deploys on push to main
- Add all environment variables in Vercel dashboard → Settings → Environment Variables
- Free Hobby tier is sufficient for hackathon
- **Important:** First cold-start request can be slow (3-5s). Warm up before demo by loading the app 2 minutes early.

### Vercel Environment Variables to Set
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPGRAM_API_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
```
