# Project Brief (Persistent) — Redhue

## Product Vision
Redhue is a voice-first AI decision support tool that gives wildfire incident commanders the wisdom of thousands of past California wildfires — in 2 seconds, hands-free — during the critical initial attack period (0–3 hours).

## Who This Is For
- **Primary:** Any wildfire IC in California
- **Secondary:** On-site firefighters processing tactical information
- **Key traits:** Pragmatic, skeptical of black boxes, wearing heavy gloves, under extreme stress, need answers in 3 seconds

## Coding Conventions
- **Framework:** Next.js 14 App Router (`src/app/` directory)
- **Styling:** Tailwind CSS utility classes only — no custom CSS files beyond globals.css
- **Components:** Functional React components with hooks. `'use client'` directive for interactive components.
- **State:** React Context (AppContext) for shared state across tabs. `useState` for local component state.
- **API Routes:** Next.js Route Handlers in `src/app/api/[name]/route.js`
- **No TypeScript for hackathon:** Use plain JavaScript (.js/.jsx) to move faster. TypeScript can be added post-hackathon.
- **No testing framework for hackathon:** Manual testing on iPhone is the verification method.
- **No auth:** No login, no user accounts, no sessions. The app is open for the demo.

## Quality Gates
- Every feature must work on iPhone Safari before moving to the next feature
- Every API route must handle errors gracefully (try/catch, user-friendly error messages)
- The demo fallback system must be built and tested before Phase 3 begins
- Dark mode must look correct before light mode is polished
- All buttons ≥60px height, all text ≥16px

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build (test before deploy)
npm run lint         # Lint check
npx vercel           # Manual deploy
```

## When to Update This Brief
- After each phase is completed
- When a new convention is established
- When a technical decision changes (e.g., switching from context stuffing to pgvector)

## Critical Hackathon Rules
1. **Working > Pretty.** A functioning demo beats a beautiful broken one.
2. **30-Minute Rule.** If stuck on something for 30 minutes, find a workaround or hardcode it.
3. **Demo Fallback.** Always have the 3 hardcoded scenarios ready as backup.
4. **Sleep.** Take at least one 1-2 hour nap. A rested brain solves problems faster.
5. **Test on Real Phone.** Browser DevTools mobile view lies. Test on actual iPhone.
6. **Warm Up Vercel.** Load the app 2 minutes before the demo to avoid cold-start delays.
