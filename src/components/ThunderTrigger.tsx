import { useState, useCallback } from 'react';

interface Props {
  onTrigger: () => void;
  disabled: boolean;
  isPlaying: boolean;
}

export function ThunderTrigger({ onTrigger, disabled, isPlaying }: Props) {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    setPressed(true);
    onTrigger();
    setTimeout(() => setPressed(false), 200);
  }, [disabled, onTrigger]);

  return (
    <button
      className={`thunder-btn ${isPlaying ? 'playing' : ''} ${pressed ? 'pressed' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isPlaying ? "Stop thunder clap" : "Play thunder clap"}
    >
      <span className="thunder-icon" aria-hidden="true">⚡</span>
    </button>
  );
}
