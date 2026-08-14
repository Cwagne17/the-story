"use client";

import {
  Map,
  setWorkerUrl,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";

setWorkerUrl("/maplibre-gl-worker.mjs");

type SelectedPlace = {
  id: string;
  name: string;
  primaryType: string | null;
  verseCount: number;
};

type PlaceProperties = {
  id?: string;
  name?: string;
  primaryType?: string | null;
  verseCount?: number | string;
};

const BOUNDS: [[number, number], [number, number]] = [
  [20, 20],
  [56, 42],
];

const INITIAL_CENTER: [number, number] = [36.5, 32.5];
const INITIAL_ZOOM = 4.5;

export default function BiblicalMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const [status, setStatus] = useState("Loading atlas...");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new Map({
      container: containerRef.current,

      style: "https://tiles.openfreemap.org/styles/liberty",

      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,

      minZoom: 3,
      maxZoom: 12,
      maxBounds: BOUNDS,

      pitch: 0,
      bearing: 0,

      attributionControl: {},
    });

    mapRef.current = map;

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    const dismissIntro = () => {
      setIntroVisible(false);
    };

    map.on("dragstart", dismissIntro);
    map.on("zoomstart", dismissIntro);

    map.on("error", (event) => {
      console.error("MAPLIBRE ERROR:", event.error);

      const message =
        event.error instanceof Error
          ? event.error.message
          : String(event.error);

      setStatus(`Map error: ${message}`);
    });

    map.on("load", () => {
      setStatus("Styling ancient world...");

      const layers = map.getStyle().layers ?? [];

      /**
       * Remove modern map clutter.
       */
      for (const layer of layers) {
        const id = layer.id.toLowerCase();

        try {
          if (layer.type === "symbol") {
            map.setLayoutProperty(layer.id, "visibility", "none");

            continue;
          }

          if (
            id.includes("boundary") ||
            id.includes("admin") ||
            id.includes("park") ||
            id.includes("landuse") ||
            id.includes("landcover") ||
            id.includes("protected") ||
            id.includes("reserve") ||
            id.includes("nature") ||
            id.includes("road") ||
            id.includes("highway") ||
            id.includes("street") ||
            id.includes("rail") ||
            id.includes("transport") ||
            id.includes("building") ||
            id.includes("airport") ||
            id.includes("parking") ||
            id.includes("poi")
          ) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        } catch {
          // Ignore incompatible layers.
        }
      }

      /**
       * Recolor physical geography.
       */
      for (const layer of map.getStyle().layers ?? []) {
        const id = layer.id.toLowerCase();

        try {
          if (layer.type === "background") {
            map.setPaintProperty(layer.id, "background-color", "#17110c");
          }

          if (layer.type === "fill" && id.includes("water")) {
            map.setPaintProperty(layer.id, "fill-color", "#294954");

            map.setPaintProperty(layer.id, "fill-opacity", 1);
          }

          if (
            layer.type === "line" &&
            (id.includes("water") || id.includes("river"))
          ) {
            map.setPaintProperty(layer.id, "line-color", "#3e6570");

            map.setPaintProperty(layer.id, "line-opacity", 0.9);
          }

          if (
            layer.type === "fill" &&
            !id.includes("water") &&
            (id.includes("land") || id.includes("earth") || id.includes("sand"))
          ) {
            map.setPaintProperty(layer.id, "fill-color", "#594631");

            map.setPaintProperty(layer.id, "fill-opacity", 0.72);
          }

          if (layer.type === "hillshade") {
            map.setPaintProperty(layer.id, "hillshade-shadow-color", "#100b07");

            map.setPaintProperty(
              layer.id,
              "hillshade-highlight-color",
              "#b59a73",
            );

            map.setPaintProperty(layer.id, "hillshade-accent-color", "#6f573c");

            map.setPaintProperty(layer.id, "hillshade-exaggeration", 0.72);
          }
        } catch {
          // Ignore incompatible paint properties.
        }
      }

      /**
       * OpenBible source.
       */
      map.addSource("biblicalPlaces", {
        type: "geojson",
        data: "/data/biblical-places.geojson",
      });

      /**
       * Minor places.
       */
      map.addLayer({
        id: "biblical-places",
        type: "circle",
        source: "biblicalPlaces",

        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0,
            4,
            0.5,
            5,
            1,
            6,
            1.8,
            8,
            3.5,
            10,
            5,
          ],

          "circle-color": "#c79a50",

          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0,
            4,
            0,
            5,
            0.08,
            6,
            0.2,
            8,
            0.55,
            10,
            0.9,
          ],

          "circle-stroke-color": "#ead4a1",

          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0,
            6,
            0.25,
            8,
            0.6,
            10,
            1,
          ],
        },
      });

      /**
       * Important places.
       */
      map.addLayer({
        id: "important-biblical-places",
        type: "circle",
        source: "biblicalPlaces",

        filter: [">=", ["to-number", ["get", "verseCount"]], 40],

        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            1.8,
            5,
            3,
            7,
            4.5,
            9,
            6,
          ],

          "circle-color": "#d8ac61",
          "circle-opacity": 0.9,
          "circle-stroke-color": "#f6e5ba",
          "circle-stroke-width": 1,
        },
      });

      /**
       * Major places.
       */
      map.addLayer({
        id: "major-biblical-places",
        type: "circle",
        source: "biblicalPlaces",

        filter: [">=", ["to-number", ["get", "verseCount"]], 120],

        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            3.5,
            5,
            4.5,
            7,
            6,
            9,
            8,
          ],

          "circle-color": "#e5c078",
          "circle-opacity": 1,
          "circle-stroke-color": "#fff0c8",
          "circle-stroke-width": 1.5,
        },
      });

      /**
       * Major place labels.
       */
      map.addLayer({
        id: "major-biblical-labels",
        type: "symbol",
        source: "biblicalPlaces",

        filter: [">=", ["to-number", ["get", "verseCount"]], 120],

        layout: {
          "text-field": ["get", "name"],

          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            10,
            6,
            12.5,
            9,
            16,
          ],

          "text-anchor": "top",
          "text-offset": [0, 1],
          "text-letter-spacing": 0.06,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },

        paint: {
          "text-color": "#efe1c3",
          "text-halo-color": "#17110c",
          "text-halo-width": 1.5,
        },
      });

      setStatus("Atlas ready");
    });

    const handlePlaceClick = (
      event: MapMouseEvent & {
        features?: MapGeoJSONFeature[];
      },
    ) => {
      dismissIntro();

      const feature = event.features?.[0];

      if (!feature?.properties) return;

      const properties = feature.properties as PlaceProperties;

      setSelectedPlace({
        id: properties.id ?? feature.id?.toString() ?? "",

        name: properties.name ?? "Unknown biblical place",

        primaryType: properties.primaryType ?? null,

        verseCount: Number(properties.verseCount ?? 0),
      });

      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;

        map.easeTo({
          center: [Number(lng), Number(lat)],

          zoom: Math.max(map.getZoom(), 6.25),

          duration: 850,
        });
      }
    };

    for (const layer of [
      "biblical-places",
      "important-biblical-places",
      "major-biblical-places",
    ]) {
      map.on("click", layer, handlePlaceClick);

      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const resetAtlas = () => {
    setSelectedPlace(null);
    setIntroVisible(true);

    mapRef.current?.easeTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      duration: 1000,
    });
  };

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#17110c",
      }}
    >
      {/* Map */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />

      {/* Full-screen cinematic wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,

          pointerEvents: "none",

          background: `
            radial-gradient(
              circle at 50% 47%,
              rgba(8, 6, 4, 0.18) 0%,
              rgba(8, 6, 4, 0.10) 32%,
              rgba(8, 6, 4, 0) 68%
            ),
            linear-gradient(
              to bottom,
              rgba(8, 6, 4, 0.20) 0%,
              rgba(8, 6, 4, 0.30) 30%,
              rgba(8, 6, 4, 0.38) 52%,
              rgba(8, 6, 4, 0.30) 74%,
              rgba(8, 6, 4, 0.20) 100%
            )
          `,

          opacity: introVisible ? 1 : 0,

          transition: "opacity 900ms cubic-bezier(.22,1,.36,1)",
        }}
      />

      {/* Persistent logo */}
      <button
        type="button"
        onClick={resetAtlas}
        style={{
          position: "absolute",
          top: 22,
          left: 22,
          zIndex: 30,

          padding: 0,
          border: 0,
          background: "transparent",

          fontFamily: "Georgia, 'Times New Roman', serif",

          color: "#eee2ca",

          letterSpacing: ".24em",
          textTransform: "uppercase",

          fontSize: 13,

          cursor: "pointer",

          textShadow: "0 2px 12px rgba(0,0,0,.6)",
        }}
      >
        The Story
      </button>

      {/* Intro */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 15,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          pointerEvents: "none",

          opacity: introVisible ? 1 : 0,

          transition: "opacity 900ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            position: "relative",

            textAlign: "center",

            maxWidth: 780,
            padding: 32,

            color: "#f4ead7",

            textShadow:
              "0 2px 10px rgba(0,0,0,.72), 0 10px 40px rgba(0,0,0,.42)",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",

              fontSize: 12,
              letterSpacing: ".36em",
              textTransform: "uppercase",

              color: "#d2c1a3",

              marginBottom: 22,
            }}
          >
            The Story
          </div>

          <h1
            style={{
              margin: 0,

              fontFamily: "Georgia, 'Times New Roman', serif",

              fontSize: "clamp(42px, 5.25vw, 76px)",

              lineHeight: 1.03,
              fontWeight: 400,
              letterSpacing: "-0.025em",
            }}
          >
            Explore the World
            <br />
            of Scripture
          </h1>

          <p
            style={{
              margin: "28px auto 0",

              maxWidth: 520,

              fontFamily: "Georgia, 'Times New Roman', serif",

              fontSize: "clamp(15px, 1.35vw, 19px)",

              lineHeight: 1.65,

              color: "#dfd0b5",
            }}
          >
            66 books. Thousands of years.
            <br />
            One unfolding story.
          </p>

          <div
            style={{
              marginTop: 32,

              fontFamily: "system-ui, sans-serif",

              fontSize: 11,
              letterSpacing: ".19em",
              textTransform: "uppercase",

              color: "#b9aa91",
            }}
          >
            Explore the map to begin
          </div>
        </div>
      </div>

      {/* Loading/error status */}
      {!introVisible && status !== "Atlas ready" && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 20,

            padding: "8px 12px",

            background: "rgba(18,13,9,.75)",

            color: "#e8dcc4",

            borderRadius: 8,

            fontFamily: "system-ui, sans-serif",

            fontSize: 12,
          }}
        >
          {status}
        </div>
      )}

      {/* Selected place */}
      {selectedPlace && (
        <aside
          style={{
            position: "absolute",

            top: 20,
            right: 20,

            zIndex: 25,

            width: "min(320px, calc(100vw - 40px))",

            padding: 20,

            background: "rgba(18,13,9,.95)",

            color: "#eadfc9",

            border: "1px solid rgba(234,223,201,.18)",

            borderRadius: 12,

            backdropFilter: "blur(14px)",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedPlace(null)}
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "#eadfc9",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div
            style={{
              opacity: 0.55,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              fontSize: 11,
            }}
          >
            {selectedPlace.primaryType ?? "Biblical place"}
          </div>

          <h2
            style={{
              margin: "8px 0 6px",

              fontFamily: "Georgia, 'Times New Roman', serif",

              fontSize: 30,

              fontWeight: 400,
            }}
          >
            {selectedPlace.name}
          </h2>

          <p style={{ opacity: 0.7 }}>
            {selectedPlace.verseCount} Scripture references
          </p>
        </aside>
      )}
    </main>
  );
}
