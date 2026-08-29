import type { AudioSettings, ThunderRating } from '../types';

const RAIN_KEY = 'dt_rainVolume';
const THUNDER_KEY = 'dt_thunderVolume';
const RATINGS_KEY = 'dt_thunderRatings';

export function loadSettings(): AudioSettings {
  try {
    const rv = parseFloat(localStorage.getItem(RAIN_KEY) ?? '50');
    const tv = parseFloat(localStorage.getItem(THUNDER_KEY) ?? '50');
    return {
      rainVolume: isNaN(rv) ? 50 : clamp(rv, 0, 100),
      thunderVolume: isNaN(tv) ? 50 : clamp(tv, 0, 100),
    };
  } catch {
    return { rainVolume: 50, thunderVolume: 50 };
  }
}

export function saveSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(RAIN_KEY, String(settings.rainVolume));
    localStorage.setItem(THUNDER_KEY, String(settings.thunderVolume));
  } catch { /* quota exceeded — silently ignore */ }
}

export function loadRatings(): ThunderRating[] {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRating(rating: ThunderRating): void {
  try {
    const ratings = loadRatings();
    ratings.push(rating);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch { /* silently ignore */ }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
