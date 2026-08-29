import { useCallback, useEffect, useRef } from 'react';

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
    contextSuspended,
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

  // Refs so the visibility handler below always sees the latest values
  // without re-subscribing on every state change.
  const isPlayingRef = useRef(state.isPlaying);
  isPlayingRef.current = state.isPlaying;
  const rainVolumeRef = useRef(settings.rainVolume);
  rainVolumeRef.current = settings.rainVolume;

  // When the app is minimized (Home / Recent-Apps on Android, Home / app
  // switcher on iOS) the page becomes hidden while audio keeps running in
  // the background. Stop the session in that case, and restart it when the
  // user comes back — but only if the session was active when they left.
  useEffect(() => {
    let wasActiveBeforeHidden = false;
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (isPlayingRef.current) {
          wasActiveBeforeHidden = true;
          stopSession();
        }
      } else if (wasActiveBeforeHidden) {
        wasActiveBeforeHidden = false;
        startSession(rainVolumeRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [startSession, stopSession]);

  const handleThunder = useCallback(() => {
    if (thunderPlaying) {
      stopThunder();
      return;
    }
    playThunder();
  }, [thunderPlaying, playThunder, stopThunder]);

  // Selecting a sound auto-plays it (like tapping the thunder button).
  // setSelectedThunderIndex already interrupts any clap that's currently
  // playing, so the new selection always wins — and because the play goes
  // through the normal thunder path, the visualizer and the stop behavior
  // of the thunder button track the newly active clap.
  const handleSelectSound = useCallback(
    (index: number) => {
      setSelectedThunderIndex(index);
      if (state.isPlaying) {
        // Bypass the anti-spam debounce: rapid sound switching is explicit
        // intent and must always take effect.
        playThunder(true);
      }
    },
    [setSelectedThunderIndex, state.isPlaying, playThunder],
  );

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
            // While the browser blocks autoplay the audio is still silent, so
            // the button acts as "start" (the click also unblocks audio).
            isPlaying={sessionActive && !contextSuspended}
            onPlay={handlePlay}
            onStop={handleStop}
          />
          <LanguageSwitcher />
        </div>
        <p className="subtitle">{t('app.subtitle')}</p>
      </header>

      <main>
        {sessionActive && contextSuspended && (
          <p className="autoplay-hint" role="status">
            {t('session.tapToPlay')}
          </p>
        )}
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
          onselect={handleSelectSound}
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
