export type ScriptureReference = { osis: string; readable: string };

export type IdentificationDescriptionPart =
  | { kind: "text"; text: string }
  | { kind: "reference"; referenceType: "ancient" | "modern"; id: string; text: string };

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
    description: IdentificationDescriptionPart[] | null;
    identificationCount: number;
    voteAverage: number | null;
    voteCount: number | null;
    coordinateType: string | null;
    geometryId: string | null;
  };
};

export type AtlasLayerVisibility = { minor: boolean; important: boolean; major: boolean; labels: boolean };
