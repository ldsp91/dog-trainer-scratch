import { useI18n } from '../i18n';

interface Props {
  rainVolume: number;
  thunderVolume: number;
  onRainChange: (v: number) => void;
  onThunderChange: (v: number) => void;
}

export function VolumeSliders({
  rainVolume,
  thunderVolume,
  onRainChange,
  onThunderChange,
}: Props) {
  const { t } = useI18n();

  // `onInput` fires continuously while the thumb is dragged, whereas some
  // Android browsers only fire `change` on release. Binding both keeps the
  // percentage label live on Android as well as desktop.
  return (
    <div className="volume-sliders">
      <div className="slider-group">
        <label htmlFor="rain-vol">
          <span>{t('volume.rain')}</span>
          <span className="slider-value">{rainVolume}%</span>
        </label>
        <input
          id="rain-vol"
          type="range"
          min="0"
          max="100"
          step="1"
          defaultValue={rainVolume}
          onChange={(e) => onRainChange(Number(e.currentTarget.value))}
          onInput={(e) => onRainChange(Number(e.currentTarget.value))}
          aria-label={t('volume.rainVolume')}
        />
      </div>

      <div className="slider-group">
        <label htmlFor="thunder-vol">
          <span>{t('volume.thunder')}</span>
          <span className="slider-value">{thunderVolume}%</span>
        </label>
        <input
          id="thunder-vol"
          type="range"
          min="0"
          max="100"
          step="1"
          defaultValue={thunderVolume}
          onChange={(e) => onThunderChange(Number(e.currentTarget.value))}
          onInput={(e) => onThunderChange(Number(e.currentTarget.value))}
          aria-label={t('volume.thunderVolume')}
        />
      </div>
    </div>
  );
}
