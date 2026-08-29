import type { PlaybackState } from '../types';

const SOUNDS_DIR = '/sounds';
const AUDIO_EXTENSIONS = ['.mp3', '.wav'] as const;

const RAIN_BASE = 'rain-loop';
const THUNDER_BASES: string[] = [];
for (let i = 1; i <= 10; i++) {
  THUNDER_BASES.push(`thunder-${i}`);
}

/** Fetch all available variants of a sound (tries .mp3, .wav)
  * Filters by content-type to avoid picking up SPA fallback HTML from dev servers. */
async function fetchSoundVariants(baseName: string): Promise<{ buffer: ArrayBuffer; url: string }[]> {
  const variants: { buffer: ArrayBuffer; url: string }[] = [];
  for (const ext of AUDIO_EXTENSIONS) {
    const url = `${SOUNDS_DIR}/${baseName}${ext}`;
    const resp = await fetch(url);
    if (resp.ok && resp.headers.get('content-type')?.startsWith('audio/')) {
      variants.push({ buffer: await resp.arrayBuffer(), url });
    }
  }
  return variants;
}

const FADE_DURATION = 1.5; // seconds
const ANTI_SPAM_DELAY = 300; // ms
const VOLUME_RAMP = 0.08; // seconds for smooth volume transitions

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private rainBuffer: AudioBuffer | null = null;
  private thunderBuffers: { buffer: AudioBuffer; name: string }[] = [];

  private isPlaying = false;
  private loaded = false;
  private loading = true;
  private loadError: string | null = null;

  private lastThunderTime = 0;
  private activeThunderSource: AudioBufferSourceNode | null = null;
  private activeThunderGain: GainNode | null = null;
  private _thunderPlaying = false;
  private _activeThunderFile: string | null = null;
  private _selectedThunderIndex = -1; // -1 = random; otherwise index into thunderBuffers
  private thunderGen = 0; // increments each new clap; stale callbacks are no-ops
  private onThunderStateChange: ((playing: boolean) => void) | null = null;
  private onActiveThunderFileChange: ((file: string | null) => void) | null = null;
  private onSelectedThunderChange: ((index: number) => void) | null = null;

  onThunderStateChanged(cb: (playing: boolean) => void): void {
    this.onThunderStateChange = cb;
  }

  onActiveThunderFileChanged(cb: (file: string | null) => void): void {
    this.onActiveThunderFileChange = cb;
  }

  onSelectedThunderChanged(cb: (index: number) => void): void {
    this.onSelectedThunderChange = cb;
  }

  getSelectedThunderIndex(): number {
    return this._selectedThunderIndex;
  }

  setSelectedThunderIndex(index: number): void {
    this._selectedThunderIndex = index;
    // Changing the selected sound interrupts any thunder currently playing,
    // so the new selection takes effect instead of letting the old one finish.
    if (this.activeThunderSource) {
      this.stopThunder();
    }
    this.onSelectedThunderChange?.(index);
  }

  private notifyThunderState(playing: boolean, gen: number): void {
    if (gen < this.thunderGen) return; // stale notification from interrupted clap
    this._thunderPlaying = playing;
    this.onThunderStateChange?.(playing);
  }

  private _rainVolume = 50;
  private _thunderVolume = 50;

  // ---- Lifecycle ----

  async init(): Promise<void> {
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.masterGain);

    try {
      await this.loadSounds();
      this.loaded = true;
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : 'Failed to load audio';
    } finally {
      this.loading = false;
    }
  }

  private async loadSounds(): Promise<void> {
    if (!this.ctx) throw new Error('AudioContext not created');

    // Load rain (required) — tries each extension, decodes first that works
    const rainVariants = await fetchSoundVariants(RAIN_BASE);
    if (rainVariants.length === 0) {
      throw new Error(`Could not find ${RAIN_BASE} (.mp3 or .wav)`);
    }
    for (const v of rainVariants) {
      try {
        this.rainBuffer = await this.ctx.decodeAudioData(v.buffer);
        console.log(`[audio] loaded rain: ${v.url}`);
        break;
      } catch (e) {
        console.warn(`[audio] failed to decode rain: ${v.url}`, e);
        if (v === rainVariants[rainVariants.length - 1]) {
          throw new Error(`Could not decode ${RAIN_BASE} (tried: ${rainVariants.map(v => v.url).join(', ')})`);
        }
      }
    }

    // Load thunder sounds in parallel (best-effort)
    const results = await Promise.allSettled(
      THUNDER_BASES.map(async (base) => {
        const variants = await fetchSoundVariants(base);
        for (const v of variants) {
          try {
            const decoded = await this.ctx!.decodeAudioData(v.buffer);
            const name = v.url.replace(SOUNDS_DIR + '/', '');
            console.log(`[audio] loaded thunder: ${name}`);
            return { buffer: decoded, name };
          } catch (e) {
            console.warn(`[audio] failed to decode: ${v.url}`, e);
          }
        }
        return null;
      })
    );

    this.thunderBuffers = results
      .filter((r): r is PromiseFulfilledResult<{ buffer: AudioBuffer; name: string }> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value!);
  }

  // ---- Thunder file info ----

  getActiveThunderFile(): string | null {
    return this._activeThunderFile;
  }

  // ---- Rain ----

  startRain(volume: number, fadeDuration = FADE_DURATION): void {
    if (!this.ctx || !this.rainBuffer || !this.rainGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this._rainVolume = volume;

    // Stop existing rain source if any
    this.stopRainSource();

    const source = this.ctx.createBufferSource();
    source.buffer = this.rainBuffer;
    source.loop = true;
    source.connect(this.rainGain);

    const now = this.ctx.currentTime;
    this.rainGain.gain.cancelScheduledValues(now);
    this.rainGain.gain.setValueAtTime(0, now);
    this.rainGain.gain.linearRampToValueAtTime(volume / 100, now + fadeDuration);

    source.start(now);
    source.onended = () => {
      // If loop broke somehow, restart
      if (this.isPlaying && this.rainSource === source) {
        this.startRain(this._rainVolume, 0);
      }
    };

    this.rainSource = source;
    this.isPlaying = true;
  }

  stopRain(fadeDuration = FADE_DURATION): void {
    if (!this.ctx || !this.rainGain || !this.rainSource) return;

    const now = this.ctx.currentTime;
    this.rainGain.gain.cancelScheduledValues(now);
    this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now);
    this.rainGain.gain.linearRampToValueAtTime(0, now + fadeDuration);

    const source = this.rainSource;
    source.stop(now + fadeDuration + 0.05);
    source.onended = () => {
      source.disconnect();
      if (this.rainSource === source) this.rainSource = null;
    };

    this.isPlaying = false;
  }

  private stopRainSource(): void {
    if (this.rainSource) {
      try { this.rainSource.stop(); } catch { /* already stopped */ }
      this.rainSource.disconnect();
      this.rainSource = null;
    }
  }

  // ---- Thunder ----

  playThunder(): boolean {
    if (!this.ctx || this.thunderBuffers.length === 0) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = Date.now();
    if (now - this.lastThunderTime < ANTI_SPAM_DELAY) return false;
    this.lastThunderTime = now;

    // Pick the thunder sound: explicit selection if set, otherwise random
    let idx = this._selectedThunderIndex;
    if (idx < 0 || idx >= this.thunderBuffers.length) {
      idx = Math.floor(Math.random() * this.thunderBuffers.length);
    }
    const thunderEntry = this.thunderBuffers[idx];
    const buffer = thunderEntry.buffer;
    this._activeThunderFile = thunderEntry.name;
    this.onActiveThunderFileChange?.(thunderEntry.name);

    // Increment generation — invalidates any stale callbacks from the previous clap
    this.thunderGen++;
    const gen = this.thunderGen;

    // Cut any currently playing thunder
    if (this.activeThunderSource) {
      try { this.activeThunderSource.stop(); } catch { /* */ }
      this.activeThunderSource.disconnect();
      this.activeThunderSource = null;
    }
    if (this.activeThunderGain) {
      this.activeThunderGain.disconnect();
      this.activeThunderGain = null;
    }

    // Per-clap gain node — avoids shared-gain race conditions
    const clapGain = this.ctx.createGain();
    clapGain.gain.value = this._thunderVolume / 100;
    clapGain.connect(this.masterGain!);
    this.activeThunderGain = clapGain;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(clapGain);

    const start = this.ctx.currentTime;
    source.start(start);
    source.stop(start + buffer.duration);
    this.activeThunderSource = source;
    this.notifyThunderState(true, gen);
    source.onended = () => {
      source.disconnect();
      clapGain.disconnect();
      this.activeThunderSource = null;
      this.activeThunderGain = null;
      this._activeThunderFile = null;
      this.onActiveThunderFileChange?.(null);
      this.notifyThunderState(false, gen);
    };

    return true;
  }

  stopThunder(): void {
    if (this.activeThunderSource) {
      try { this.activeThunderSource.stop(); } catch { /* */ }
      this.activeThunderSource.disconnect();
      this.activeThunderSource = null;
    }
    if (this.activeThunderGain) {
      this.activeThunderGain.disconnect();
      this.activeThunderGain = null;
    }
    this.thunderGen++;
    this._activeThunderFile = null;
    this.onActiveThunderFileChange?.(null);
    this.notifyThunderState(false, this.thunderGen);
  }

  // ---- Volume ----

  setRainVolume(volume: number): void {
    this._rainVolume = volume;
    if (this.rainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now);
      this.rainGain.gain.linearRampToValueAtTime(volume / 100, now + VOLUME_RAMP);
    }
  }

  setThunderVolume(volume: number): void {
    this._thunderVolume = volume;
    if (this.activeThunderGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeThunderGain.gain.cancelScheduledValues(now);
      this.activeThunderGain.gain.setValueAtTime(this.activeThunderGain.gain.value, now);
      this.activeThunderGain.gain.linearRampToValueAtTime(volume / 100, now + VOLUME_RAMP);
    }
  }

  // ---- Stop all ----

  stopAll(): void {
    this.stopRainSource();
    if (this.activeThunderSource) {
      try { this.activeThunderSource.stop(); } catch { /* */ }
      this.activeThunderSource.disconnect();
      this.activeThunderSource = null;
    }
    if (this.activeThunderGain) {
      this.activeThunderGain.disconnect();
      this.activeThunderGain = null;
    }
    this.thunderGen++;
    this.notifyThunderState(false, this.thunderGen);
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.isPlaying = false;
  }

  // ---- State ----

  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      isThunderPlaying: this._thunderPlaying,
      rainVolume: this._rainVolume,
      thunderVolume: this._thunderVolume,
      thunderSoundsLoaded: this.thunderBuffers.length,
      totalThunderSounds: THUNDER_BASES.length,
      activeThunderFile: this._activeThunderFile,
    };
  }

  get loadingStatus() {
    return { loading: this.loading, loaded: this.loaded, error: this.loadError };
  }

  getThunderCount(): number {
    return this.thunderBuffers.length;
  }
}
