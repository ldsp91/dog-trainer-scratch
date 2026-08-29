# Go Native App

Package the PWA as a mobile app (App Store / Google Play) — mainly to get **background audio** and better hardware access, which the web version can't fully deliver.

## Context

The PRD says v1 is "web only" and "native mobile app" is out of scope, but the brief's roadmap ends here: *"Native mobile app for App Store distribution once solid."* The web app is already complete and installable (PWA), so native is only worth it for capabilities the browser denies.

Why native matters specifically for this app:
- **Background audio** — on iOS, Safari stops Web Audio when the phone is locked or the app is backgrounded (for non-audio app types). An auto-trainer that runs claps over minutes is much less useful if it dies the moment the screen locks. Native (or a PWA with the right audio config) can keep audio playing.
- **Better BLE** — for **wearables**, native has far wider device support than `WebBluetooth`.
- **App Store presence, push notifications** (session reminders), haptics.

## Options (lowest → highest effort)

1. **Capacitor / Cordova (wrap the PWA)** — reuse all existing React code, wrap it, add native plugins (background audio, etc). Lowest effort, fastest path to "an app." Best fit here.
2. **Expo / React Native** — rewrite UI in RN. More work, more to maintain; not justified when the web UI is done.
3. **Native (Swift/Kotlin)** — maximum control, maximum work. Overkill.

**Capacitor is the recommended starting point.**

## What Capacitor buys you (and what it costs)
- **Background audio on iOS** — enable the Audio Background Mode capability + set `AVAudioSession` category (`playback`). This is the main reason to go native for this app.
- **Plugins** — background audio, notifications, and (later) BLE via community plugins.
- **Cost** — a developer account ($99/yr Apple, one-time $25 Google), a build/publish pipeline, and maintaining a native wrapper alongside the web build.

## Effort / tradeoffs
- Reuses ~100% of the web codebase (the React app + engine).
- Adds: native build tooling, store review compliance, periodic native-layer updates.
- Loses nothing web-wise — the PWA stays the source of truth; native is a shell.

## Dependencies
- The app should be **stable first** (the brief's "once solid"). Consider doing it after ratings + auto-trainer are in.
- **Wearables** (if pursued) pushes harder toward native for BLE.
- Background audio is the single biggest driver — if the auto-trainer doesn't need to run with the screen off, staying PWA is simpler.

## Rough effort
- Capacitor wrap + background audio: medium.
- Store publish + ongoing maintenance: ongoing, low-per-release but real.

## Open questions
- Is background audio worth a native build, or is the app only used with the screen on?
- Both stores, or one first (Android is cheaper/faster to ship)?
- Keep the web PWA as the primary target and native as secondary?
