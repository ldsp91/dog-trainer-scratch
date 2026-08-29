import { useCallback, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SessionControl } from './components/SessionControl';
import { SoundSelector } from './components/SoundSelector';
import { SoundVisualizer } from './components/SoundVisualizer';
import { ThunderTrigger } from './components/ThunderTrigger';
import { VolumeSliders } from './components/VolumeSliders';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useAudioSettings } from './hooks/useAudioSettings';

const VIZ_PREF_KEY = 'thunder-trainer:visualizer';

function AppContent() {
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
    [setRainVolume, setEngineRainVolume]
  );

  const handleThunderChange = useCallback(
    (v: number) => {
      setThunderVolume(v);
      setEngineThunderVolume(v);
    },
    [setThunderVolume, setEngineThunderVolume]
  );

  // Visualizer is on by default unless the user disabled it or prefers
  // reduced motion. It's decorative only — toggling never affects audio.
  const [vizEnabled, setVizEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(VIZ_PREF_KEY);
    if (stored !== null) return stored === '1';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const toggleViz = useCallback(() => {
    setVizEnabled((v) => {
      localStorage.setItem(VIZ_PREF_KEY, v ? '0' : '1');
      return !v;
    });
  }, []);

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
        <h2>⚠️ Audio Error</h2>
        <p>{error}</p>
        <p className="error-hint">
          Make sure sound files (.mp3 or .wav) exist in <code>public/sounds/</code>
        </p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const sessionActive = state.isPlaying;

  return (
    <div className="app">
      <header>
        <div className="title-row">
          <h1>⛈️ Thunder Trainer</h1>
          <SessionControl
            isPlaying={sessionActive}
            onPlay={handlePlay}
            onStop={handleStop}
          />
        </div>
        <p className="subtitle">Controlled exposure for thunder-phobic dogs</p>
      </header>

      <main>
        <div className="thunder-zone">
          {vizEnabled && (
            <SoundVisualizer
              analyser={analyser}
              active={sessionActive}
              envelope={envelope}
              getElapsed={getThunderElapsed}
            />
          )}
          <ThunderTrigger
            onTrigger={handleThunder}
            disabled={!sessionActive}
            isPlaying={thunderPlaying}
          />
        </div>

        <div className="status-row">
          <p className={`active-sound ${activeThunderFile ? 'active' : ''}`}>{activeThunderFile ? `🔊 ${activeThunderFile}` : '⏸️ No thunder playing'}</p>
          <button
            type="button"
            className={`icon-toggle ${vizEnabled ? 'on' : ''}`}
            onClick={toggleViz}
            aria-pressed={vizEnabled}
            aria-label={vizEnabled ? 'Hide sound visualizer' : 'Show sound visualizer'}
            title="Sound visualizer"
          >
            <span aria-hidden="true">📊</span>
          </button>
        </div>

        <SoundSelector
          selectedIndex={selectedThunderIndex}
          count={thunderCount}
          onselect={setSelectedThunderIndex}
        />

        <VolumeSliders
          rainVolume={settings.rainVolume}
          thunderVolume={settings.thunderVolume}
          onRainChange={handleRainChange}
          onThunderChange={handleThunderChange}
        />

        {thunderCount === 0 && loaded && (
          <p className="warning">
            ⚠️ No thunder sounds found. Add .mp3 or .wav files to <code>public/sounds/</code>
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
