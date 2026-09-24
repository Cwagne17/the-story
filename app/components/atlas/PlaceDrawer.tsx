"use client";

import { useMemo, useState } from "react";
import type { BiblicalPlace, PlaceDetail, ScriptureReference } from "../../lib/atlas/types";

function coordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(3)}° ${value >= 0 ? positive : negative}`;
}

function locationQualification(value: string) {
  return ({ point: "Mapped point", "representative point": "Representative point for this geography", center: "Approximate center", settlement: "Location within this settlement" }[value] ?? value);
}

function bookName(reference: ScriptureReference) {
  return reference.readable.replace(/\s+\d.*$/, "");
}

function ReferenceGroups({ verses }: { verses: ScriptureReference[] }) {
  const [expanded, setExpanded] = useState(false);
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set());
  const groups = useMemo(() => {
    const next = new Map<string, ScriptureReference[]>();
    for (const verse of verses) {
      const book = bookName(verse);
      next.set(book, [...(next.get(book) ?? []), verse]);
    }
    return [...next.entries()];
  }, [verses]);
  const preview = verses.slice(0, 6);
  if (!expanded) return <><div className="reference-list">{preview.map((verse) => <span key={verse.osis}>{verse.readable}</span>)}</div>{verses.length > preview.length && <button type="button" className="place-drawer__action" onClick={() => setExpanded(true)}>View all {verses.length} references</button>}</>;
  return <div className="reference-groups">{groups.map(([book, references]) => {
    const isOpen = openBooks.has(book);
    return <section key={book} className="reference-group"><button type="button" className="reference-group__toggle" aria-expanded={isOpen} onClick={() => setOpenBooks((current) => { const next = new Set(current); if (next.has(book)) next.delete(book); else next.add(book); return next; })}><span>{book}</span><span>{references.length}</span></button>{isOpen && <div className="reference-list">{references.map((verse) => <a key={verse.osis} href={`https://www.openbible.info/labs/cross-references/search?q=${encodeURIComponent(verse.osis)}`} target="_blank" rel="noreferrer">{verse.readable}<span className="sr-only"> (opens OpenBible)</span></a>)}</div>}</section>;
  })}</div>;
}

export function PlaceDrawer({ place, detail, detailStatus, onClose }: { place: BiblicalPlace | null; detail: PlaceDetail | null; detailStatus: "idle" | "loading" | "ready" | "missing" | "error"; onClose: () => void }) {
  if (!place) return null;
  const referenceCount = place.verseCount === 1 ? "1 Scripture reference" : `${place.verseCount} Scripture references`;
  return <aside className="place-drawer" aria-label={`${place.name} details`}>
    <button type="button" className="place-drawer__close" onClick={onClose} aria-label="Close place details">×</button>
    {detail?.identification.image && <figure className="place-drawer__image"><img src={detail.identification.image.url} alt={detail.identification.image.alt} /><figcaption>{detail.identification.image.creditUrl ? <a href={detail.identification.image.creditUrl} target="_blank" rel="noreferrer">{detail.identification.image.credit}</a> : detail.identification.image.credit} · {detail.identification.image.license}</figcaption></figure>}
    <div className="eyebrow">{place.primaryType ?? "Biblical place"}</div>
    <h2>{place.name}</h2>
    <p className="place-drawer__summary">{referenceCount}</p>
    {detailStatus === "loading" && <p className="place-drawer__loading">Loading place details…</p>}
    {detailStatus === "error" && <p className="place-drawer__loading">Place details could not load.</p>}
    {detailStatus === "missing" && <p className="place-drawer__loading">No additional place details are available.</p>}
    {detail && <>
      <section className="place-drawer__section"><h3>In Scripture</h3>{detail.verses.length ? <ReferenceGroups verses={detail.verses} /> : <p>No Scripture references are listed for this location.</p>}</section>
      {detail.identification.description && <section className="place-drawer__section"><h3>Identification</h3><p>{detail.identification.description.map((part, index) => part.kind === "reference" ? <em key={`${part.id}-${index}`} title={`${part.referenceType} reference ${part.id}`}>{part.text}</em> : <span key={`${part.text}-${index}`}>{part.text}</span>)}</p>{detail.identification.hasMultipleIdentifications && <small>This map shows one proposed identification among multiple source identifications.</small>}</section>}
      {detail.identification.modernLocation && <section className="place-drawer__section"><h3>Present-day location</h3><p>{detail.identification.modernLocation.name}{detail.identification.modernLocation.type ? ` · ${detail.identification.modernLocation.type}` : ""}</p></section>}
    </>}
    <section className="place-drawer__section place-drawer__location"><h3>Location</h3><p>{coordinate(place.latitude, "N", "S")} · {coordinate(place.longitude, "E", "W")}</p>{detail?.identification.locationQualification && <small>{locationQualification(detail.identification.locationQualification)}</small>}</section>
  </aside>;
}
