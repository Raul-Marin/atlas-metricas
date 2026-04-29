"use client";

import * as React from "react";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { updateBoardCanvas } from "@/lib/boards/firestore";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Persiste en Firestore el estado del canvas (ejes, filtros, toggles, posiciones manuales) con debounce.
 */
export function BoardPersistence({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const {
    filters,
    matrixAxes,
    colorCardsByCategory,
    showMatrixQuadrantColors,
    mapClusterMode,
    metricManualPositions,
    excludedMetricIds,
  } = useAtlasFilters();

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateBoardCanvas(user.uid, boardId, {
        matrixAxes,
        colorCardsByCategory,
        showMatrixQuadrantColors,
        mapClusterMode,
        filters,
        metricManualPositions,
        excludedMetricIds,
      }).catch((err) => {
        console.error("[board-persistence] updateBoardCanvas", err);
      });
    }, 450);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    user,
    boardId,
    colorCardsByCategory,
    filters,
    mapClusterMode,
    matrixAxes,
    metricManualPositions,
    showMatrixQuadrantColors,
    excludedMetricIds,
  ]);

  return null;
}
