import type { BiblicalPlace } from "../../lib/atlas/types";
export function PlaceDrawer({
  place,
  onClose,
}: {
  place: BiblicalPlace | null;
  onClose: () => void;
}) {
  if (!place) return null;
  const confidence =
    place.identification.voteCount && place.identification.voteCount > 0
      ? `${place.identification.voteCount} contributing votes`
      : "Source identification retained for review";
  return (
    <aside className="place-drawer" aria-label={`${place.name} details`}>
      <button
        type="button"
        className="place-drawer__close"
        onClick={onClose}
        aria-label="Close place details"
      >
        ×
      </button>
      <div className="eyebrow">{place.primaryType ?? "Biblical place"}</div>
      <h2>{place.name}</h2>
      <p className="place-drawer__summary">
        {place.verseCount} Scripture references
      </p>
      {place.verses.length > 0 && (
        <section className="place-drawer__section">
          <h3>In Scripture</h3>
          <div className="reference-list">
            {place.verses.slice(0, 8).map((verse) => (
              <span key={verse.osis}>{verse.readable}</span>
            ))}
          </div>
        </section>
      )}
      {place.identification.description && (
        <section className="place-drawer__section">
          <h3>Identification</h3>
          <p>{place.identification.description}</p>
        </section>
      )}
      <section className="place-drawer__section">
        <h3>Identification confidence</h3>
        <p>{confidence}</p>
      </section>
      <section className="place-drawer__section place-drawer__location">
        <h3>Location</h3>
        <p>
          {place.latitude.toFixed(3)}° · {place.longitude.toFixed(3)}°
        </p>
        {place.identification.coordinateType && (
          <small>Coordinate type: {place.identification.coordinateType}</small>
        )}
      </section>
    </aside>
  );
}
