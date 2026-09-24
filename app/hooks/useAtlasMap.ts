"use client";

import { Map, setWorkerUrl, type ErrorEvent, type MapGeoJSONFeature, type MapMouseEvent } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { ATLAS_BOUNDS, INITIAL_CENTER, INITIAL_ZOOM } from "../lib/atlas/constants";
import { PLACE_HIT_LAYER_ID, PLACE_SELECTED_LAYER_ID, PLACE_SOURCE_ID, STORY_MAP_STYLE } from "../lib/atlas/mapStyle";
import type { AtlasLayerVisibility, BiblicalPlace } from "../lib/atlas/types";

setWorkerUrl("/maplibre-gl-worker.mjs");

type PlaceProperties = Record<string, unknown>;
type AtlasGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
};
const stringValue = (properties: PlaceProperties, key: string) => typeof properties[key] === "string" ? properties[key] as string : null;
const numberValue = (properties: PlaceProperties, key: string) => Number.isFinite(Number(properties[key])) ? Number(properties[key]) : null;

function placeFromFeature(feature: MapGeoJSONFeature): BiblicalPlace | null {
  if (feature.geometry.type !== "Point" || !feature.properties) return null;
  const properties = feature.properties as PlaceProperties;
  const id = stringValue(properties, "id") ?? feature.id?.toString();
  if (!id) return null;
  const versesValue = typeof properties.verses === "string" ? parseJsonArray(properties.verses) : properties.verses;
  const verses = Array.isArray(versesValue) ? versesValue.filter((verse): verse is { osis: string; readable: string } => typeof verse === "object" && verse !== null && typeof verse.osis === "string" && typeof verse.readable === "string") : [];
  return {
    id,
    name: stringValue(properties, "name") ?? "Unknown biblical place",
    slug: stringValue(properties, "slug") ?? id,
    types: Array.isArray(properties.types) ? properties.types.filter((type): type is string => typeof type === "string") : parseJsonArray(properties.types).filter((type): type is string => typeof type === "string"),
    primaryType: stringValue(properties, "primaryType"),
    longitude: Number(feature.geometry.coordinates[0]),
    latitude: Number(feature.geometry.coordinates[1]),
    verseCount: numberValue(properties, "verseCount") ?? 0,
    verses,
    identification: {
      id: stringValue(properties, "identificationId"),
      description: stringValue(properties, "identificationDescription"),
      identificationCount: numberValue(properties, "identificationCount") ?? 0,
      voteAverage: numberValue(properties, "voteAverage"),
      voteCount: numberValue(properties, "voteCount"),
      coordinateType: stringValue(properties, "coordinateType"),
      geometryId: stringValue(properties, "geometryId"),
    },
  };
}

type UseAtlasMapOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  layerVisibility: AtlasLayerVisibility;
  onMapReady: () => void;
  onBaseStyleError: (message: string) => void;
  onAtlasDataError: (message: string) => void;
  onExplore: () => void;
  onSelectPlace: (place: BiblicalPlace) => void;
  selectedPlace: BiblicalPlace | null;
  resetVersion: number;
};

