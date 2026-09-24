type AtlasSearchProps = { open: boolean; onToggle: () => void };

export function AtlasSearch({ open, onToggle }: AtlasSearchProps) {
  return (
    <button
      type="button"
      className={`atlas-search ${open ? "is-open" : ""}`}
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className="atlas-search__icon" aria-hidden="true">
        ⌕
      </span>
      <span className="atlas-search__placeholder">
        Search places, Scripture, and journeys…
      </span>
      <kbd>⌘ K</kbd>
    </button>
  );
}
