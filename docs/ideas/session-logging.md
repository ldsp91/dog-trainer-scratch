# Session Logging

Log each training session — when it ran, how long, at what intensity, and how the dog reacted — so progress is visible over time.

## Context

Today there is **no session concept** beyond "rain is playing." The PRD explicitly lists *session history / analytics / progress tracking* as out-of-scope for v1, but the data model to support it already exists:

- `ThunderRating { clapId, rating, timestamp }` — per-clap reactions (see **ratings.md**).
- `AudioSettings { rainVolume, thunderVolume }` — persisted per change.
- `localStorage` — the only store; device-local, no sync.

Session logging is the natural layer on top of ratings: it groups claps + ratings + settings into discrete, reviewable sessions.

## What a session record looks like

```ts
interface Session {
  id: string;                 // uuid or timestamp-based
  startedAt: number;
  endedAt: number;            // => duration = endedAt - startedAt
  mode: "manual" | "routine" | "auto";
  rainVolume: number;
  thunderVolume: number;
  clapCount: number;          // triggered during this session
  ratings: ThunderRating[];   // reactions during this session
  peakThunderVolume?: number; // optional, for intensity tracking
}
```

Capture `startedAt` on Play, `endedAt` on Stop (`stopAll` in the engine / `stopSession` in `App`).

## What to build

1. **Session capture** — wrap the play/stop lifecycle in `App` to open/close a session and stash claps + ratings seen during it. Reuse the clap-end hook from **ratings.md**.
2. **History view** — list of past sessions (date, duration, mode, avg reaction, clap count). Tap to expand details.
3. **Trends** — reaction over time and volume over time. Simple line/bar; this is the "is my dog improving?" view and the whole point of logging.
4. **Export** — sessions (and ratings) as JSON/CSV. Reuse the export path from **ratings.md**.

## Storage considerations
- Start with `localStorage` (key `dt_sessions`) to match the existing architecture — but sessions + ratings grow unbounded. Decide a cap (e.g. keep last N sessions) or migrate to **IndexedDB** if history matters and accumulates.
- Keep one source of truth for ratings so **ratings.md**, this doc, and **dog-profiles.md** all read the same records.

## Code that changes
- `src/App.tsx` — open/close session lifecycle.
- `src/hooks/useAudioEngine.ts` — expose clap events / session-relevant state.
- `src/utils/storage.ts` — session CRUD + history/cap policy.
- New History / Trends component(s).

## Dependencies
- Depends on the rating/clap-end hook from **ratings.md**.
- **Dog profiles** will need to scope sessions per dog.
- The **adaptive auto-trainer** (future) would log its own `mode: "auto"` sessions and adaptation params.

## Rough effort
- Capture: small.
- History view: small–medium.
- Trends + export: medium.

## Open questions
- How far back do sessions need to be retained?
- Do sessions need to survive a localStorage wipe (IndexedDB)?
- Should a "session" also capture rain-only usage (no claps)?
