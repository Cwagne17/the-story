import type { AtlasLayerVisibility } from "./types";

export const ATLAS_BOUNDS: [[number, number], [number, number]] = [[20, 20], [56, 42]];
export const INITIAL_CENTER: [number, number] = [36.5, 32.5];
export const INITIAL_ZOOM = 4.5;
export const DEFAULT_LAYER_VISIBILITY: AtlasLayerVisibility = { minor: true, important: true, major: true, labels: true };
