"use client";

import { useEffect, useState } from "react";
import { loadPlaceDetail } from "../lib/atlas/data";
import type { BiblicalPlace, PlaceDetail } from "../lib/atlas/types";

export function usePlaceDetails(place: BiblicalPlace | null) {
  const [resolvedDetail, setResolvedDetail] = useState<{
    placeId: string | null;
    detail: PlaceDetail | null;
    status: "ready" | "missing" | "error";
  }>({ placeId: null, detail: null, status: "missing" });
  const placeId = place?.id ?? null;

  useEffect(() => {
    if (!placeId) return;
    let current = true;
    void loadPlaceDetail(placeId)
      .then((nextDetail) => {
        if (!current) return;
        setResolvedDetail({
          placeId,
          detail: nextDetail,
          status: nextDetail ? "ready" : "missing",
        });
      })
      .catch(() => {
        if (current) setResolvedDetail({ placeId, detail: null, status: "error" });
      });
    return () => { current = false; };
  }, [placeId]);

  if (!placeId) return { detail: null, status: "idle" as const };
  if (resolvedDetail.placeId !== placeId) return { detail: null, status: "loading" as const };
  return { detail: resolvedDetail.detail, status: resolvedDetail.status };
}
