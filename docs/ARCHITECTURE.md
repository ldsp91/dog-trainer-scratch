# Architecture Document

## Overview

A simple web app that gives dog owners with thunder-phobic dogs predictable, controllable thunder exposure — solving the frustration of unpredictable YouTube thunder videos by providing a one-tap trigger with consistent volume and seamless rain ambience.

This is a **static single-page application** with no backend, no user accounts, and no database. The entire app is a browser-based audio player built with React, using the Web Audio API for precise audio control.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Tech Stack](#tech-stack)
3. [Data Architecture](#data-architecture)
4. [API Architecture](#api-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Security Architecture](#security-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [Performance Architecture](#performance-architecture)
10. [Testing Architecture](#testing-architecture)
11. [Local Development Experience](#local-development-experience)
12. [Third-Party Integrations](#third-party-integrations)
13. [Observability Architecture](#observability-architecture)
14. [Architecture Decision Records](#architecture-decision-records)
15. [Open Questions](#open-questions)

---

## System Architecture

### Architecture Style

**Static Site / Client-Side Application.** The entire application runs in the browser. The "server" is simply a static file server that serves HTML, JavaScript, CSS, and audio files. There is no server-side logic, no API layer, no database, and no user authentication.

**Why this choice:** This is a single-user, single-device side project with no dynamic content, no user accounts, no real-time features, and no scalability concerns. A static site is the simplest possible architecture that meets all requirements. Every additional layer (backend, database, auth) would add operational complexity with zero benefit.

### System Diagram

```
┌─────────────────────────────────────┐
│          Browser (User)             │
│                                     │
│  ┌───────────┐  ┌───────────────┐  │
│  │  React    │  │  Web Audio    │  │
│  │  UI       │◄─►│  API          │  │
│  │  (Vite)   │  │  (AudioBuffer)│  │
│  └───────────┘  └───────┬───────┘  │
│                         │           │
│                  ┌──────▼───────┐   │
│                  │  localStorage│   │
│                  │  (settings)  │   │
│                  └──────────────┘   │
└─────────────────────────────────────┘
           ▲
           │ HTTP GET (static files)
           │
┌──────────▼──────────────┐
│    Static File Server   │
│    (Vite dev / hosting) │
│                         │
│  index.html             │
│  bundle.js              │
│  styles.css             │
│  sounds/                │
│    rain-loop.mp3        │
│    thunder-1.mp3        │
│    thunder-2.mp3        │
│    ...                  │
└─────────────────────────┘
```

### Communication Patterns

- **Browser ↔ Server:** HTTP GET only. The browser fetches static files (HTML, JS, CSS, audio) once at page load. No ongoing communication after that.
- **Internal (React ↔ Web Audio API):** Direct JavaScript calls. React components call Web Audio API methods to play sounds, control volume, and manage fading.
- **No client-server communication** after initial page load. All state management and audio processing happens entirely in the browser.

### Boundary Decisions

- **System boundary:** Everything runs in the user's browser. The "server" is only a file distributor.
- **External dependencies:** Web Audio API (browser-native), localStorage (browser-native), audio files (hosted with the app).
- **No external APIs:** No analytics, no third-party services, no CDN — the app is fully self-contained.

---

## Tech Stack

### Frontend

| Technology       | Choice              | Reasoning                                              |
|------------------|---------------------|-------------------------------------------------------|
| Framework        | React               | Developer comfort, component model, ecosystem          |
| Build Tool       | Vite                | Fast dev server, fast builds, great DX, native ESM     |
| Language         | TypeScript          | Type safety for audio logic and state management       |
| CSS              | CSS Modules or Tailwind | (TBD — depends on preference)                        |
| State Management | React useState/useReducer | Simple state is sufficient; no need for Redux/Zustand |
| Audio Library    | Web Audio API + React wrapper | Precise control over fading, crossfading, latency |
| Testing          | Vitest + React Testing Library | Fast, native to Vite ecosystem              |
| E2E Testing      | Playwright          | Reliable browser automation for critical user flows    |

### Backend

| Technology       | Choice              | Reasoning                                              |
|------------------|---------------------|-------------------------------------------------------|
| Runtime/Framework| None (static files) | No server-side logic needed                            |
| Dev Server       | Vite built-in       | Hot reload, serves all assets, great DX                |

### Database

| Technology       | Choice              | Reasoning                                              |
|------------------|---------------------|-------------------------------------------------------|
| Primary Storage  | localStorage        | Simple key-value storage, no backend needed, persists across page reloads |

### Infrastructure

| Technology       | Choice              | Reasoning                                              |
|------------------|---------------------|-------------------------------------------------------|
| Hosting          | TBD (Vercel/Netlify/GitHub Pages) | Free, zero-config, perfect for static sites |
| CI/CD            | TBD                 | Not a priority for v1                                  |

---

## Data Architecture

### Entity Model

The app has no persistent entities in a database. Data is stored in `localStorage` with the following keys:

| Key                  | Type     | Description                        |
|----------------------|----------|------------------------------------|
| `rainVolume`         | number   | Rain loop volume (0–100)           |
| `thunderVolume`      | number   | Thunder clap volume (0–100)        |
| `thunderRatings`     | string   | JSON array of `{ clapId, rating, timestamp }` |

### Data Flow

```
User interaction (slider tap)
    │
    ▼
React state update (useState/useReducer)
    │
    ▼
Web Audio API (immediate sound playback)
    │
    ▼
localStorage write (async, non-blocking)
```

**Volume settings:** Written to localStorage on every change. Read from localStorage on page load.

**Thunder ratings:** Written to localStorage after each rating is submitted. Read from localStorage on page load to restore history.

### Data Lifecycle

- **Volume settings:** Persist indefinitely. No expiration or cleanup needed.
- **Thunder ratings:** Persist indefinitely. No built-in cleanup — the user can manually clear localStorage if needed.
- **No soft/hard delete:** localStorage is all-or-nothing. If the user clears browser data, all settings and ratings are lost.

### Backup & Recovery

- **No automated backup.** The user's data lives in their browser. If they switch devices or clear browser data, data is lost.
- **No data export.** The ratings are stored as a simple JSON string in localStorage. Export can be added later as a manual feature if there's demand.

---

## API Architecture

There is **no API layer**. The application is a self-contained static site. All functionality is implemented client-side.

### Audio Playback Interface

Audio playback is handled entirely within the browser via the Web Audio API. The public interface is:

```typescript
interface AudioEngine {
  // Start rain loop with fade-in
  startRain(volume: number, fadeDuration: number): void;
  
  // Stop rain loop with fade-out
  stopRain(fadeDuration: number): void;
  
  // Play a thunder clap instantly
  playThunder(volume: number, soundIndex: number): void;
  
  // Update rain volume (while playing)
  setRainVolume(volume: number): void;
  
  // Update thunder volume (affects future claps)
  setThunderVolume(volume: number): void;
  
  // Get current playback state
  getState(): PlaybackState;
}
```

**No versioning needed.** The audio engine is internal to the app.

**No rate limiting.** The anti-spam mechanism is implemented client-side (minimum time between thunder triggers).

---

## Authentication & Authorization

There is **no authentication or authorization**. The app is a single-user tool used locally. No user accounts, no sessions, no API keys.

---

## Security Architecture

### Threat Model

The threat surface is **minimal**:
- No sensitive data is collected or transmitted
- No user accounts or authentication
- No server-side processing
- The app runs entirely client-side

**Primary risks:** None that are material for this use case. The app doesn't handle PII, financial data, or any sensitive information.

### Data Protection

- **No encryption needed.** Data in localStorage is local to the user's device. No data is transmitted over the network.
- **Audio files:** Served over HTTPS (when hosted). MP3 files have no encryption requirements.

### Application Security

- **No injection vectors.** No user input is processed server-side.
- **No CORS concerns.** No cross-origin requests.
- **No file upload.** Users don't upload anything to the app.

### Dependency Security

- **Vite dependency scanning:** Use `npm audit` or a CI check to monitor for known vulnerabilities in dependencies.
- **Keep dependencies minimal.** The app should have very few dependencies (React, Vite, audio library, testing tools).

---

## Frontend Architecture

### Rendering Strategy

**Client-Side Rendering (CSR).** The entire app is rendered in the browser. There is no server-side rendering, no static generation, and no incremental static regeneration.

**Why CSR:** The app is entirely interactive — audio playback, volume controls, ratings. There is no SEO requirement, no need for server-side rendering, and no static pages to pre-render.

### Routing

**Single-page application.** There is only one page (`/`). No routing library needed.

### State Management

**React `useState` / `useReducer`** for local component state.

**Server state vs client state:** There is no server state. All state is client-side:
- **Audio playback state** (playing/stopped, current volume, active sounds)
- **UI state** (ratings modal visibility, loading state)
- **Persistent state** (saved in localStorage)

**No Redux, Zustand, or Jotai needed.** The app's state is simple enough for React's built-in state management.

### Data Fetching Strategy

**Preloading.** Audio files are loaded at page startup using the Web Audio API's `AudioContext.decodeAudioData()`. The first 5 thunder sounds are preloaded immediately, and the rest are loaded lazily in the background (with at least 1 always ready).

**No SWR, React Query, or Apollo needed.** There is no server state to manage.

### Code Splitting

**Route-level and automatic.** Vite handles code splitting. The main bundle contains all UI components. Audio files are loaded on demand (not bundled into the JS bundle — served as separate assets).

### Bundle Size Strategy

- **Tree shaking:** Vite + React + TypeScript naturally supports tree shaking.
- **Audio files not in bundle:** Audio files are served as separate assets, not bundled into the JS bundle. This keeps the JS bundle small.
- **Bundle size budget:** Target < 200KB gzipped for the JS bundle.

### Responsive Design

**Mobile-first.** The app is designed exclusively for mobile phones. Layout uses CSS flexbox/grid with mobile breakpoints. Large touch targets (minimum 48x48px) for the thunder trigger button and controls.

### Accessibility

**WCAG 2.1 AA target.** Key considerations:
- Large, clearly labeled buttons
- Visual feedback on interactions (button press animation, rating stars)
- ARIA labels for audio controls
- Keyboard support (Enter/Space for trigger, arrow keys for sliders)
- Sufficient color contrast for volume sliders and ratings

### Internationalization

**Not needed for v1.** The app is designed for a single user (the developer) and their dog. No i18n required.

### Loading States

**Minimal loading states.** Audio files are preloaded on page load. A simple loading indicator can be shown while the initial audio files are being decoded.

### Error Handling

**Error boundaries** around the main audio player component to catch and display runtime errors.

**Audio error handling:** If an audio file fails to decode or play, show a user-friendly error message and retry option.

---

## Backend Architecture

There is **no backend**. The application is a self-contained static site.

### Dev Server

Vite's built-in development server serves all assets (HTML, JS, CSS, audio files). It provides:
- Hot module replacement (HMR)
- Fast rebuilds
- Development-only features (source maps, dev tools)

### Production Server

A static file server (Vercel, Netlify, GitHub Pages, etc.) serves the built assets. No server-side processing, no environment variables, no configuration.

---

## Performance Architecture

### Performance Targets

- **Tap-to-sound latency:** Under 50ms. The thunder clap must play instantly when the trigger button is tapped.
- **Page load time:** Under 2 seconds on mobile (3G). Achieved by preloading the most critical audio files and lazy-loading the rest.
- **Bundle size:** Under 200KB gzipped for the JS bundle.

### Optimization Strategy

- **Audio preloading:** The Web Audio API's `AudioBuffer` allows sounds to be decoded and ready for instant playback. The first 5 thunder sounds are preloaded on page load.
- **Lazy loading:** Remaining thunder sounds are loaded in the background while the user is using the app. At least 1 thunder sound is always ready to play.
- **Vite optimizations:** Tree shaking, minification, and code splitting are handled automatically by Vite.
- **Asset delivery:** Audio files are served as separate assets, not bundled into the JS bundle. This keeps the JS bundle small and allows the browser to download audio files in parallel.

### Database Performance

**Not applicable.** There is no database. localStorage reads/writes are synchronous and fast for small amounts of data.

### Load Testing

**Not needed for v1.** The app runs entirely in the browser on a single device. There is no server load to test.

---

## Scalability Architecture

Scalability is **not a concern for v1**. The app is designed for a single user on a single device. If the app gains popularity and multiple users need to use it simultaneously, the architecture already supports that — each user's browser is their own instance. No server-side scaling is needed.

---

## Reliability & Availability

### SLA/SLO

**Not applicable.** This is a personal tool used locally. There is no uptime SLA.

### Redundancy

**Not applicable.** The app runs entirely in the browser. If the browser crashes, the user can refresh and continue. Audio files are stored locally (bundled with the app or served from the host).

### Error Handling

- **Error boundaries** catch and display runtime errors in React components.
- **Audio error handling** catches and displays errors when audio files fail to decode or play.
- **Graceful degradation:** If the Web Audio API is not supported (very old browsers), show a message that the app requires a modern browser.

---

## Third-Party Integrations

There are **no third-party integrations** for v1. The app is fully self-contained.

| Service         | Provider    | Purpose | Fallback |
|-----------------|-------------|---------|----------|
| Audio playback  | Web Audio API (browser-native) | Play rain loop and thunder claps | None — requires modern browser |
| Persistence     | localStorage (browser-native) | Store volume settings and ratings | None — data is local only |

---

## Testing Architecture

### Test Pyramid

| Level     | Target | Description                          |
|-----------|--------|--------------------------------------|
| Unit      | 70%    | Audio engine logic, React components |
| Integration | 20%  | Audio playback flows, state management |
| E2E       | 10%    | Critical user flows (play/stop, volume, thunder trigger, rating) |

### Unit Testing

- **Framework:** Vitest (native to Vite ecosystem)
- **What's tested:** Audio engine logic (volume control, fading, preloading), React component rendering, state management
- **Coverage target:** 70%+ for business logic

### Integration Testing

- **Framework:** Vitest + React Testing Library
- **What's tested:** Audio playback flows (start/stop, volume changes), state persistence, thunder trigger with anti-spam

### E2E Testing

- **Framework:** Playwright
- **Critical flows:**
  1. Start rain loop → rain plays
  2. Tap thunder trigger → thunder plays alongside rain
  3. Adjust volume sliders → volumes change
  4. Rate thunder reaction → rating is saved
  5. Stop session → rain fades out, all sounds stop
  6. Restart session → settings are restored

### Security Testing

- **Dependency scanning:** `npm audit` or CI check for known vulnerabilities.
- **No SAST/DAST needed** for v1 (no server-side code, no user input processing).

---

## Observability Architecture

There is **no observability infrastructure** for v1. This is a local, single-user app with no server-side components.

### Logging

- **Development:** Console logging during development.
- **Production:** No logging infrastructure. If errors occur, the user will report them manually.

### Error Tracking

- **Not implemented for v1.** If the app crashes, the user refreshes the page. Error reporting can be added later (e.g., Sentry) if there's demand.

### Dashboards & Alerting

- **Not applicable.** No server, no metrics, no alerting.

---

## Local Development Experience

### Environment Setup

```bash
# Clone the repo
git clone <repo-url>
cd dog-trainer

# Install dependencies
npm install

# Start dev server
npm run dev
```

The Vite dev server runs on `http://localhost:5173` with hot reload enabled.

### Database

**No database.** localStorage is used for persistence. No setup or seeding needed.

### External Service Mocking

**No external services.** The app has no external API dependencies. Audio files are served as static assets from the Vite dev server.

### Onboarding

**Target onboarding time: < 2 minutes.**
1. `npm install` — ~30 seconds
2. `npm run dev` — instant
3. Open browser to `http://localhost:5173` — app is ready

---

## Architecture Decision Records

### ADR-001: Static Site Architecture

**Status:** Accepted

**Context:** The app is a single-user, single-device tool for playing thunder sounds to help dogs overcome thunder phobia. It has no user accounts, no server-side logic, no database, and no real-time features.

**Decision:** Build the app as a static site (React + Vite) with no backend. All audio playback, state management, and persistence happen client-side.

**Consequences:** 
- **Gains:** Minimal complexity, zero operational overhead, fast development, easy deployment, no server costs.
- **Losses:** No multi-device sync, no centralized data, no analytics, no server-side features.
- **Revisitable:** Yes — if the app gains users and needs sync, a backend can be added later.

### ADR-002: Web Audio API for Audio Playback

**Status:** Accepted

**Context:** The app requires instant audio playback on tap (under 50ms latency), smooth fade-in/fade-out, and the ability to play multiple sounds simultaneously (rain loop + thunder clap).

**Decision:** Use the Web Audio API (via a React wrapper) with `AudioBuffer` for preloaded sounds, rather than `<audio>` elements.

**Consequences:**
- **Gains:** Precise control over audio playback (fade, volume, crossfade), zero-latency playback, simultaneous sound mixing.
- **Losses:** Slightly more complex code than `<audio>` elements, requires audio file decoding.
- **Revisitable:** Yes — `<audio>` elements could be used if the Web Audio API proves too complex.

### ADR-003: localStorage for Persistence

**Status:** Accepted

**Context:** The app needs to persist volume settings and thunder ratings across page reloads. There is no backend, no database, and no user accounts.

**Decision:** Use browser localStorage for all persistent data.

**Consequences:**
- **Gains:** Zero setup, zero dependencies, works offline, no server needed.
- **Losses:** Data is device-local only, no sync across devices, no backup, limited storage (5-10MB).
- **Revisitable:** Yes — if multi-device sync is needed, a backend with a database can be added later.

### ADR-004: React + Vite for Frontend

**Status:** Accepted

**Context:** The developer is comfortable with React. The app is a single-page application with no SSR/SSG needs.

**Decision:** Use React with Vite as the build tool.

**Consequences:**
- **Gains:** Developer familiarity, fast dev server, fast builds, great ecosystem, TypeScript support.
- **Losses:** Slightly heavier than vanilla JS for this simple app.
- **Revisitable:** Yes — if the app grows complex, Next.js could be adopted for SSR/SSG.

---

## Open Questions

- **How many thunder sound clips in the initial pool?** The PRD says "number TBD." Suggestion: start with 5–10 clips for variety.
- **What's the ideal anti-spam delay between thunder triggers?** Suggestion: 200–500ms (short enough to feel responsive, long enough to prevent accidental double-taps).
- **What's the ideal fade-in/fade-out duration?** Suggestion: 1–2 seconds for a smooth, natural feel.
- **How should the sound files be organized on disk?** Suggestion: `public/sounds/rain-loop.mp3` and `public/sounds/thunder-{1..N}.mp3`.
- **What format and quality should the audio files be?** Suggestion: MP3 at 192kbps (good balance of quality and file size).
- **How will the user view accumulated ratings?** Not implemented in v1 — the ratings are stored in localStorage but not displayed. This can be added later as a simple list or chart.
- **Hosting platform?** TBD — Vercel, Netlify, or GitHub Pages are all good options for a static site.
