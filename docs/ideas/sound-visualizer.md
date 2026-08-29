# Sound Visualizer

A reactive visual (spectrum bars or oscilloscope) that mirrors the audio in real time — the rain shows as a steady noise floor, each thunder clap as a bright flash.

## Context

The app already exposes everything a visualizer needs. `src/audio/engine.ts` builds a Web Audio graph:

```
rainSource ─┐
            ├─ rainGain ─┐
thunderSource─┼─ clapGain ─┼─ masterGain ─► destination (speakers)
            │             │
            └─ …
```

There is no visual layer at all today — the UI is buttons and sliders. A visualizer is pure feedback on top of the existing graph, with nothing to do with training content, ratings, or dog data.

## How it works

Web Audio has an `AnalyserNode` designed exactly for this. It draws almost no CPU and doesn't change the sound — insert it between `masterGain` and the speakers:

```
masterGain ─► analyser ─► destination
```

Then poll it ~30–60×/second with `getByteFrequencyData` (spectrum) or `getByteTimeDomainData` (waveform) and draw the results.

### Code that changes
- **Engine** — create one `AnalyserNode` in `init()`, connect `masterGain → analyser → destination`, expose it: `getAnalyser(): AnalyserNode`. Set `fftSize` (e.g. 128–256) once at init.
- **New component** `<SoundVisualizer/>` — takes the analyser, runs a `requestAnimationFrame` loop while audio is active, reads the frequency array, and renders to a `<canvas>` (smooth, many bars) or a row of DOM divs (simple, fewer bars).
- **App wiring** — pass the analyser in; start the rAF loop on Play / stop it on Stop (`stopAll`) so it doesn't burn battery when idle.
- **Styling** — fits the existing dark theme (`src/index.css` CSS vars); place it above the trigger or as a full-bleed backdrop.

## Design options
- **Spectrum bars vs. oscilloscope:** spectrum (frequency bars) reads thunder as a wide bright flash — great visual punch. Oscilloscope (waveform) shows the pressure wave — more "oscoscope" feel, better for seeing the clap's attack/release.
- **Trigger-reactive flash:** optionally add a full-canvas radial burst on the leading edge of a clap (detect via a short-term energy spike) for extra drama. Optional, keep it toggleable.
- **Idle state:** a flat line or very subtle pulse when nothing is playing, so it reads as part of the UI, not a broken screen.

## Considerations
- **Performance:** keep the canvas small and the bar count modest on mobile; one rAF loop is cheap but don't spawn more.
- **Accessibility:** this is motion-by-nature. Add a toggle to disable it and respect `prefers-reduced-motion` for the reactive flash. Screen readers don't need it, but the toggle should be reachable by keyboard.
- **No training impact:** it's feedback only — never gate any audio behavior on it.
- **PWA/offline:** unaffected; everything runs client-side.

## Rough effort
Medium — engine change is small (~10 lines); the component + rAF loop + styling is the bulk.

## Open questions
- Spectrum or waveform (or both with a toggle)?
- Behind-the-controls backdrop or a bounded panel?
- Include the clap flash, or keep it purely reactive?
