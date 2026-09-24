"use client";

import { useCallback, useState } from "react";
import { DEFAULT_LAYER_VISIBILITY } from "../lib/atlas/constants";
import type { AtlasLayerVisibility, BiblicalPlace } from "../lib/atlas/types";

export function useAtlasController() {
  const [selectedPlace, setSelectedPlace] = useState<BiblicalPlace | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [layerVisibility, setLayerVisibility] = useState<AtlasLayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const dismissIntro = useCallback(() => setIntroVisible(false), []);
  const selectPlace = useCallback((place: BiblicalPlace) => { setSelectedPlace(place); setIntroVisible(false); setSearchOpen(false); }, []);
  const closePlace = useCallback(() => setSelectedPlace(null), []);
  const reset = useCallback(() => { setSelectedPlace(null); setIntroVisible(true); setSearchOpen(false); setLayersOpen(false); setResetVersion((version) => version + 1); }, []);
  const toggleLayer = useCallback((layer: keyof AtlasLayerVisibility) => setLayerVisibility((current) => ({ ...current, [layer]: !current[layer] })), []);
  return { selectedPlace, introVisible, searchOpen, layersOpen, layerVisibility, resetVersion, dismissIntro, selectPlace, closePlace, setSearchOpen, setLayersOpen, toggleLayer, reset };
}
