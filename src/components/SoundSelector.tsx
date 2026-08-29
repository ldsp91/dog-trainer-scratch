interface Props {
  /** -1 = random, otherwise 0-based index into the thunder sound pool */
  selectedIndex: number;
  /** total number of thunder sounds available */
  count: number;
  onselect: (index: number) => void;
}

export function SoundSelector({ selectedIndex, count, onselect }: Props) {
  if (count === 0) return null;

  return (
    <div className="sound-selector" role="group" aria-label="Select thunder sound">
      <div className="sound-selector-header">
        <span className="sound-selector-label">Sound</span>
      </div>
      <div className="sound-buttons">
        <button
          type="button"
          className={`sound-btn ${selectedIndex === -1 ? 'selected' : ''}`}
          onClick={() => onselect(-1)}
          aria-pressed={selectedIndex === -1}
          aria-label="Random thunder sound"
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
            aria-label={`Thunder sound ${i + 1}`}
          >
            <span aria-hidden="true">⚡</span>
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
