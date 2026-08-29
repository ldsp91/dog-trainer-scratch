import { useI18n } from '../i18n';

interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function SessionControl({ isPlaying, onPlay, onStop }: Props) {
  const { t } = useI18n();

  return (
    <button
      className={`session-icon-btn ${isPlaying ? 'playing' : 'stopped'}`}
      onClick={isPlaying ? onStop : onPlay}
      aria-label={isPlaying ? t('session.stop') : t('session.start')}
    >
      <span className="session-icon-btn-icon" aria-hidden="true">
        {isPlaying ? '■' : '▶'}
      </span>
    </button>
  );
}
