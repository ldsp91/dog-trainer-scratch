interface Props {
  thunderLoaded: number;
  thunderTotal: number;
}

export function LoadingOverlay({ thunderLoaded, thunderTotal }: Props) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Loading sounds…</p>
        {thunderTotal > 0 && (
          <p className="loading-detail">{thunderLoaded}/{thunderTotal} thunder sounds</p>
        )}
      </div>
    </div>
  );
}
