import type { PlaybackState, ThunderEnvelope } from "../types";

// Base-aware so audio is served from the deployed subpath (e.g. /dog-trainer-scratch/sounds/),
// not a hardcoded root. import.meta.env.BASE_URL mirrors the `base` in vite.config.ts.
const SOUNDS_DIR = `${import.meta.env.BASE_URL}sounds`;
const AUDIO_EXTENSIONS = [".mp3", ".wav"] as const;

const RAIN_BASE = "rain-loop";
// A static host (GitHub Pages) can't list a directory, so we find the largest
// contiguous thunder-N index with an exponential + binary search (O(log N)
// checks) instead of probing every index. This is the hard upper bound the
// search grows toward before giving up.
const MAX_THUNDER_INDEX = 1_000_000;

/** Fetch all available variants of a sound (tries .mp3, .wav)
 * Filters by content-type to avoid picking up SPA fallback HTML from dev servers. */
async function fetchSoundVariants(
  baseName: string,
): Promise<{ buffer: ArrayBuffer; url: string }[]> {
  const variants: { buffer: ArrayBuffer; url: string }[] = [];
  for (const ext of AUDIO_EXTENSIONS) {
    const url = `${SOUNDS_DIR}/${baseName}${ext}`;
    const resp = await fetch(url);
    if (resp.ok && resp.headers.get("content-type")?.startsWith("audio/")) {
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
  private analyser: AnalyserNode | null = null;

  private rainBuffer: AudioBuffer | null = null;
  private thunderBuffers: { buffer: AudioBuffer; name: string }[] = [];
  private thunderTotalCount = 0; // number of thunder sounds present in public/sounds

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
  private activeThunderIndex: number | null = null; // buffer index of the active clap
  private activeThunderStart = 0; // AudioContext time the active clap started
  private envelopeCache = new Map<number, ThunderEnvelope>();
  private onThunderStateChange: ((playing: boolean) => void) | null = null;
  private onActiveThunderFileChange: ((file: string | null) => void) | null =
    null;
  private onSelectedThunderChange: ((index: number) => void) | null = null;
  private onContextStateChange: (() => void) | null = null;

  onThunderStateChanged(cb: (playing: boolean) => void): void {
    this.onThunderStateChange = cb;
  }

  onActiveThunderFileChanged(cb: (file: string | null) => void): void {
    this.onActiveThunderFileChange = cb;
  }

  onSelectedThunderChanged(cb: (index: number) => void): void {
    this.onSelectedThunderChange = cb;
  }

  /** Notify when the AudioContext state changes (autoplay policy, suspend). */
  onContextStateChanged(cb: () => void): void {
    this.onContextStateChange = cb;
  }

  /** True if the browser's autoplay policy is currently blocking audio. */
  get isSuspended(): boolean {
    return this.ctx !== null && this.ctx.state === "suspended";
  }

  /** Resume the context if blocked by the autoplay policy. Only succeeds
   * inside a user-gesture handler (tap, key press, click). */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        /* still blocked; the next user gesture will retry */
      }
    }
  }

  getSelectedThunderIndex(): number {
    return this._selectedThunderIndex;
  }

  setSelectedThunderIndex(index: number): void {
    if (index === this._selectedThunderIndex) {
      // Re-selecting the already-selected sound is a no-op — don't interrupt
      // a thunder that is currently playing.
      return;
    }
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
    this.ctx.onstatechange = () => this.onContextStateChange?.();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;

    // Passive tap for the SoundVisualizer — masterGain → analyser → speakers.
    // The analyser only observes the signal; it doesn't alter the sound.
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256; // 128 bins, plenty for a 40-bar ring
    this.analyser.smoothingTimeConstant = 0.8;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.masterGain);

    try {
      await this.loadSounds();
      this.loaded = true;
    } catch (err) {
      this.loadError =
        err instanceof Error ? err.message : "Failed to load audio";
    } finally {
      this.loading = false;
    }
  }

  private async loadSounds(): Promise<void> {
    if (!this.ctx) throw new Error("AudioContext not created");

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
          throw new Error(
            `Could not decode ${RAIN_BASE} (tried: ${rainVariants.map((v) => v.url).join(", ")})`,
          );
        }
      }
    }

    // The pool is a contiguous run thunder-1..thunder-N. Find N with an
    // exponential search + binary search (O(log N) existence checks), then
    // decode 1..N in parallel. Best-effort: a load failure never aborts the
    // session — rain still plays.
    const maxIndex = await this.findMaxThunderIndex();

    const loaded = (
      await Promise.allSettled(
        Array.from({ length: maxIndex }, (_, i) => i + 1).map((i) =>
          this.decodeThunder(i),
        ),
      )
    )
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{ buffer: AudioBuffer; name: string }> =>
          r.status === "fulfilled" && r.value !== null,
      )
      .map((r) => r.value!);
    this.thunderBuffers = loaded;
    this.thunderTotalCount = maxIndex;
  }

  /**
   * Find the largest contiguous thunder index (thunder-1..thunder-N) that
   * exists. Double the probe index until one is missing (1, 2, 4, 8, …), then
   * binary-search the gap. O(log N) existence checks.
   */
  private async findMaxThunderIndex(): Promise<number> {
    let bound = 1;
    while (bound < MAX_THUNDER_INDEX && (await this.thunderExists(bound))) {
      bound *= 2;
    }
    // thunderExists(bound) is now false; the answer lies in (bound/2, bound].
    let lo = Math.max(0, Math.floor(bound / 2));
    let hi = bound;
    while (lo < hi - 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (await this.thunderExists(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /** True if thunder-<index>.mp3 or .wav exists and is real audio. */
  private async thunderExists(index: number): Promise<boolean> {
    for (const ext of AUDIO_EXTENSIONS) {
      const url = `${SOUNDS_DIR}/thunder-${index}${ext}`;
      try {
        const resp = await fetch(url);
        if (resp.ok && resp.headers.get("content-type")?.startsWith("audio/")) {
          // Only status + content-type matter — drop the body to free memory.
          await resp.body?.cancel();
          return true;
        }
      } catch {
        // Network hiccup on this extension; try the other one.
      }
    }
    return false;
  }

  /** Fetch and decode a single thunder sound (tries .mp3, then .wav). */
  private async decodeThunder(
    index: number,
  ): Promise<{ buffer: AudioBuffer; name: string } | null> {
    if (!this.ctx) return null;
    for (const ext of AUDIO_EXTENSIONS) {
      const url = `${SOUNDS_DIR}/thunder-${index}${ext}`;
      try {
        const resp = await fetch(url);
        if (
          !resp.ok ||
          !resp.headers.get("content-type")?.startsWith("audio/")
        ) {
          continue;
        }
        const decoded = await this.ctx.decodeAudioData(await resp.arrayBuffer());
        const name = url.replace(SOUNDS_DIR + "/", "");
        console.log(`[audio] loaded thunder: ${name}`);
        return { buffer: decoded, name };
      } catch (e) {
        console.warn(`[audio] failed to decode: ${url}`, e);
      }
    }
    return null;
  }

  // ---- Thunder file info ----

  getActiveThunderFile(): string | null {
    return this._activeThunderFile;
  }

  // ---- Visualizer ----

  /** The tap for spectrum rendering, or null before init(). */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // ---- Rain ----

  startRain(volume: number, fadeDuration = FADE_DURATION): void {
    if (!this.ctx || !this.rainBuffer || !this.rainGain) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

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
    this.rainGain.gain.linearRampToValueAtTime(
      volume / 100,
      now + fadeDuration,
    );

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
      try {
        this.rainSource.stop();
      } catch {
        /* already stopped */
      }
      this.rainSource.disconnect();
      this.rainSource = null;
    }
  }

  // ---- Thunder ----

  playThunder(): boolean {
    if (!this.ctx || this.thunderBuffers.length === 0) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();

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
      try {
        this.activeThunderSource.stop();
      } catch {
        /* */
      }
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
    this.activeThunderIndex = idx;
    this.activeThunderStart = start;
    this.notifyThunderState(true, gen);
    source.onended = () => {
      source.disconnect();
      clapGain.disconnect();
      this.activeThunderSource = null;
      this.activeThunderIndex = null;
      this.activeThunderGain = null;
      this._activeThunderFile = null;
      this.onActiveThunderFileChange?.(null);
      this.notifyThunderState(false, gen);
    };

    return true;
  }

  stopThunder(): void {
    if (this.activeThunderSource) {
      try {
        this.activeThunderSource.stop();
      } catch {
        /* */
      }
      this.activeThunderSource.disconnect();
      this.activeThunderSource = null;
    }
    this.activeThunderIndex = null;
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
      this.rainGain.gain.linearRampToValueAtTime(
        volume / 100,
        now + VOLUME_RAMP,
      );
    }
  }

  setThunderVolume(volume: number): void {
    this._thunderVolume = volume;
    if (this.activeThunderGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeThunderGain.gain.cancelScheduledValues(now);
      this.activeThunderGain.gain.setValueAtTime(
        this.activeThunderGain.gain.value,
        now,
      );
      this.activeThunderGain.gain.linearRampToValueAtTime(
        volume / 100,
        now + VOLUME_RAMP,
      );
    }
  }

  // ---- Stop all ----

  stopAll(): void {
    this.stopRainSource();
    if (this.activeThunderSource) {
      try {
        this.activeThunderSource.stop();
      } catch {
        /* */
      }
      this.activeThunderSource.disconnect();
      this.activeThunderSource = null;
    }
    this.activeThunderIndex = null;
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

  // ---- Thunder shape (envelope) ----

  /**
   * Peak envelope of the clap in focus: the one currently playing, otherwise
   * the explicitly selected one (null for random / none). Lets the UI show the
   * full shape of a clap — including upcoming loud peaks — before they hit.
   */
  getFocusedThunderEnvelope(): ThunderEnvelope | null {
    const idx =
      this.activeThunderIndex ??
      (this._selectedThunderIndex >= 0 ? this._selectedThunderIndex : -1);
    if (idx < 0 || idx >= this.thunderBuffers.length) return null;
    return this.getThunderEnvelope(idx);
  }

  /**
   * Downsampled peak envelope of thunderBuffers[index], normalized so the
   * loudest bucket is 1.0. `buckets` values, one per ring position. Cached
   * per file; spikes are preserved (they are the point).
   */
  getThunderEnvelope(index: number, buckets = 96): ThunderEnvelope | null {
    const entry = this.thunderBuffers[index];
    if (!entry) return null;
    const cached = this.envelopeCache.get(index);
    if (cached) return cached;

    const samples = entry.buffer.getChannelData(0);
    const peaks = new Float32Array(buckets);
    const per = samples.length / buckets;
    for (let b = 0; b < buckets; b++) {
      const start = Math.floor(b * per);
      const end = Math.min(samples.length, Math.floor((b + 1) * per));
      // Stride-scan up to 256 samples per bucket — ~6 ms windows at 44.1 kHz,
      // cheap and enough to catch every real transient without single-sample
      // artifacts.
      const stride = Math.max(1, Math.floor((end - start) / 256));
      let peak = 0;
      for (let i = start; i < end; i += stride) {
        const a = Math.abs(samples[i]);
        if (a > peak) peak = a;
      }
      peaks[b] = peak;
    }

    let max = 0;
    for (let b = 0; b < buckets; b++) if (peaks[b] > max) max = peaks[b];
    if (max > 0) {
      for (let b = 0; b < buckets; b++) peaks[b] /= max;
    }

    const envelope = { peaks, duration: entry.buffer.duration };
    this.envelopeCache.set(index, envelope);
    return envelope;
  }

  /** Seconds since the active clap started (0..duration), or null. */
  getThunderElapsed(): number | null {
    if (!this.activeThunderSource || !this.ctx || this.activeThunderIndex === null) {
      return null;
    }
    const duration = this.thunderBuffers[this.activeThunderIndex]?.buffer.duration ?? 0;
    return Math.min(Math.max(this.ctx.currentTime - this.activeThunderStart, 0), duration);
  }

  // ---- State ----

  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      isThunderPlaying: this._thunderPlaying,
      rainVolume: this._rainVolume,
      thunderVolume: this._thunderVolume,
      thunderSoundsLoaded: this.thunderBuffers.length,
      totalThunderSounds: this.thunderTotalCount,
      activeThunderFile: this._activeThunderFile,
    };
  }

  get loadingStatus() {
    return {
      loading: this.loading,
      loaded: this.loaded,
      error: this.loadError,
    };
  }

  getThunderCount(): number {
    return this.thunderBuffers.length;
  }
}
