import { useState } from 'react';

interface Props {
  visible: boolean;
  onRate: (rating: number) => void;
  onSkip: () => void;
}

export function StarRating({ visible, onRate, onSkip }: Props) {
  const [hover, setHover] = useState(0);

  if (!visible) return null;

  return (
    <div className="star-rating" role="region" aria-label="Rate your dog's reaction">
      <p className="rating-label">How did your dog react?</p>
      <div className="stars" role="radiogroup" aria-label="Reaction rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star ${star <= hover ? 'active' : ''}`}
            onClick={() => onRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onTouchStart={() => onRate(star)}
            aria-label={`${star}: ${star === 1 ? 'Very calm' : star <= 3 ? 'Okay' : star === 4 ? 'Nervous' : 'Very scared'}`}
            role="radio"
            aria-checked={false}
          >
            ★
          </button>
        ))}
      </div>
      <div className="rating-legend">
        <span>😊 Calm</span>
        <span>😰 Scared</span>
      </div>
      <button className="skip-btn" onClick={onSkip}>Skip</button>
    </div>
  );
}
