import { useEffect, useRef, useState } from 'react';
import type { ThunderEnvelope } from '../types';

interface Props {
  /** AnalyserNode from the audio engine, or null until the engine is ready. */
  analyser: AnalyserNode | null;
  /** While true the rAF loop runs; when false a single idle frame is drawn. */
  active: boolean;
  /**
   * Peak envelope of the clap in focus (playing, or explicitly selected),
   * or null (e.g. random mode with nothing playing).
   */
  envelope: ThunderEnvelope | null;
  /** Seconds since the active clap started, or null if none is playing. */
  getElapsed: () => number | null;
}

// The ring is drawn entirely OUTSIDE the thunder button (the canvas is also
// pointer-events: none), so it can never cover or block the button.
const MAP_BARS = 140; // matches the engine's envelope bucket count (1:1)
const SPECTRUM_BARS = 40; // fallback live-spectrum mode
const BINS = SPECTRUM_BARS / 2;
const FIRST_BIN = 2; // skip DC + subsonic bins
const MAP_BAR = 3; // px, shortest map bar (silence)
const IDLE_BAR = 3; // px, idle stubs
const PEAK_T = 0.75; // normalized envelope value that marks a "loud bang"

// Mirror the theme vars: --accent (#38bdf8) → --thunder (#f97316)
const ACCENT = [56, 189, 248];
const THUNDER = [249, 115, 22];

function mixColor(t: number): [number, number, number] {
  return [
    Math.round(ACCENT[0] + (THUNDER[0] - ACCENT[0]) * t),
    Math.round(ACCENT[1] + (THUNDER[1] - ACCENT[1]) * t),
    Math.round(ACCENT[2] + (THUNDER[2] - ACCENT[2]) * t),
  ];
}

/**
 * Time map around the thunder button.
 *
 * Primary mode (envelope present): the ring IS the clap — one ring position
 * per moment of the file, bar length = peak amplitude at that time. Loud
 * peaks are marked orange. Play position is shown via opacity: bars for the
 * part of the clap that has already played are drawn at high opacity, while
 * what has not been played yet stays dim. Before a clap starts (a specific
 * sound selected), the whole map is dim, previewing the shape you'll get.
 *
 * Fallback (no single file in focus, e.g. random): a live frequency spectrum.
 * Decorative only — aria-hidden, pointer-events: none, never gates audio.
 */
export function SoundVisualizer({ analyser, active, envelope, getElapsed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [large, setLarge] = useState(
    () => window.matchMedia('(min-width: 480px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 480px)');
    const onChange = (e: MediaQueryListEvent) => setLarge(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    // Canvas just clears the button's edge: button radius (80/90) × hover
    // scale 1.05, plus a 7px gap.
    const size = large ? 280 : 240;
    const center = size / 2;
    const inner = (large ? 90 : 80) * 1.05 + 7;
    const maxLen = center - inner - 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const angleOf = (progress: number) => progress * Math.PI * 2 - Math.PI / 2;

    const bar = (
      progress: number,
      len: number,
      color: string,
      width: number,
    ) => {
      const a = angleOf(progress);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(center + cos * inner, center + sin * inner);
      ctx.lineTo(center + cos * (inner + len), center + sin * (inner + len));
      ctx.stroke();
    };

    const drawIdle = () => {
      ctx.clearRect(0, 0, size, size);
      const step = (Math.PI * 2 * inner) / SPECTRUM_BARS;
      for (let i = 0; i < SPECTRUM_BARS; i++) {
        bar(i / SPECTRUM_BARS, IDLE_BAR, 'rgba(100, 116, 139, 0.35)', Math.max(3, step * 0.45));
      }
    };

    /** Live spectrum fallback: what's sounding right now (rain floor etc.). */
    const drawSpectrum = () => {
      analyser.getByteFrequencyData(data);
      const values = new Array(SPECTRUM_BARS);
      for (let i = 0; i < SPECTRUM_BARS; i++) {
        const bin = i < BINS ? i : SPECTRUM_BARS - 1 - i;
        values[i] = data[FIRST_BIN + bin] / 255;
      }

      ctx.clearRect(0, 0, size, size);

      const step = (Math.PI * 2 * inner) / SPECTRUM_BARS;
      for (let i = 0; i < SPECTRUM_BARS; i++) {
        const t = Math.pow(values[i], 0.7); // perceptual boost
        const [r, g, b] = mixColor(t);
        bar(i / SPECTRUM_BARS, 6 + t * (maxLen - 6), `rgba(${r}, ${g}, ${b}, ${(0.35 + 0.65 * t).toFixed(3)})`, Math.max(3, step * 0.45));
      }
    };

    /** Time map: the full shape of the clap around the ring. */
    const drawMap = (env: ThunderEnvelope) => {
      const elapsed = getElapsed();
      const p =
        elapsed !== null && env.duration > 0
          ? Math.min(elapsed / env.duration, 1)
          : null;

      ctx.clearRect(0, 0, size, size);

      const { peaks } = env;
      const step = (Math.PI * 2 * inner) / MAP_BARS;
      const width = Math.max(2, step * 0.5);
      for (let i = 0; i < MAP_BARS; i++) {
        const v = peaks[Math.min(i, peaks.length - 1)];
        // Bars at/behind the playhead are "played" (high opacity); bars
        // ahead of it (or the whole ring with no playhead, i.e. preview of
        // a selected, not-yet-played sound) are dim.
        const played = p !== null && i / MAP_BARS - p <= 0.004;
        const color =
          v >= PEAK_T
            ? `rgba(249, 115, 22, ${played ? 0.95 : 0.4})` // loud peak — the "bang" marker
            : `rgba(56, 189, 248, ${played ? 0.85 : 0.3})`;
        bar(
          i / MAP_BARS,
          MAP_BAR + Math.pow(v, 0.55) * (maxLen - MAP_BAR),
          color,
          width,
        );
      }
    };

    const data = new Uint8Array(analyser.frequencyBinCount);

    if (!active) {
      drawIdle();
      return;
    }

    let raf = 0;
    const loop = () => {
      if (envelope) drawMap(envelope);
      else drawSpectrum();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [analyser, active, large, envelope, getElapsed]);

  return (
    <canvas
      ref={canvasRef}
      className="visualizer-canvas"
      aria-hidden="true"
    />
  );
}
