# Ideas

Open-ended idea backlog for Thunder Trainer. Each file is grounded in the current
codebase and cross-references the others, since several ideas build on one another.

| Idea | What it is | Builds on |
| --- | --- | --- |
| [ratings.md](./ratings.md) | Capture, view, and export per-clap reaction ratings | — (highest value, lowest effort) |
| [session-logging.md](./session-logging.md) | Log each session's duration, intensity, and reaction | ratings |
| [generalize-beyond-thunder.md](./generalize-beyond-thunder.md) | Mix other fear sounds (fireworks, traffic, …) | dynamic sound-pool discovery |
| [dog-profiles.md](./dog-profiles.md) | Per-dog settings, ratings, and history | ratings + session logging |
| [wearables.md](./wearables.md) | Drive training from wearable stress signals | adaptive auto-trainer, native app |
| [native-app.md](./native-app.md) | Ship as a mobile app for background audio + BLE | ratings + auto-trainer + wearables |

## Suggested order
1. **ratings** → 2. **session-logging** / **dog-profiles** → 3. **generalize-beyond-thunder** → 4. **native-app** (if background audio matters) → 5. **wearables** (architecture-reachable only after native/backend).

## Architecture note
The app is a static SPA with no backend (see `docs/ARCHITECTURE.md`). Ratings,
session logging, and profiles fit that model. **Wearables** need auth/sync and
therefore a backend — realistically only viable behind the **native-app** wrapper.
