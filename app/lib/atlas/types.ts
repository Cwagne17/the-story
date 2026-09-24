export type ScriptureReference = { osis: string; readable: string };

export type BiblicalPlace = {
  id: string;
  name: string;
  slug: string;
  types: string[];
  primaryType: string | null;
  longitude: number;
  latitude: number;
  verseCount: number;
  verses: ScriptureReference[];
  identification: {
    id: string | null;
    description: string | null;
    identificationCount: number;
    voteAverage: number | null;
    voteCount: number | null;
    coordinateType: string | null;
    geometryId: string | null;
  };
};

export type AtlasLayerVisibility = { minor: boolean; important: boolean; major: boolean; labels: boolean };
