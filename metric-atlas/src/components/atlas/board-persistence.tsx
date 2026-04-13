"use client";

import * as React from "react";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { updateBoardCanvas } from "@/lib/matrix-boards";

/**
 * Guarda en localStorage el estado del canvas (ejes, filtros, toggles, posiciones manuales) con debounce.
 */
export function BoardPersistence({ boardId }: { boardId: string }) {
  const {
    filters,
    matrixAxes,
    colorCardsByCategory,
    showMatrixQuadrantColors,
    mapClusterMode,
    metricManualPositions,
  } = useAtlasFilters();

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateBoardCanvas(boardId, {
        matrixAxes,
        colorCardsByCategory,
        showMatrixQuadrantColors,
        mapClusterMode,
        filters,
        metricManualPositions,
      });
    }, 450);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    boardId,
    colorCardsByCategory,
    filters,
    mapClusterMode,
    matrixAxes,
    metricManualPositions,
    showMatrixQuadrantColors,
  ]);

  return null;
}
