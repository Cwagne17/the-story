import { AtlasSearch } from "./AtlasSearch";

type AtlasTopBarProps = {
  onReset: () => void;
  searchOpen: boolean;
  layersOpen: boolean;
  onSearchToggle: () => void;
  onLayersToggle: () => void;
};
export function AtlasTopBar({
  onReset,
  searchOpen,
  layersOpen,
  onSearchToggle,
  onLayersToggle,
}: AtlasTopBarProps) {
  return (
    <header className="atlas-topbar">
      <button type="button" className="atlas-wordmark" onClick={onReset}>
        The Story
      </button>
      <AtlasSearch open={searchOpen} onToggle={onSearchToggle} />
      <div className="atlas-topbar__actions">
        <button
          type="button"
          className="atlas-topbar__button"
          onClick={onLayersToggle}
          aria-expanded={layersOpen}
        >
          Layers
        </button>
        <button
          type="button"
          className="atlas-topbar__button atlas-topbar__about"
          aria-label="About The Story"
        >
          ?
        </button>
      </div>
      {layersOpen && (
        <div className="atlas-placeholder-popover" role="status">
          Layer controls are ready for the next atlas chapter.
        </div>
      )}
    </header>
  );
}
