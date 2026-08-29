import { useI18n } from '../i18n';

interface Props {
  thunderLoaded: number;
  thunderTotal: number;
}

export function LoadingOverlay({ thunderLoaded, thunderTotal }: Props) {
  const { t } = useI18n();

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{t('loading.sounds')}</p>
        {thunderTotal > 0 && (
          <p className="loading-detail">
            {t('loading.progress', { loaded: thunderLoaded, total: thunderTotal })}
          </p>
        )}
      </div>
    </div>
  );
}
