import { useState, useCallback, useEffect } from 'react';
import { loadSettings, saveSettings } from '../utils/storage';
import type { AudioSettings } from '../types';

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setRainVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, rainVolume: volume }));
  }, []);

  const setThunderVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, thunderVolume: volume }));
  }, []);

  return { settings, setRainVolume, setThunderVolume };
}