export function useAtlasMap({ containerRef, layerVisibility, onMapReady, onBaseStyleError, onAtlasDataError, onExplore, onSelectPlace, selectedPlace, resetVersion }: UseAtlasMapOptions) {
  const mapRef = useRef<Map | null>(null);
  const loggedMapWarningsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new Map({ container: containerRef.current, style: STORY_MAP_STYLE, center: INITIAL_CENTER, zoom: INITIAL_ZOOM, minZoom: 3, maxZoom: 12, maxBounds: ATLAS_BOUNDS, pitch: 0, bearing: 0, attributionControl: {} });
    mapRef.current = map;
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.on("dragstart", onExplore);
    map.on("zoomstart", onExplore);

    const reportMapError = (event: ErrorEvent) => {
      const details = event as ErrorEvent & { sourceId?: string; sourceLayer?: string; layerId?: string; tile?: { tileID?: { canonical?: { z?: number; x?: number; y?: number } } } };
      const rawError = event.error as unknown as { name?: unknown; message?: unknown; stack?: unknown };
      const name = typeof rawError.name === "string" ? rawError.name : "MapLibreError";
      const message = typeof rawError.message === "string" ? rawError.message : "Unknown MapLibre error";
      const stack = typeof rawError.stack === "string" ? rawError.stack : null;
      const sourceId = details.sourceId ?? null;
      const sourceLayer = details.sourceLayer ?? null;
      const layerId = details.layerId ?? null;
      const diagnostic = `${sourceId ?? "unknown-source"}/${sourceLayer ?? "unknown-source-layer"}/${layerId ?? "unknown-layer"}: ${name}: ${message}`;
      if (loggedMapWarningsRef.current.has(diagnostic)) return;
      loggedMapWarningsRef.current.add(diagnostic);
      const tile = details.tile?.tileID?.canonical;
      const tileInfo = tile && [tile.z, tile.x, tile.y].every((value) => typeof value === "number") ? `${tile.z}/${tile.x}/${tile.y}` : null;
      console.warn("MAPLIBRE RESOURCE WARNING", {
        name,
        message,
        stack,
        sourceId,
        sourceLayer,
        layerId,
        tile: tileInfo,
        styleLoaded: map.isStyleLoaded(),
        mapLoaded: map.loaded(),
        configuredSources: Object.keys(map.getStyle().sources ?? {}),
      });

      if (!map.isStyleLoaded() && !sourceId && !sourceLayer && message !== "Unknown MapLibre error") onBaseStyleError(diagnostic);
    };

    map.on("error", reportMapError);
    const logLifecycle = (eventName: string) => {
      if (process.env.NODE_ENV === "development") console.debug(`[atlas] ${eventName}`, { styleLoaded: map.isStyleLoaded(), mapLoaded: map.loaded() });
    };
    map.once("style.load", () => logLifecycle("style.load"));
    map.once("load", () => {
      logLifecycle("load");
      applyStoryBaseColors(map);
      void loadAtlasData()
        .then(() => {
          map.addSource(PLACE_SOURCE_ID, { type: "geojson", data: "/data/biblical-places.geojson" });
          addBiblicalLayers(map, onExplore, onSelectPlace);
          verifyBiblicalLayers(map);
          onMapReady();
        })
        .catch((error: unknown) => onAtlasDataError(error instanceof Error ? error.message : String(error)));
    });
    map.once("idle", () => logLifecycle("idle"));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef, onAtlasDataError, onBaseStyleError, onMapReady, onExplore, onSelectPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    for (const [id, visible] of [["biblical-places", layerVisibility.minor], ["important-biblical-places", layerVisibility.important], ["major-biblical-places", layerVisibility.major], ["major-biblical-labels", layerVisibility.labels]] as [string, boolean][]) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }, [layerVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded() && map.getLayer(PLACE_SELECTED_LAYER_ID)) map.setFilter(PLACE_SELECTED_LAYER_ID, ["==", ["get", "id"], selectedPlace?.id ?? ""]);
  }, [selectedPlace]);

  useEffect(() => {
    if (resetVersion > 0) mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 1000 });
  }, [resetVersion]);

  return { resetView: () => mapRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 1000 }) };
}

async function loadAtlasData(): Promise<AtlasGeoJSON> {
  const response = await fetch("/data/biblical-places.geojson");
  if (!response.ok) throw new Error(`Atlas data request failed with HTTP ${response.status}`);
  const data = await response.json() as unknown;
  if (!isAtlasGeoJSON(data)) throw new Error("Atlas data is not a valid FeatureCollection of point features");
  return data;
}

function isAtlasGeoJSON(value: unknown): value is AtlasGeoJSON {
  if (!value || typeof value !== "object") return false;
  const collection = value as { type?: unknown; features?: unknown };
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features) || collection.features.length === 0) return false;
  return collection.features.every((feature) => {
    if (!feature || typeof feature !== "object") return false;
    const candidate = feature as { type?: unknown; geometry?: { type?: unknown; coordinates?: unknown }; properties?: unknown };
    const coordinates = candidate.geometry?.coordinates;
    const properties = candidate.properties;
    return candidate.type === "Feature" && candidate.geometry?.type === "Point" && Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) && !!properties && typeof properties === "object" && typeof (properties as Record<string, unknown>).name === "string" && Number.isFinite(Number((properties as Record<string, unknown>).verseCount));
  });
}

