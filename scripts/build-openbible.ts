import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "data");
const GEOMETRY_DIR = path.join(process.cwd(), "data", "geometry");
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");
const DETAILS_DIR = path.join(OUTPUT_DIR, "place-details");

type Verse = { osis: string; readable: string; sort: string };
type Thumbnail = { image_id?: string; credit?: string; credit_url?: string; description?: string };
type GeoRole = { id?: string; description?: string };
type Resolution = { lonlat?: string; lonlat_type?: string; type?: string; land_or_water?: string; geometry_id?: string; precise_geometry_id?: string; modern_basis_id?: string; geojson_roles?: Record<string, GeoRole>; media?: { thumbnail?: Thumbnail } };
type Identification = { id: string; description?: string; media?: { thumbnail?: Thumbnail }; resolutions?: Resolution[] };
type AncientRecord = { id: string; friendly_id: string; url_slug?: string; types?: string[]; verses?: Verse[]; identifications?: Identification[]; geojson_file?: string; media?: { thumbnail?: Thumbnail } };
type ModernRecord = { id: string; friendly_id: string; url_slug?: string; type?: string; media?: { thumbnail?: Thumbnail } };
type ImageRecord = { id: string; license?: string; credit?: string; credit_url?: string; url?: string; file_url?: string; thumbnail_url_pattern?: string };
type Feature = { type: "Feature"; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };

function parseLonLat(lonlat?: string): [number, number] | null {
  if (!lonlat) return null;
  const [longitude, latitude] = lonlat.split(",").map(Number);
  return Number.isFinite(longitude) && Number.isFinite(latitude) ? [longitude, latitude] : null;
}

function readJsonLines<T>(file: string): T[] {
  return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
}

function imageDetail(thumbnails: Array<Thumbnail | undefined>, images: Map<string, ImageRecord>) {
  for (const thumbnail of thumbnails) {
    const image = thumbnail?.image_id ? images.get(thumbnail.image_id) : undefined;
    if (!thumbnail || !image?.thumbnail_url_pattern?.startsWith("https://upload.wikimedia.org/") || !image.license?.startsWith("CC-")) continue;
    return { url: image.thumbnail_url_pattern.replace("####", "640"), alt: cleanText(thumbnail.description ?? "Location image"), credit: thumbnail.credit ?? image.credit ?? "Wikimedia Commons contributor", creditUrl: thumbnail.credit_url ?? image.credit_url ?? image.url ?? null, license: image.license };
  }
  return null;
}

function cleanText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function selectedResolution(place: AncientRecord) {
  for (const identification of place.identifications ?? []) {
    for (const resolution of identification.resolutions ?? []) {
      const coordinates = parseLonLat(resolution.lonlat);
      if (coordinates) return { identification, resolution, coordinates };
    }
  }
  return null;
}

function geometryFeature(place: AncientRecord, resolution: Resolution): Feature | null {
  const roles = resolution.geojson_roles ?? {};
  const role = roles.simplified_geometry ?? roles.simplified_precise ?? roles.geometry ?? roles.precise;
  if (!role?.id || !place.geojson_file?.endsWith(".geojson")) return null;
  const file = path.join(GEOMETRY_DIR, place.geojson_file);
  if (!fs.existsSync(file)) return null;
  const collection = JSON.parse(fs.readFileSync(file, "utf8")) as { features?: Feature[] };
  const feature = collection.features?.find((candidate) => candidate.properties.id === role.id);
  if (!feature || !["LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(feature.geometry.type)) return null;
  return { type: "Feature", geometry: feature.geometry, properties: { placeId: place.id, name: place.friendly_id, type: resolution.type ?? place.types?.[0] ?? "place", landOrWater: resolution.land_or_water ?? "land", proposed: (place.identifications?.length ?? 0) > 1, role: role.id } };
}

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, JSON.stringify(value));
}

async function main() {
  fs.rmSync(DETAILS_DIR, { recursive: true, force: true });
  fs.mkdirSync(DETAILS_DIR, { recursive: true });
  const modernById = new Map(readJsonLines<ModernRecord>(path.join(DATA_DIR, "modern.jsonl")).map((record) => [record.id, record]));
  const imageById = new Map(readJsonLines<ImageRecord>(path.join(DATA_DIR, "image.jsonl")).map((record) => [record.id, record]));
  const places = readJsonLines<AncientRecord>(path.join(DATA_DIR, "ancient.jsonl"));
  const detailChunks: Record<string, Record<string, unknown>> = {};
  const mapFeatures: Feature[] = [];
  const geography: Feature[] = [];
  let mapped = 0;

  for (const place of places) {
    const chosen = selectedResolution(place);
    if (!chosen) continue;
    mapped++;
    const { identification, resolution, coordinates } = chosen;
    const verses = [...(place.verses ?? [])].sort((a, b) => a.sort.localeCompare(b.sort)).map(({ osis, readable, sort }) => ({ osis, readable, sort }));
    const modern = resolution.modern_basis_id ? modernById.get(resolution.modern_basis_id) : undefined;
    const image = imageDetail([place.media?.thumbnail, identification.media?.thumbnail, resolution.media?.thumbnail, modern?.media?.thumbnail], imageById);
    const bucket = place.id.slice(1, 2).toLowerCase();
    detailChunks[bucket] ??= {};
    detailChunks[bucket][place.id] = { id: place.id, verses, identification: { id: identification.id, description: identification.description ?? null, locationQualification: resolution.lonlat_type ?? null, modernLocation: modern ? { id: modern.id, name: modern.friendly_id, type: modern.type ?? null } : null, image, hasMultipleIdentifications: (place.identifications?.length ?? 0) > 1 } };
    mapFeatures.push({ type: "Feature", geometry: { type: "Point", coordinates }, properties: { id: place.id, name: place.friendly_id, slug: place.url_slug ?? place.friendly_id.toLowerCase().replaceAll(" ", "-"), types: place.types ?? [], primaryType: resolution.type ?? place.types?.[0] ?? null, longitude: coordinates[0], latitude: coordinates[1], coordinateType: resolution.lonlat_type ?? null, verseCount: verses.length, identificationId: identification.id, geometryId: resolution.geometry_id ?? resolution.precise_geometry_id ?? null } });
    const feature = geometryFeature(place, resolution);
    if (feature) geography.push(feature);
  }

  writeJson(path.join(OUTPUT_DIR, "biblical-places.geojson"), { type: "FeatureCollection", features: mapFeatures });
  writeJson(path.join(OUTPUT_DIR, "biblical-geography.geojson"), { type: "FeatureCollection", features: geography });
  for (const [bucket, detail] of Object.entries(detailChunks)) writeJson(path.join(DETAILS_DIR, `${bucket}.json`), detail);
  const detailBytes = fs.readdirSync(DETAILS_DIR).filter((file) => file.endsWith(".json")).reduce((total, file) => total + fs.statSync(path.join(DETAILS_DIR, file)).size, 0);
  console.log(`OpenBible build complete: ${mapped} map places, ${geography.length} geography features, ${Object.keys(detailChunks).length} detail chunks (${detailBytes} bytes).`);
}

main().catch((error) => { console.error(error); process.exit(1); });
