# Sound Files

Place your audio files here. The app expects:

- `rain-loop.wav` — Continuous rain ambience (loops seamlessly)
- `thunder-1.wav` through `thunder-10.wav` — Thunder clap sound effects

## Generating placeholder sounds

Run the included script to generate procedural placeholder sounds:

```bash
npm run generate-sounds
```

## Recommended real audio sources

For production quality, replace placeholders with real recordings:

- **Rain:** Free rain recordings from Freesound.org or similar
- **Thunder:** Individual thunder clap recordings, 2-5 seconds each

### Format requirements

- **Format:** WAV (uncompressed PCM) or MP3
- **Sample rate:** 44100 Hz recommended
- **Channels:** Mono is sufficient
- **Rain loop:** 10-30 seconds, should loop seamlessly
- **Thunder:** 1-5 seconds each, varying intensity/pitch for variety
