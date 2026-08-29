import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SessionControl } from './components/SessionControl';
import { ThunderTrigger } from './components/ThunderTrigger';
import { VolumeSliders } from './components/VolumeSliders';
import { StarRating } from './components/StarRating';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useAudioSettings } from './hooks/useAudioSettings';
import { saveRating } from './utils/storage';

function AppContent() {
  const { settings, setRainVolume, setThunderVolume } = useAudioSettings();
  const {
    state,
    loading,
    loaded,
    error,
    thunderPlaying,
    startSession,
    stopSession,
    playThunder,
    stopThunder,
    activeThunderFile,
    setRainVolume: setEngineRainVolume,
    setThunderVolume: setEngineThunderVolume,
    thunderCount,
  } = useAudioEngine();

  const [showRating, setShowRating] = useState(false);
  const [clapCounter, setClapCounter] = useState(0);
  const ratingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss rating after 8 seconds
  useEffect(() => {
    if (showRating && ratingTimer.current) {
      clearTimeout(ratingTimer.current);
    }
    if (showRating) {
      ratingTimer.current = setTimeout(() => setShowRating(false), 8000);
    }
    return () => {
      if (ratingTimer.current) clearTimeout(ratingTimer.current);
    };
  }, [showRating]);

  const handlePlay = useCallback(() => {
    startSession(settings.rainVolume);
  }, [startSession, settings.rainVolume]);

  const handleStop = useCallback(() => {
    stopSession();
    setShowRating(false);
  }, [stopSession]);

  const handleThunder = useCallback(() => {
    if (thunderPlaying) {
      stopThunder();
      return;
    }
    const played = playThunder();
    if (played === true) {
      setClapCounter((c) => c + 1);
      setShowRating(true);
    }
  }, [thunderPlaying, playThunder, stopThunder]);

  const handleRate = useCallback((rating: number) => {
    saveRating({
      clapId: clapCounter,
      rating,
      timestamp: Date.now(),
    });
    setShowRating(false);
  }, [clapCounter]);

  const handleSkipRating = useCallback(() => {
    setShowRating(false);
  }, []);

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
        <h1>⛈️ Thunder Trainer</h1>
        <p className="subtitle">Controlled exposure for thunder-phobic dogs</p>
      </header>

      <main>
        <SessionControl
          isPlaying={sessionActive}
          onPlay={handlePlay}
          onStop={handleStop}
        />

        <ThunderTrigger
          onTrigger={handleThunder}
          disabled={!sessionActive}
          isPlaying={thunderPlaying}
        />

        <p className={`active-sound ${activeThunderFile ? 'active' : ''}`}>{activeThunderFile ? `🔊 ${activeThunderFile}` : '⏸️ No thunder playing'}</p>

        <VolumeSliders
          rainVolume={settings.rainVolume}
          thunderVolume={settings.thunderVolume}
          onRainChange={handleRainChange}
          onThunderChange={handleThunderChange}
        />

        <StarRating
          visible={showRating}
          onRate={handleRate}
          onSkip={handleSkipRating}
        />

        {thunderCount === 0 && loaded && (
          <p className="warning">
            ⚠️ No thunder sounds found. Add .mp3 or .wav files to <code>public/sounds/</code>
          </p>
        )}

        {thunderCount > 0 && (
          <p className="sound-count">{thunderCount} thunder sound{thunderCount !== 1 ? 's' : ''} loaded</p>
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
