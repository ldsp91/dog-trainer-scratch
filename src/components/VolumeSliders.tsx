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
  return (
    <div className="volume-sliders">
      <div className="slider-group">
        <label htmlFor="rain-vol">
          <span>🌧️ Rain</span>
          <span className="slider-value">{rainVolume}%</span>
        </label>
        <input
          id="rain-vol"
          type="range"
          min="0"
          max="100"
          step="1"
          value={rainVolume}
          onChange={(e) => onRainChange(Number(e.target.value))}
          aria-label="Rain volume"
        />
      </div>

      <div className="slider-group">
        <label htmlFor="thunder-vol">
          <span>⚡ Thunder</span>
          <span className="slider-value">{thunderVolume}%</span>
        </label>
        <input
          id="thunder-vol"
          type="range"
          min="0"
          max="100"
          step="1"
          value={thunderVolume}
          onChange={(e) => onThunderChange(Number(e.target.value))}
          aria-label="Thunder volume"
        />
      </div>
    </div>
  );
}
