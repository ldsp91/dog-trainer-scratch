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

/** Downsampled peak envelope of a thunder clap: normalized 0..1,
 *  one value per ring position (see SoundVisualizer). */
export interface ThunderEnvelope {
  peaks: Float32Array;
  duration: number;
}
