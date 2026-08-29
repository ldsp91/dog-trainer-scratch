# Generalize Beyond Thunder

Turn the app from a *thunder* simulator into a general fear/anxiety exposure mixer (thunder, fireworks, traffic, vacuum, etc.).

## Context

The core of the app is a generic audio engine: **one seamless ambient loop + a pool of instant-trigger sounds**, with independent volumes and fade in/out. That pattern isn't specific to thunder — it's the exact structure of sound desensitization for any fear (the brief calls this the "coolest version": multiple exposure categories).

What's currently thunder-specific:
- `src/audio/engine.ts` — `RAIN_BASE = "rain-loop"` (the single ambient loop) and the thunder pool.
- `public/sounds/` — `rain-loop.wav` + `thunder-1..9.mp3`.
- UI labels: "Rain" / "Thunder", `⚡` / `🌧️` icons.

Note: the **dynamic sound-pool discovery** already done (`findMaxThunderIndex` probing `thunder-N`) means adding a new category's sounds is just dropping files in a folder — no code changes to the count.

## Target structure

Generalize to **categories**, each with:
- an ambient loop (e.g. "storm ambience", "city traffic", "indoor"),
- a trigger pool (thunder cracks, firecrackers, gunshots, door booms…),
- independent volumes (persisted per category).

```ts
interface SoundCategory {
  id: string;                 // "thunder", "fireworks", "traffic"
  name: string;
  loopBase: string;           // ambient loop file base, e.g. "storm-loop"
  soundsDir: string;          // folder under public/sounds, e.g. "fireworks"
  triggerPrefix: string;      // files triggerPrefix-1.mp3 .. e.g. "cracker"
}
```

## What changes

1. **Engine generalization** — replace the hard-coded rain + thunder with a category-config-driven loader: for the active category, load its loop + probe its trigger pool (`cracker-N`, `gunshot-N`, …) using the same discovery logic already written for thunder.
2. **Category selector UI** — switch categories at the top; the trigger button / sound grid repurpose to the category's sounds.
3. **Per-category settings** — volumes and selected sound persist per category (currently `AudioSettings` is flat).
4. **Sound folders** — add `public/sounds/{category}/*.mp3` per the existing naming convention; no rebuild of counts needed.

## Design options
- **Static config** (simplest): a `categories` array in code. Ship new sounds by dropping files; ship new categories by editing one file. Good for a solo builder.
- **Manifest-driven** (more work): generate a `sounds-manifest.json` from the folder and let the app read it. More flexible, but adds a build step the current dynamic-probe approach deliberately avoided.

## Dependencies
- Builds on the dynamic-pool discovery already in the engine.
- **Dog profiles** can carry a "primary fear / category" per dog.
- Ratings/session logging can be category-tagged later.

## Rough effort
- Engine generalization: medium.
- Category selector + per-cat settings: small–medium.
- Sound creation: content work, not code.

## Open questions
- Ship categories as code config or a generated manifest?
- One ambient loop per category, or reuse rain for everything at first?
- Should switching categories reset volumes, or keep a global master volume?
