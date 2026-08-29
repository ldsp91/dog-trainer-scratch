import { useRef, useCallback, useState, useEffect } from 'react';
import { AudioEngine } from '../audio/engine';
import type { PlaybackState } from '../types';

interface UseAudioEngineReturn {
  state: PlaybackState;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  thunderPlaying: boolean;
  activeThunderFile: string | null;
  selectedThunderIndex: number;
  startSession: (rainVolume: number) => void;
  stopSession: () => void;
  playThunder: () => boolean;
  stopThunder: () => void;
  setSelectedThunderIndex: (index: number) => void;
  setRainVolume: (v: number) => void;
  setThunderVolume: (v: number) => void;
  thunderCount: number;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const engine = useRef<AudioEngine | null>(null);
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isThunderPlaying: false,
    rainVolume: 50,
    thunderVolume: 50,
    thunderSoundsLoaded: 0,
    totalThunderSounds: 0,
    activeThunderFile: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thunderCount, setThunderCount] = useState(0);
  const [thunderPlaying, setThunderPlaying] = useState(false);
  const [activeThunderFile, setActiveThunderFile] = useState<string | null>(null);
  const [selectedThunderIndex, setSelectedThunderIndex] = useState<number>(-1);

  useEffect(() => {
    if (engine.current) return;

    const audio = new AudioEngine();
    engine.current = audio;

    audio.onThunderStateChanged((playing) => {
      setThunderPlaying(playing);
    });

    audio.onActiveThunderFileChanged((file) => {
      setActiveThunderFile(file);
    });

    audio.onSelectedThunderChanged((index) => {
      setSelectedThunderIndex(index);
    });

    audio.init().then(() => {
      const status = audio.loadingStatus;
      setLoading(false);
      if (status.error) {
        setError(status.error);
      }
      setState(audio.getState());
      setThunderCount(audio.getThunderCount());
    }).catch((err) => {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    });
  }, []);

  const refresh = useCallback(() => {
    if (engine.current) {
      setState(engine.current.getState());
      setThunderCount(engine.current.getThunderCount());
    }
  }, []);

  const startSession = useCallback((rainVolume: number) => {
    engine.current?.startRain(rainVolume);
    refresh();
  }, [refresh]);

  const stopSession = useCallback(() => {
    engine.current?.stopAll();
    refresh();
  }, [refresh]);

  const playThunder = useCallback(() => {
    return engine.current?.playThunder() ?? false;
  }, []);

  const stopThunder = useCallback(() => {
    engine.current?.stopThunder();
  }, []);

  const setSelectedThunderIndexInternal = useCallback((index: number) => {
    engine.current?.setSelectedThunderIndex(index);
  }, []);

  const setRainVolume = useCallback((v: number) => {
    engine.current?.setRainVolume(v);
    refresh();
  }, [refresh]);

  const setThunderVolume = useCallback((v: number) => {
    engine.current?.setThunderVolume(v);
  }, []);

  return {
    state,
    thunderPlaying,
    loading,
    loaded: engine.current?.loadingStatus.loaded ?? false,
    error,
    startSession,
    stopSession,
    playThunder,
    stopThunder,
    activeThunderFile,
    selectedThunderIndex,
    setRainVolume,
    setThunderVolume,
    thunderCount,
    setSelectedThunderIndex: setSelectedThunderIndexInternal,
  };
}
