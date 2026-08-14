import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const INPUT = path.join(
    process.cwd(),
    "data",
    "data",
    "ancient.jsonl",
);

const OUTPUT_DIR = path.join(
    process.cwd(),
    "public",
    "data",
);

const OUTPUT = path.join(
    OUTPUT_DIR,
    "biblical-places.geojson",
);

interface Verse {
    osis: string;
    readable: string;
    sort: string;
}

interface Resolution {
    lonlat?: string;
    lonlat_type?: string;
    type?: string;
    land_or_water?: string;
    geometry_id?: string;
    precise_geometry_id?: string;
}

interface Identification {
    id: string;
    description?: string;
    types?: string[];
    resolutions?: Resolution[];

    score?: {
        vote_average?: number;
        vote_count?: number;
        vote_total?: number;
        time_total?: number;
    };
}

interface AncientRecord {
    id: string;
    friendly_id: string;
    url_slug?: string;

    types?: string[];
    verses?: Verse[];

    identifications?: Identification[];

    geojson_file?: string;
    kml_file?: string;

    comment?: string;
}

function parseLonLat(
    lonlat: string | undefined,
): [number, number] | null {
    if (!lonlat) return null;

    const [longitude, latitude] = lonlat
        .split(",")
        .map(Number);

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        return null;
    }

    return [longitude, latitude];
}

function getBestResolution(
    place: AncientRecord,
): {
    identification: Identification;
    resolution: Resolution;
    coordinates: [number, number];
} | null {
    const candidates = [];

    for (const identification of
        place.identifications ?? []) {
        for (const resolution of
            identification.resolutions ?? []) {
            const coordinates = parseLonLat(
                resolution.lonlat,
            );

            if (!coordinates) continue;

            candidates.push({
                identification,
                resolution,
                coordinates,
            });
        }
    }

    if (candidates.length === 0) {
        return null;
    }

    /*
     * For the MVP we're taking the first valid resolution.
     *
     * IMPORTANT:
     * This does NOT mean it is historically certain.
     * We retain identification count and source scoring
     * so we can expose uncertainty later.
     */
    return candidates[0];
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, {
        recursive: true,
    });

    const stream = fs.createReadStream(INPUT);

    const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
    });

    const features = [];

    let totalRecords = 0;
    let mappedRecords = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;

        totalRecords++;

        const place: AncientRecord =
            JSON.parse(line);

        const best = getBestResolution(place);

        if (!best) continue;

        mappedRecords++;

        const {
            identification,
            resolution,
            coordinates,
        } = best;

        features.push({
            type: "Feature",

            id: place.id,

            geometry: {
                type: "Point",
                coordinates,
            },

            properties: {
                id: place.id,

                name: place.friendly_id,

                slug:
                    place.url_slug ??
                    place.friendly_id
                        .toLowerCase()
                        .replaceAll(" ", "-"),

                types: place.types ?? [],

                primaryType:
                    resolution.type ??
                    place.types?.[0] ??
                    null,

                landOrWater:
                    resolution.land_or_water ?? null,

                longitude: coordinates[0],
                latitude: coordinates[1],

                coordinateType:
                    resolution.lonlat_type ?? null,

                ancientGeometryFile:
                    place.geojson_file ?? null,

                geometryId:
                    resolution.geometry_id ??
                    resolution.precise_geometry_id ??
                    null,

                identificationId:
                    identification.id,

                identificationDescription:
                    identification.description ?? null,

                identificationCount:
                    place.identifications?.length ?? 0,

                voteAverage:
                    identification.score
                        ?.vote_average ?? null,

                voteCount:
                    identification.score
                        ?.vote_count ?? null,

                verseCount:
                    place.verses?.length ?? 0,

                verses:
                    (place.verses ?? [])
                        .slice(0, 25)
                        .map((verse) => ({
                            osis: verse.osis,
                            readable: verse.readable,
                        })),

                source: "OpenBible.info",
            },
        });
    }

    const geojson = {
        type: "FeatureCollection",
        features,
    };

    fs.writeFileSync(
        OUTPUT,
        JSON.stringify(geojson, null, 2),
    );

    console.log();
    console.log("OpenBible build complete");
    console.log("------------------------");
    console.log(`Raw records:    ${totalRecords}`);
    console.log(`Mapped records: ${mappedRecords}`);
    console.log(`Output:         ${OUTPUT}`);
    console.log();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});