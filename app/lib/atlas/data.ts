import type { IdentificationDescriptionPart, PlaceDetail, ScriptureReference } from "./types";

const REFERENCE_TAG = /<(ancient|modern)\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi;

export function parseIdentificationDescription(value: string | null): IdentificationDescriptionPart[] | null {
  if (!value) return null;

  const parts: IdentificationDescriptionPart[] = [];
  let cursor = 0;
  for (const match of value.matchAll(REFERENCE_TAG)) {
    const index = match.index ?? 0;
    appendText(parts, value.slice(cursor, index));
    const referenceText = stripMarkup(match[3]);
    if (referenceText) {
      parts.push({ kind: "reference", referenceType: match[1].toLowerCase() as "ancient" | "modern", id: match[2], text: referenceText });
    }
    cursor = index + match[0].length;
  }
  appendText(parts, value.slice(cursor));
  return parts.length > 0 ? parts : null;
}

function appendText(parts: IdentificationDescriptionPart[], value: string) {
  const text = stripMarkup(value);
  if (text) parts.push({ kind: "text", text });
}

function stripMarkup(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

type RawPlaceDetail = Omit<PlaceDetail, "identification"> & {
  identification: Omit<PlaceDetail["identification"], "description"> & { description: string | null };
};

const detailChunkCache = new Map<string, Promise<Record<string, RawPlaceDetail>>>();

export async function loadPlaceDetail(placeId: string): Promise<PlaceDetail | null> {
  const bucket = placeId.slice(1, 2).toLowerCase();
  let chunk = detailChunkCache.get(bucket);
  if (!chunk) {
    chunk = fetch(`/data/place-details/${bucket}.json`)
      .then((response) => response.ok ? response.json() as Promise<Record<string, RawPlaceDetail>> : Promise.reject(new Error(`Place detail request failed with HTTP ${response.status}`)));
    detailChunkCache.set(bucket, chunk);
  }
  let detail: RawPlaceDetail | undefined;
  try {
    detail = (await chunk)[placeId];
  } catch (error) {
    // Do not make a transient static-asset failure permanent for this browser session.
    if (detailChunkCache.get(bucket) === chunk) detailChunkCache.delete(bucket);
    throw error;
  }
  if (!detail) return null;
  return {
    ...detail,
    verses: detail.verses.map((verse): ScriptureReference => ({ ...verse })),
    identification: { ...detail.identification, description: parseIdentificationDescription(detail.identification.description) },
  };
}