function parseJsonArray(value: unknown): unknown[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyStoryBaseColors(map: Map) {
  const styleLayerIds = new Set((map.getStyle().layers ?? []).map((layer) => layer.id));
  const setPaintIfPresent = (layerId: string, property: string, value: unknown) => {
    if (styleLayerIds.has(layerId)) map.setPaintProperty(layerId, property as never, value as never);
  };
  setPaintIfPresent("background", "background-color", "#17110c");
  for (const layerId of ["landcover_wood", "landcover_grass", "landcover_ice", "landcover_wetland", "landcover_sand", "landuse_residential"]) {
    setPaintIfPresent(layerId, "fill-color", "#594631");
    setPaintIfPresent(layerId, "fill-opacity", 0.72);
  }
  setPaintIfPresent("water", "fill-color", "#294954");
  for (const layerId of ["waterway_river", "waterway_other"]) {
    setPaintIfPresent(layerId, "line-color", "#3e6570");
    setPaintIfPresent(layerId, "line-opacity", 0.9);
  }
}

function addBiblicalLayers(map: Map, onExplore: () => void, onSelectPlace: (place: BiblicalPlace) => void) {
  map.addLayer({ id: "biblical-places", type: "circle", source: PLACE_SOURCE_ID, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 0, 4, 0.5, 5, 1, 6, 1.8, 8, 3.5, 10, 5], "circle-color": "#c79a50", "circle-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 4, 0, 5, 0.08, 6, 0.2, 8, 0.55, 10, 0.9], "circle-stroke-color": "#ead4a1", "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 3, 0, 6, 0.25, 8, 0.6, 10, 1] } });
  map.addLayer({ id: "important-biblical-places", type: "circle", source: PLACE_SOURCE_ID, filter: [">=", ["to-number", ["get", "verseCount"]], 40], paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.8, 5, 3, 7, 4.5, 9, 6], "circle-color": "#d8ac61", "circle-opacity": 0.9, "circle-stroke-color": "#f6e5ba", "circle-stroke-width": 1 } });
  map.addLayer({ id: "major-biblical-places", type: "circle", source: PLACE_SOURCE_ID, filter: [">=", ["to-number", ["get", "verseCount"]], 120], paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 3.5, 5, 4.5, 7, 6, 9, 8], "circle-color": "#e5c078", "circle-opacity": 1, "circle-stroke-color": "#fff0c8", "circle-stroke-width": 1.5 } });
  map.addLayer({ id: "major-biblical-labels", type: "symbol", source: PLACE_SOURCE_ID, filter: [">=", ["to-number", ["get", "verseCount"]], 120], layout: { "text-field": ["get", "name"], "text-size": ["interpolate", ["linear"], ["zoom"], 3, 10, 6, 12.5, 9, 16], "text-anchor": "top", "text-offset": [0, 1], "text-letter-spacing": 0.06, "text-allow-overlap": false }, paint: { "text-color": "#efe1c3", "text-halo-color": "#17110c", "text-halo-width": 1.5 } });
  map.addLayer({ id: PLACE_SELECTED_LAYER_ID, type: "circle", source: PLACE_SOURCE_ID, filter: ["==", ["get", "id"], ""], paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 9, 6, 13, 10, 19], "circle-color": "#f2d69a", "circle-opacity": 0.2, "circle-stroke-color": "#d8ac61", "circle-stroke-width": 1.5 } });
  map.addLayer({ id: PLACE_HIT_LAYER_ID, type: "circle", source: PLACE_SOURCE_ID, paint: { "circle-radius": 14, "circle-color": "#000000", "circle-opacity": 0 } });
  map.on("click", PLACE_HIT_LAYER_ID, (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    const place = event.features?.[0] ? placeFromFeature(event.features[0]) : null;
    if (!place) return;
    onExplore();
    onSelectPlace(place);
    map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 6.25), duration: 850 });
  });
  map.on("mouseenter", PLACE_HIT_LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", PLACE_HIT_LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
}

function verifyBiblicalLayers(map: Map) {
  const ids = ["biblical-places", "important-biblical-places", "major-biblical-places", "major-biblical-labels", PLACE_HIT_LAYER_ID, PLACE_SELECTED_LAYER_ID];
  const styleLayerIds = (map.getStyle().layers ?? []).map((layer) => layer.id);
  const layerOrder = ids.map((id) => ({ id, exists: Boolean(map.getLayer(id)), index: styleLayerIds.indexOf(id) }));
  const sourceExists = Boolean(map.getSource(PLACE_SOURCE_ID));
  if (process.env.NODE_ENV === "development") console.debug("[atlas] biblical layer verification", { sourceExists, layers: layerOrder, aboveBaseMap: layerOrder.every((layer) => layer.index >= 0 && layer.index >= styleLayerIds.length - ids.length) });
}
