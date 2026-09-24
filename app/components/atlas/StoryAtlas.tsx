"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtlasController } from "../../hooks/useAtlasController";
import { usePlaceDetails } from "../../hooks/usePlaceDetails";
import { AtlasControls } from "./AtlasControls";
import { AtlasIntro } from "./AtlasIntro";
import { AtlasMap } from "./AtlasMap";
import { AtlasTopBar } from "./AtlasTopBar";
import { PlaceDrawer } from "./PlaceDrawer";

export default function StoryAtlas() {
  const controller = useAtlasController();
  const placeDetails = usePlaceDetails(controller.selectedPlace);
  const [status, setStatus] = useState<
    "loading" | "ready" | "style-error" | "data-error"
  >("loading");
  const reset = useCallback(() => controller.reset(), [controller.reset]);
  const onMapReady = useCallback(() => setStatus("ready"), []);
  const onBaseStyleError = useCallback(() => setStatus("style-error"), []);
  const onAtlasDataError = useCallback(() => setStatus("data-error"), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        controller.setSearchOpen(true);
        controller.dismissIntro();
      }
      if (event.key === "Escape") {
        controller.setSearchOpen(false);
        controller.setLayersOpen(false);
        if (controller.selectedPlace) controller.closePlace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controller]);

  return (
    <main className="atlas-shell">
      <AtlasMap
        layerVisibility={controller.layerVisibility}
        selectedPlace={controller.selectedPlace}
        resetVersion={controller.resetVersion}
        onMapReady={onMapReady}
        onBaseStyleError={onBaseStyleError}
        onAtlasDataError={onAtlasDataError}
        onExplore={controller.dismissIntro}
        onSelectPlace={controller.selectPlace}
      />
      <div
        className={`atlas-wash ${controller.introVisible ? "is-visible" : ""}`}
        aria-hidden="true"
      />
      <AtlasIntro visible={controller.introVisible} />
      <AtlasTopBar
        onReset={reset}
        searchOpen={controller.searchOpen}
        layersOpen={controller.layersOpen}
        onSearchToggle={() => {
          controller.setSearchOpen(!controller.searchOpen);
          controller.dismissIntro();
        }}
        onLayersToggle={() => controller.setLayersOpen(!controller.layersOpen)}
      />
      <AtlasControls onReset={reset} />
      {status !== "ready" && (
        <div
          className={`atlas-status ${status === "style-error" || status === "data-error" ? "is-error" : ""}`}
          role={
            status === "style-error" || status === "data-error"
              ? "alert"
              : "status"
          }
        >
          {status === "loading"
            ? "Loading atlas…"
            : status === "data-error"
              ? "Biblical atlas data could not load."
              : "Map style could not load."}
        </div>
      )}
      <PlaceDrawer
        place={controller.selectedPlace}
        detail={placeDetails.detail}
        detailStatus={placeDetails.status}
        onClose={controller.closePlace}
      />
    </main>
  );
}
