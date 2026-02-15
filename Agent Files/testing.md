# Testing Strategy — Redhue

## Testing Philosophy (Hackathon Edition)
No automated test suite. Manual verification on real device after each feature. Speed over coverage.

## Verification Method: Manual Testing on iPhone

### After Every Feature Change:
1. Run `npm run dev`
2. Open on iPhone (use local network IP or deploy to Vercel)
3. Test the specific feature that changed
4. Test on dark mode AND light mode
5. Verify text is readable, buttons are tappable with finger (simulating gloves)
6. Check browser console for errors

### Phase-Specific Test Plans

#### Phase 1: Foundation
- [ ] `npm run dev` starts without errors
- [ ] App loads on iPhone Safari
- [ ] App loads on iPhone Chrome
- [ ] 3-tab navigation works (Listen, Matches, Analyze)
- [ ] Dark/light mode toggle switches themes
- [ ] Dark mode is default on first load
- [ ] Deployed Vercel URL loads correctly

#### Phase 2: Voice Pipeline
- [ ] Mic button is visible and large (≥80px)
- [ ] Tapping mic requests microphone permission
- [ ] Recording shows visual feedback (pulsing animation)
- [ ] Releasing mic shows processing state (spinner)
- [ ] Speaking a fire description → transcript appears
- [ ] Entity tags appear with correct categories
- [ ] Tags are color-coded and readable
- [ ] Error state shows friendly message if mic fails
- [ ] Demo mode activates with triple-tap on logo
- [ ] Demo scenario 1 loads correctly in demo mode

#### Phase 3: Analogous Fire Retrieval
- [ ] After voice extraction, Matches tab shows fire cards
- [ ] 3-5 fire cards appear with names, years, details
- [ ] Cards are scrollable
- [ ] Fire outcome is color-coded (green = contained, red = escaped)
- [ ] Similarity percentage is displayed
- [ ] Loading state shows while searching
- [ ] Full pipeline: speak → tags → fire matches in <4 seconds total

#### Phase 4: Analyze Tab
- [ ] Analyze tab has its own mic button for plan input
- [ ] Speaking a plan → alignment score appears
- [ ] Score gauge is color-coded (Green/Yellow/Red)
- [ ] 2-3 reasoning bullets appear with fire citations
- [ ] Recommended adjustment is highlighted
- [ ] All 3 demo scenarios produce correct scores:
  - Scenario 1 (Brush Fire): Yellow, ~42%
  - Scenario 2 (Grass Fire): Green, ~88%
  - Scenario 3 (Canyon Fire): Red, ~28%

#### Phase 5: Polish
- [ ] All screens look clean in dark mode
- [ ] All screens look clean in light mode
- [ ] No text is smaller than 16px
- [ ] No buttons are smaller than 60px
- [ ] App logo visible and correctly positioned
- [ ] No JavaScript console errors
- [ ] Full end-to-end flow works: Listen → Matches → Analyze
- [ ] Demo fallback works flawlessly with all 3 scenarios
- [ ] App loads on deployed Vercel URL on iPhone

### Pre-Demo Checklist (Before Presenting to Judges)
- [ ] Open app on iPhone 2 minutes early (warm up Vercel cold start)
- [ ] Verify microphone permissions are granted
- [ ] Test one live voice input to confirm APIs are responding
- [ ] Verify demo mode toggle works (triple-tap logo)
- [ ] Phone volume is up
- [ ] Phone is NOT on Do Not Disturb (mic may not work)
- [ ] Phone is charged or plugged in
- [ ] Have demo scenarios ready as backup

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Mic not working on iPhone | Check HTTPS (Vercel should handle), check permissions in Settings |
| Blank screen on phone | Check console for hydration errors, ensure `'use client'` on interactive components |
| API returning 500 errors | Check .env.local has all keys, check Vercel env vars match |
| Slow response (>5 seconds) | Could be Vercel cold start — retry. If persistent, switch to demo mode |
| Entity extraction returns empty | Transcript was too short — speak longer, more descriptive sentences |
| Vector search returns no matches | Lower the match_threshold in the Supabase function (try 0.3 instead of 0.5) |
| Score always shows same value | Check that matched fires are being passed to the analyze endpoint |

## Emergency Protocol (During Live Demo)
1. If something breaks → stay calm
2. Triple-tap logo → activate demo mode
3. Say to judges: "Let me show you the full capability with a prepared scenario"
4. Continue pitch as normal — judges understand live demos have variables
5. The concept and vision matter more than a live API call
