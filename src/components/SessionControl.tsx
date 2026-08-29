interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function SessionControl({ isPlaying, onPlay, onStop }: Props) {
  return (
    <button
      className={`session-btn ${isPlaying ? 'playing' : 'stopped'}`}
      onClick={isPlaying ? onStop : onPlay}
      aria-label={isPlaying ? 'Stop training session' : 'Start training session'}
    >
      <span className="session-btn-icon" aria-hidden="true">
        {isPlaying ? '■' : '▶'}
      </span>
      <span className="session-btn-text">
        {isPlaying ? 'Stop session' : 'Start session'}
      </span>
    </button>
  );
}
