import { useCallback } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SessionControl } from './components/SessionControl';
import { SoundSelector } from './components/SoundSelector';
import { SoundVisualizer } from './components/SoundVisualizer';
import { ThunderTrigger } from './components/ThunderTrigger';
import { VolumeSliders } from './components/VolumeSliders';
import { useI18n } from './i18n';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useAudioSettings } from './hooks/useAudioSettings';

function AppContent() {
  const { t } = useI18n();
  const { settings, setRainVolume, setThunderVolume } = useAudioSettings();
  const {
    analyser,
    envelope,
    getThunderElapsed,
    state,
    loading,
    loaded,
    error,
    thunderPlaying,
    selectedThunderIndex,
    startSession,
    stopSession,
    playThunder,
    stopThunder,
    activeThunderFile,
    setRainVolume: setEngineRainVolume,
    setThunderVolume: setEngineThunderVolume,
    thunderCount,
    setSelectedThunderIndex,
  } = useAudioEngine();

  const handlePlay = useCallback(() => {
    startSession(settings.rainVolume);
  }, [startSession, settings.rainVolume]);

  const handleStop = useCallback(() => {
    stopSession();
  }, [stopSession]);

  const handleThunder = useCallback(() => {
    if (thunderPlaying) {
      stopThunder();
      return;
    }
    playThunder();
  }, [thunderPlaying, playThunder, stopThunder]);

  const handleRainChange = useCallback(
    (v: number) => {
      setRainVolume(v);
      setEngineRainVolume(v);
    },
    [setRainVolume, setEngineRainVolume],
  );

  const handleThunderChange = useCallback(
    (v: number) => {
      setThunderVolume(v);
      setEngineThunderVolume(v);
    },
    [setThunderVolume, setEngineThunderVolume],
  );

  // Loading state
  if (loading) {
    return (
      <LoadingOverlay
        thunderLoaded={state.thunderSoundsLoaded}
        thunderTotal={state.totalThunderSounds}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-screen">
        <h2>{t('errors.audioTitle')}</h2>
        <p>{error}</p>
        <p className="error-hint">
          {t('errors.audioHint')} <code>public/sounds/</code>
        </p>
        <button onClick={() => window.location.reload()}>{t('errors.tryAgain')}</button>
      </div>
    );
  }

  const sessionActive = state.isPlaying;

  return (
    <div className="app">
      <header>
        <div className="title-row">
          <h1>{t('app.title')}</h1>
          <SessionControl
            isPlaying={sessionActive}
            onPlay={handlePlay}
            onStop={handleStop}
          />
          <LanguageSwitcher />
        </div>
        <p className="subtitle">{t('app.subtitle')}</p>
      </header>

      <main>
        <div className="thunder-zone">
          <SoundVisualizer
            analyser={analyser}
            active={sessionActive}
            envelope={envelope}
            getElapsed={getThunderElapsed}
          />
          <ThunderTrigger
            onTrigger={handleThunder}
            disabled={!sessionActive}
            isPlaying={thunderPlaying}
          />
        </div>

        <div className="status-row">
          <p className={`active-sound ${activeThunderFile ? "active" : ""}`}>
            {activeThunderFile
              ? t('status.playing', { file: activeThunderFile })
              : t('status.none')}
          </p>
        </div>

        <SoundSelector
          selectedIndex={selectedThunderIndex}
          count={thunderCount}
          onselect={setSelectedThunderIndex}
          activeFile={activeThunderFile}
        />

        <VolumeSliders
          rainVolume={settings.rainVolume}
          thunderVolume={settings.thunderVolume}
          onRainChange={handleRainChange}
          onThunderChange={handleThunderChange}
        />

        {thunderCount === 0 && loaded && (
          <p className="warning">
            {t('warning.noSounds')} <code>public/sounds/</code>
          </p>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
