# Ratings

Everything related to capturing, viewing, and exporting the dog's reaction to each thunder clap.

## Context

The app already has rating scaffolding that was never wired up:

- `src/types/index.ts` — `ThunderRating { clapId: number; rating: number; timestamp: number }`
- `src/utils/storage.ts` — `loadRatings()` / `saveRating()`, stored under key `dt_thunderRatings`
- `src/components/StarRating.tsx` — a 1–5 star component with hover, legend (😊 Calm → 😰 Scared), and a Skip button

But `src/App.tsx` never renders `StarRating`, and nothing calls `saveRating()`. The feature is ~80% written and is explicitly in the PRD (Priority 4), so wiring it up is the highest-value next step. It also creates the data that **Session logging**, **Adaptive auto-trainer**, and **Dog profiles** all build on.

## Part A — Capture a rating after each clap

### What needs to happen
- Prompt the user after a thunder clap **finishes** (not on tap), so the rating reflects the dog's reaction to the full clap.
- The engine already tells us when a clap ends: `onActiveThunderFileChanged(null)` fires in `source.onended`. Hook that in `useAudioEngine` and surface it to `App` (e.g. `lastClapEndedAt` or a `pendingClap` token).
- Tie the rating to the most recent clap via `clapId`. The engine already has a `thunderGen` counter that increments on every clap — reuse it (or a monotonic `clapId`) so a rating can't be attached to a stale/clipped clap.

### Decisions
- **When to prompt:** on clap end, show `StarRating` as an inline panel (not a full modal) under the trigger. Keep the big tap targets the PRD requires.
- **Optional:** Skip is already in the component; a skip should NOT save a rating (only real 1–5 submissions go to `saveRating`).
- **Persist immediately** on tap so a lost reload doesn't drop the rating.

## Part B — View ratings

Ratings are currently saved but never shown (the PRD's own open question).

- New screen/component: recent ratings list — each row shows timestamp, reaction (star + label), and which clap sound fired (`activeThunderFile`, i.e. thunder-N).
- Aggregate views that are actually useful for training:
  - Average reaction over time (is the dog getting calmer?).
  - Reaction vs. thunder volume / vs. which clap sound (does sound #4 scare more?).
- Keep it mobile-first, read-only, no login.

## Part C — Export

Data lives only in `localStorage` today — clearing browser data loses all training history, with no backup.

- "Export" button → download `dt_thunderRatings` as JSON and/or CSV (`Blob` + `<a download>`).
- Later: import to restore / move between devices.

## Code that changes
- `src/App.tsx` — render `StarRating`, react to clap-end event.
- `src/hooks/useAudioEngine.ts` — expose clap-end + the clap it belongs to.
- `src/utils/storage.ts` — maybe add `loadRatings(limit)` / `clearRatings()`; consider capping stored history.
- New component(s) for the history view + export.

## Dependencies / ordering
- Part A depends on nothing.
- Part B (view) depends on A. Part C (export) can ride along with A or B.
- **Session logging** and **Dog profiles** both consume the same rating data — design the storage shape once, consistently.

## Rough effort
- A (capture): small–medium.
- B (view): small–medium.
- C (export): small.

## Open questions
- Should a rating be tied to the *session* (so it rolls into session logging) or stand alone?
- Cap the number of stored ratings, or keep all-time?
- Any need to rate "no reaction / session skipped"?
