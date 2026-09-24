import type { BiblicalPlace } from "../../lib/atlas/types";

function supportLabel(place: BiblicalPlace) {
  const score = place.identification.voteAverage;
  if (score === null) return "No aggregate support score available";
  if (score >= 500) return "High scholarly support";
  if (score > 0) return "Some scholarly support";
  return "Conflicting scholarly support";
}

function coordinateTypeLabel(value: string) {
  return ({
    point: "Mapped point",
    "representative point": "Representative point",
    center: "Approximate center",
    settlement: "Settlement location",
  }[value] ?? value.replace(/\b\w/g, (character) => character.toUpperCase()));
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(3)}° ${value >= 0 ? positive : negative}`;
}
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
  const referenceCount = place.verseCount === 1 ? "1 Scripture reference" : `${place.verseCount} Scripture references`;
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
      <p className="place-drawer__summary">{referenceCount}</p>
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
        <p>
          {place.identification.description.map((part, index) =>
            part.kind === "reference" ? (
              <em key={`${part.id}-${index}`} title={`${part.referenceType} reference ${part.id}`}>
                {part.text}
              </em>
            ) : (
              <span key={`${part.text}-${index}`}>{part.text}</span>
            ),
          )}
        </p>
        </section>
      )}
      <section className="place-drawer__section">
        <h3>Identification confidence</h3>
        <p>{supportLabel(place)}</p>
        <small>{confidence}</small>
      </section>
      <section className="place-drawer__section place-drawer__location">
        <h3>Location</h3>
        <p>
          {formatCoordinate(place.latitude, "N", "S")} · {formatCoordinate(place.longitude, "E", "W")}
        </p>
        {place.identification.coordinateType && (
          <small>{coordinateTypeLabel(place.identification.coordinateType)}</small>
        )}
      </section>
    </aside>
  );
}
