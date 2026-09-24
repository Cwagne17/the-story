export type ScriptureReference = { osis: string; readable: string; sort: string };

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
  identification: {
    id: string | null;
    description: IdentificationDescriptionPart[] | null;
    coordinateType: string | null;
    geometryId: string | null;
  };
};

export type PlaceDetail = {
  id: string;
  verses: ScriptureReference[];
  identification: {
    id: string;
    description: IdentificationDescriptionPart[] | null;
    locationQualification: string | null;
    modernLocation: { id: string; name: string; type: string | null } | null;
    image: { url: string; alt: string; credit: string; creditUrl: string | null; license: string } | null;
    hasMultipleIdentifications: boolean;
  };
};

export type AtlasLayerVisibility = { minor: boolean; important: boolean; major: boolean; labels: boolean };
