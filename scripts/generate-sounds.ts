/**
 * Generates placeholder sound files for the Thunder Trainer app.
 * Creates realistic-ish WAV files using procedural audio synthesis.
 *
 * Usage: npx tsx scripts/generate-sounds.ts
 *
 * These are placeholders — replace with real recordings for production.
 */

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;
const RAIN_DURATION = 10; // seconds
const THUNDER_DURATION = 5; // seconds
const NUM_THUNDER = 8;
const OUT_DIR = path.resolve('public', 'sounds');

// ---- WAV writer ----

function writeWav(filePath: string, samples: Float32Array, sampleRate: number): void {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const bufferSize = 44 + dataSize;

  const buffer = Buffer.alloc(bufferSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(bufferSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
  }

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ---- Noise generators ----

function whiteNoise(length: number): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) buf[i] = Math.random() * 2 - 1;
  return buf;
}

function brownianNoise(length: number): Float32Array {
  const buf = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + (1 / 5.6) * white) / (1 + 1 / 5.6);
    buf[i] = last * 3.5;
  }
  let max = 0;
  for (let i = 0; i < length; i++) { if (Math.abs(buf[i]) > max) max = Math.abs(buf[i]); }
  if (max > 0) for (let i = 0; i < length; i++) buf[i] /= max;
  return buf;
}

function applyEnvelope(samples: Float32Array, attack: number, release: number, sr: number): Float32Array {
  const atk = Math.floor(attack * sr);
  const rel = Math.floor(release * sr);
  const len = samples.length;
  for (let i = 0; i < len; i++) {
    if (i < atk) samples[i] *= i / atk;
    else if (i > len - rel) samples[i] *= (len - i) / rel;
  }
  return samples;
}

function lowPass(samples: Float32Array, cutoff: number, sr: number): Float32Array {
  const alpha = 1.0 / (2 * Math.PI * cutoff * (1.0 / sr));
  // corrected: alpha = dt / (rc + dt) where rc = 1/(2*pi*fc)
  const rc = 1.0 / (2 * Math.PI * cutoff);
  const dt = 1.0 / sr;
  const a = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + a * (samples[i] - out[i - 1]);
  }
  return out;
}

function mix(a: Float32Array, b: Float32Array, ga = 1, gb = 1): Float32Array {
  const len = Math.max(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (i < a.length ? a[i] * ga : 0) + (i < b.length ? b[i] * gb : 0);
  }
  return out;
}

// ---- Rain: brownian + white noise, band-limited ----

function generateRain(): Float32Array {
  const length = Math.floor(SAMPLE_RATE * RAIN_DURATION);
  const brown = brownianNoise(length);
  const high = whiteNoise(length);
  let audio = mix(brown, high, 0.7, 0.3);
  audio = lowPass(audio, 8000, SAMPLE_RATE);

  // Subtle intensity variation
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const v = 0.85 + 0.15 * Math.sin(t * 0.3) * Math.sin(t * 1.7);
    audio[i] *= v;
  }
  return audio;
}

// ---- Thunder: crack + sustained rumble ----

function generateThunder(seed: number): Float32Array {
  const length = Math.floor(SAMPLE_RATE * THUNDER_DURATION);
  const out = new Float32Array(length);

  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  // --- Crack: sharp initial bang ---
  const crackDur = 0.06 + rand() * 0.12;          // 60-180ms
  const crackStart = rand() * 0.15;                 // starts within first 15%
  const crackLen = Math.floor(crackDur * SAMPLE_RATE);
  const crackIdx = Math.floor(crackStart * SAMPLE_RATE);

  const crack = lowPass(whiteNoise(crackLen), 3000 + rand() * 4000, SAMPLE_RATE);
  applyEnvelope(crack, 0.002, crackDur * 0.5, SAMPLE_RATE);

  // --- Rumble: multiple layers spanning the full duration ---
  const rumbleDur = THUNDER_DURATION - crackStart - crackDur;
  const rumbleLen = Math.floor(rumbleDur * SAMPLE_RATE);

  // Layer 1: deep brown rumble (60-120 Hz)
  const r1 = lowPass(brownianNoise(rumbleLen), 60 + rand() * 60, SAMPLE_RATE);
  // Layer 2: mid rumble (200-400 Hz)
  const r2 = lowPass(brownianNoise(rumbleLen), 200 + rand() * 200, SAMPLE_RATE);
  // Layer 3: texture (600-1200 Hz, quieter)
  const r3 = lowPass(whiteNoise(rumbleLen), 600 + rand() * 600, SAMPLE_RATE);

  // Combine layers
  const rumble = mix(mix(r1, r2, 1.0, 0.5), r3, 1.0, 0.15);

  // Rolling modulation — creates the "booming back and forth" effect
  const modFreq1 = 0.3 + rand() * 0.5;   // slow boom
  const modFreq2 = 1.0 + rand() * 2.0;   // faster ripple
  for (let i = 0; i < rumbleLen; i++) {
    const t = i / SAMPLE_RATE;
    const slow = 0.5 + 0.5 * Math.sin(t * modFreq1 * Math.PI * 2);
    const fast = 0.7 + 0.3 * Math.sin(t * modFreq2 * Math.PI * 2);
    rumble[i] *= slow * fast;
  }

  // Envelope: quick attack, long sustain at ~80%, gentle release at the end
  const attackTime = 0.03;
  const releaseTime = 0.8;
  const attackSamples = Math.floor(attackTime * SAMPLE_RATE);
  const releaseSamples = Math.floor(releaseTime * SAMPLE_RATE);
  for (let i = 0; i < rumbleLen; i++) {
    if (i < attackSamples) {
      rumble[i] *= i / attackSamples;
    } else if (i > rumbleLen - releaseSamples) {
      rumble[i] *= ((rumbleLen - i) / releaseSamples) * 0.8;
    } else {
      rumble[i] *= 0.8; // sustain level
    }
  }

  // Mix crack + rumble into output
  for (let i = 0; i < crackLen && crackIdx + i < length; i++) {
    out[crackIdx + i] = crack[i] * 1.8;
  }
  for (let i = 0; i < rumbleLen && crackIdx + crackLen + i < length; i++) {
    out[crackIdx + crackLen + i] = rumble[i];
  }

  // Normalize
  let mx = 0;
  for (let i = 0; i < length; i++) { if (Math.abs(out[i]) > mx) mx = Math.abs(out[i]); }
  if (mx > 0) for (let i = 0; i < length; i++) out[i] = (out[i] / mx) * 0.9;

  return out;
}

// ---- Main ----

console.log('Generating placeholder sounds...\n');
console.log('Rain:');
writeWav(path.join(OUT_DIR, 'rain-loop.wav'), generateRain(), SAMPLE_RATE);

console.log('\nThunder:');
for (let i = 1; i <= NUM_THUNDER; i++) {
  writeWav(path.join(OUT_DIR, `thunder-${i}.wav`), generateThunder(i * 7919 + 104729), SAMPLE_RATE);
}

console.log(`\n✅ Done! ${NUM_THUNDER + 1} files in public/sounds/`);
