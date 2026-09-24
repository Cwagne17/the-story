"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRef } from "react";
import { useAtlasMap } from "../../hooks/useAtlasMap";
import type {
  AtlasLayerVisibility,
  BiblicalPlace,
} from "../../lib/atlas/types";
type AtlasMapProps = {
  layerVisibility: AtlasLayerVisibility;
  selectedPlace: BiblicalPlace | null;
  resetVersion: number;
  onMapReady: () => void;
  onBaseStyleError: (message: string) => void;
  onAtlasDataError: (message: string) => void;
  onExplore: () => void;
  onSelectPlace: (place: BiblicalPlace) => void;
};
export function AtlasMap({ ...props }: AtlasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useAtlasMap({ containerRef, ...props });
  return (
    <div
      ref={containerRef}
      className="atlas-map"
      aria-label="Interactive map of the biblical world"
    />
  );
}
