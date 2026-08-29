interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function SessionControl({ isPlaying, onPlay, onStop }: Props) {
  return (
    <button
      className={`session-icon-btn ${isPlaying ? 'playing' : 'stopped'}`}
      onClick={isPlaying ? onStop : onPlay}
      aria-label={isPlaying ? 'Stop training session' : 'Start training session'}
    >
      <span className="session-icon-btn-icon" aria-hidden="true">
        {isPlaying ? '■' : '▶'}
      </span>
    </button>
  );
}
