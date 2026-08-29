export interface PlaybackState {
  isPlaying: boolean;
  isThunderPlaying: boolean;
  rainVolume: number;
  thunderVolume: number;
  thunderSoundsLoaded: number;
  totalThunderSounds: number;
  activeThunderFile: string | null;
}

export interface ThunderRating {
  clapId: number;
  rating: number;
  timestamp: number;
}

export interface AudioSettings {
  rainVolume: number;
  thunderVolume: number;
}
