# Wearables

Use a wearable's physiological signals (heart rate, HRV, activity) as a stress signal to drive the exposure training — e.g. auto-adjust intensity based on the dog's (or owner's) measured stress.

## Context

The brief's roadmap ends at "wearable dog tech integration (heart rate, stress monitoring) — very late stage." It's the most ambitious idea and the one that **bumps against the current architecture**.

Current architecture (from `docs/ARCHITECTURE.md`):
- Static SPA, **no backend, no accounts, no network after load** (ADR-001).
- All state in `localStorage` (ADR-003).
- Audio via Web Audio API.

Wearables pull in two things that conflict with that: **authentication** (to read data from Fitbit/Garmin/Apple) and **sync** (to get it into the app). Both imply a backend — so this idea will eventually require revisiting ADR-001/003, or moving to a native app.

## Where the data comes from

- **Dog wearables** — Fitbit For Dogs, Whistle, Fi, FitBark: heart rate / activity / sleep. Some expose BLE directly (see below), most expose a cloud API.
- **Owner wearables** — Apple Watch, Garmin, Fitbit, Whoop: HR / HRV / activity. Useful as a proxy for the owner's own stress while running a session, or as a stand-in when a dog collar isn't available.
- **Direct BLE** — `WebBluetooth` in the browser can talk to some BLE sensors, but support is browser/OS-limited (best on desktop Chrome / Android).

## Concept

- Read a stress proxy (HR/HRV/activity) over time during a session.
- Feed it to the **adaptive auto-trainer** (from the ratings/auto-trainer idea): if the signal spikes, back off intensity; if calm, hold or nudge up.
- Log the signal alongside sessions for review.

## The architecture problem
- Cloud APIs (Fitbit, Garmin, Apple Health) require OAuth + a server to hold tokens → **not possible in a pure static site today.**
- Direct BLE via `WebBluetooth` avoids the backend but is limited in device/browser support and battery life for continuous reading.

## Realistic paths
1. **Native app wrapper** (see **native-app.md**) + a small backend just for auth/sync. This is the path that makes wearables actually work end-to-end.
2. **Manual import** — export wearable data (CSV) and paste/upload into the app as a lightweight, backend-free stopgap. Low fidelity, but keeps the static architecture.
3. **WebBluetooth live** — prototype with a single supported sensor; accept the compatibility caveats.

## Code that changes
- Depends heavily on path chosen. Native + backend: substantial. Manual import: a CSV parser + a drop zone.
- Reuses the auto-trainer + session logging.

## Dependencies
- **Native app** (for background BLE + a place for the auth backend).
- **Adaptive auto-trainer** (the thing that would consume the signal).
- **Session logging** (to record the signal timeline).

## Rough effort
- Large, and gated by architecture decisions. Prototype (manual import or one BLE sensor): medium. Full cloud integrations: large.

## Open questions
- Whose signal matters most — the dog's or the owner's? (Drives which wearables.)
- Is live adjustment worth the complexity/battery cost vs. just logging for review?
- Privacy/consent: biometric data is sensitive — even if stored locally, how is it handled?
