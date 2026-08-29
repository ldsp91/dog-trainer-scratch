import { useState } from 'react';

import { useI18n } from '../i18n';

interface Props {
  visible: boolean;
  onRate: (rating: number) => void;
  onSkip: () => void;
}

function starLabel(star: number, t: (key: string) => string): string {
  const word =
    star === 1
      ? t('rating.veryCalm')
      : star <= 3
        ? t('rating.okay')
        : star === 4
          ? t('rating.nervous')
          : t('rating.veryScared');
  return `${star}: ${word}`;
}

export function StarRating({ visible, onRate, onSkip }: Props) {
  const { t } = useI18n();
  const [hover, setHover] = useState(0);

  if (!visible) return null;

  return (
    <div className="star-rating" role="region" aria-label={t('rating.region')}>
      <p className="rating-label">{t('rating.question')}</p>
      <div className="stars" role="radiogroup" aria-label={t('rating.group')}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star ${star <= hover ? 'active' : ''}`}
            onClick={() => onRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onTouchStart={() => onRate(star)}
            aria-label={starLabel(star, t)}
            role="radio"
            aria-checked={false}
          >
            ★
          </button>
        ))}
      </div>
      <div className="rating-legend">
        <span>{t('rating.calm')}</span>
        <span>{t('rating.scared')}</span>
      </div>
      <button className="skip-btn" onClick={onSkip}>
        {t('rating.skip')}
      </button>
    </div>
  );
}
