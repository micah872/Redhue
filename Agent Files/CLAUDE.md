# CLAUDE.md — Claude Code Configuration for Redhue

## Project Context
**App:** Redhue — AI Wildfire IC Assistant
**Stack:** Next.js 14 (App Router) + Tailwind CSS + Supabase pgvector + Deepgram + Claude API + OpenAI Embeddings
**Stage:** MVP Hackathon Build (36 hours)
**User Level:** Vibe-coder (AI writes all code, user guides and troubleshoots)
**Dev Machine:** Windows Surface with VSCode

## Directives
1. **Master Plan:** Always read `AGENTS.md` first. It contains the current phase, active tasks, and project state.
2. **Documentation:** Refer to `agent_docs/` for detailed specs. Load only the file relevant to the current task.
3. **Plan-First:** Propose a brief plan and wait for approval before writing code.
4. **Incremental Build:** Build one small feature at a time. Test after each.
5. **Explain Simply:** The builder is a vibe-coder. Explain what you're doing and why in plain English.
6. **Speed Priority:** This is a hackathon. Working code > perfect code. Ship fast.
7. **Mobile-First:** All UI must work on iPhone Safari and Chrome. Test responsive design.
8. **Demo-Aware:** Every feature should be demoable. Build the demo fallback system early (Phase 2).

## Commands
```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production
npm run lint         # Check code style

# Data preparation (run once during Phase 1)
node scripts/prepare-data.js       # CSV → JSON narratives
node scripts/generate-embeddings.js # Narratives → OpenAI vectors
node scripts/seed-supabase.js       # Upload vectors to Supabase

# Deployment
npx vercel           # Deploy to Vercel (or push to GitHub for auto-deploy)
```

## Project Structure
```
redhue/
├── src/app/                    # Next.js App Router pages
│   ├── layout.js               # Root layout (theme wrapper)
│   ├── page.js                 # Listen Mode (home — mic button)
│   ├── matches/page.js         # Analogous Fires display
│   ├── analyze/page.js         # Plan Critique + Alignment Score
│   └── api/                    # API routes (serverless functions)
│       ├── transcribe/route.js # Deepgram voice-to-text
│       ├── extract/route.js    # Claude Sonnet 4.5 entity extraction
│       ├── search/route.js     # Supabase pgvector similarity search
│       ├── analyze/route.js    # Claude Opus 4.6 plan critique
│       └── embed/route.js      # OpenAI embedding generation
├── src/components/             # React components
├── src/lib/                    # API clients and utilities
├── src/data/                   # Demo scenarios JSON
├── scripts/                    # Data prep scripts (run once)
├── AGENTS.md                   # Master plan (read this first)
├── CLAUDE.md                   # This file
├── agent_docs/                 # Detailed documentation
├── .env.local                  # API keys (never commit)
└── tailwind.config.js
```

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPGRAM_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

## Key Design Constraints
- All buttons: minimum 60px height (glove-friendly)
- All text: minimum 16px body, 24px+ headers
- Dark mode is DEFAULT — light mode is secondary
- Brand accent color: #FF6B35 (fire orange)
- Score colors: Green #22C55E, Yellow #EAB308, Red #EF4444
- "3-second rule": any info must be readable in 3 seconds
- No hover states — touch-only UI
- Max container width: 480px (phone-optimized)

## API Configuration
- **Entity Extraction:** Use Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) — fast + cheap for extraction
- **Plan Critique:** Use Claude Opus 4.6 (`claude-opus-4-6`) — best reasoning for tactical analysis
- **Embeddings:** Use OpenAI text-embedding-3-large (3072 dimensions)
- **Voice:** Use Deepgram Nova-2 REST API (not WebSocket — simpler for hackathon)
- **Vector Search:** Supabase pgvector with cosine similarity, return top 5 matches

## What NOT To Do
- Do NOT delete files without explicit confirmation
- Do NOT modify the Supabase schema after data is seeded
- Do NOT add features not in the current phase
- Do NOT add authentication or login — not needed for hackathon demo
- Do NOT use localStorage or sessionStorage — use React state only
- Do NOT add a map unless all 3 core features are complete
- Do NOT install unnecessary dependencies — check package.json first
- Do NOT use deprecated React patterns (class components, useEffect for data fetching)
- Do NOT apologize for errors — fix them immediately
- Do NOT generate filler text — be direct and concise
