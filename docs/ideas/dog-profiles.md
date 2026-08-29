# Dog Profiles

Support multiple dogs, each with its own threshold, volume preferences, ratings, and session history.

## Context

Right now state is flat and single-dog:
- `AudioSettings { rainVolume, thunderVolume }` — one set of volumes.
- `ThunderRating[]` and (planned) `Session[]` — one shared history.
- `localStorage` keys `dt_*` — no notion of "whose" data this is.

The PRD's target user is "dog owners" (plural, and the trainer may share it with multiple clients). Even for one person with two anxious dogs, per-dog profiles keep volumes and progress from colliding.

## Data model

```ts
interface Dog {
  id: string;
  name: string;
  photoUrl?: string;   // optional
  createdAt: number;
  // optional starting notes
  notes?: string;
}
```

Scope all existing state per dog:
- `dogId` → `AudioSettings`
- `dogId` → `ThunderRating[]`
- `dogId` → `Session[]`

Keep a `currentDogId` so switching dogs is instant without re-picking settings.

## What changes

1. **Profile switcher** — a top control to pick the active dog; add/edit/delete dogs. Deleting a dog is destructive — confirm, and decide whether to export first (see export in **ratings.md**).
2. **Per-dog state isolation** — every storage read/write becomes keyed by `dogId`. Add a thin layer in `storage.ts` (e.g. `settingsFor(dogId)`) so the rest of the app doesn't scatter the keyspace.
3. **Migration** — current flat `dt_*` data needs a one-time migration: create a default dog and adopt existing volumes/ratings into it.
4. **Sharing** (later) — if the trainer shares the app, profiles could be per-browser-instance rather than per-user-account (still no backend).

## Storage considerations
- `localStorage` is fine for a handful of dogs, but the shape grows: one key per dog, or a single `dt_dogs` object keyed by id. Prefer a single object to keep it easy to export/backup.
- No auth/sync — profiles are local to the device/browser, matching ADR-003.

## Code that changes
- `src/types/index.ts` — `Dog`, per-dog state shapes.
- `src/utils/storage.ts` — key namespacing + migration.
- New profile-switcher component.
- `App`/hooks read "current dog's" state.

## Dependencies
- Reuses ratings/session logging from **ratings.md** / **session-logging.md** — scope them by dog.
- **Generalize beyond thunder** categories can be a per-dog preference.

## Rough effort
- Profiles + switcher: medium.
- State keying + migration: medium.

## Open questions
- Per-dog profiles on one device, or per-device (each person's phone = their dogs)?
- Should volumes be shared across dogs or fully isolated?
- Any need to share a dog's profile across devices (→ would force a backend)?
