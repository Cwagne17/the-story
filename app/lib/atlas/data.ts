import type { IdentificationDescriptionPart } from "./types";

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
