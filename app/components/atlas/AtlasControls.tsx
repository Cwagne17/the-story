export function AtlasControls({ onReset }: { onReset: () => void }) {
  return (
    <div className="atlas-controls" aria-label="Map controls">
      <button
        type="button"
        className="atlas-control-button"
        onClick={onReset}
        aria-label="Reset map view"
        title="Reset map view"
      >
        ⌂
      </button>
      <div className="atlas-control-divider" />
      <span className="atlas-control-legend">
        <i className="legend-dot legend-dot--major" />
        Major <i className="legend-dot legend-dot--minor" />
        Minor
      </span>
    </div>
  );
}
