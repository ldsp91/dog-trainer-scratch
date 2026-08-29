import { useI18n } from '../i18n';

interface Props {
  /** -1 = random, otherwise 0-based index into the thunder sound pool */
  selectedIndex: number;
  /** total number of thunder sounds available */
  count: number;
  onselect: (index: number) => void;
  /** name of the file currently playing (e.g. "thunder-3.mp3"), or null */
  activeFile: string | null;
}

export function SoundSelector({ selectedIndex, count, onselect, activeFile }: Props) {
  const { t } = useI18n();

  if (count === 0) return null;

  const activeNumber = activeFile?.match(/^thunder-(\d+)/)?.[1];

  return (
    <div className="sound-selector" role="group" aria-label={t('soundSelector.group')}>
      <div className="sound-selector-header">
        <span className="sound-selector-label">
          {t('soundSelector.label')}
          <span className="sound-active-hint">
            {t('soundSelector.current', { n: activeNumber ?? '-' })}
          </span>
        </span>
      </div>
      <div className="sound-buttons">
        <button
          type="button"
          className={`sound-btn ${selectedIndex === -1 ? 'selected' : ''}`}
          onClick={() => onselect(-1)}
          aria-pressed={selectedIndex === -1}
          aria-label={t('soundSelector.random')}
        >
          <span aria-hidden="true">🎲</span>
        </button>

        {Array.from({ length: count }, (_, i) => (
          <button
            key={i + 1}
            type="button"
            className={`sound-btn ${selectedIndex === i ? 'selected' : ''}`}
            onClick={() => onselect(i)}
            aria-pressed={selectedIndex === i}
            aria-label={t('soundSelector.sound', { n: i + 1 })}
          >
            <span aria-hidden="true">⚡</span>
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
