"use client";

import * as React from "react";
import type { AtlasFilters, MatrixAxesState } from "@/lib/types";
import { defaultAtlasFilters } from "@/lib/filters";
import { defaultMatrixAxes, normalizeAxes } from "@/lib/matrix-axes";
import type { MatrixBoardCanvasSettings } from "@/lib/matrix-boards";
import { defaultBoardCanvas } from "@/lib/matrix-boards";
import type { ManualPositionsMap } from "@/lib/metric-layout";

type AtlasFiltersContextValue = {
  filters: AtlasFilters;
  setFilters: React.Dispatch<React.SetStateAction<AtlasFilters>>;
  resetFilters: () => void;
  matrixAxes: MatrixAxesState;
  setMatrixAxes: React.Dispatch<React.SetStateAction<MatrixAxesState>>;
  resetMatrixAxes: () => void;
  colorCardsByCategory: boolean;
  setColorCardsByCategory: React.Dispatch<React.SetStateAction<boolean>>;
  showMatrixQuadrantColors: boolean;
  setShowMatrixQuadrantColors: React.Dispatch<React.SetStateAction<boolean>>;
  mapClusterMode: boolean;
  setMapClusterMode: React.Dispatch<React.SetStateAction<boolean>>;
  metricManualPositions: ManualPositionsMap;
  setMetricManualPosition: (metricId: string, pos: { x: number; y: number }) => void;
  clearMetricManualPositions: () => void;
  excludedMetricIds: string[];
  excludeMetric: (metricId: string) => void;
  includeMetric: (metricId: string) => void;
  clearExcludedMetrics: () => void;
};

const AtlasFiltersContext = React.createContext<
  AtlasFiltersContextValue | undefined
>(undefined);

function buildInitialState(initialCanvas?: MatrixBoardCanvasSettings | null) {
  const c = initialCanvas ?? defaultBoardCanvas();
  return {
    filters: c.filters,
    matrixAxes: normalizeAxes(c.matrixAxes),
    colorCardsByCategory: c.colorCardsByCategory,
    showMatrixQuadrantColors: c.showMatrixQuadrantColors,
    mapClusterMode: c.mapClusterMode,
    metricManualPositions: c.metricManualPositions ?? {},
    excludedMetricIds: c.excludedMetricIds ?? [],
  };
}

export function AtlasFiltersProvider({
  children,
  initialCanvas,
}: {
  children: React.ReactNode;
  initialCanvas?: MatrixBoardCanvasSettings | null;
}) {
  const init = buildInitialState(initialCanvas);

  const [filters, setFilters] = React.useState(init.filters);
  const [matrixAxes, setMatrixAxesRaw] = React.useState(init.matrixAxes);
  const [colorCardsByCategory, setColorCardsByCategory] = React.useState(
    init.colorCardsByCategory,
  );
  const [showMatrixQuadrantColors, setShowMatrixQuadrantColors] = React.useState(
    init.showMatrixQuadrantColors,
  );
  const [mapClusterMode, setMapClusterMode] = React.useState(init.mapClusterMode);
  const [metricManualPositions, setMetricManualPositions] = React.useState<
    ManualPositionsMap
  >(init.metricManualPositions);
  const [excludedMetricIds, setExcludedMetricIds] = React.useState<string[]>(
    init.excludedMetricIds,
  );

  const setMatrixAxes = React.useCallback(
    (action: React.SetStateAction<MatrixAxesState>) => {
      setMatrixAxesRaw((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        return normalizeAxes(next);
      });
    },
    [],
  );

  const resetFilters = React.useCallback(() => {
    setFilters(defaultAtlasFilters);
  }, []);

  const resetMatrixAxes = React.useCallback(() => {
    setMatrixAxesRaw(normalizeAxes(defaultMatrixAxes));
  }, []);

  const setMetricManualPosition = React.useCallback(
    (metricId: string, pos: { x: number; y: number }) => {
      setMetricManualPositions((prev) => ({
        ...prev,
        [metricId]: { x: pos.x, y: pos.y },
      }));
    },
    [],
  );

  const clearMetricManualPositions = React.useCallback(() => {
    setMetricManualPositions({});
  }, []);

  const excludeMetric = React.useCallback((metricId: string) => {
    setExcludedMetricIds((prev) =>
      prev.includes(metricId) ? prev : [...prev, metricId],
    );
  }, []);

  const includeMetric = React.useCallback((metricId: string) => {
    setExcludedMetricIds((prev) => prev.filter((id) => id !== metricId));
  }, []);

  const clearExcludedMetrics = React.useCallback(() => {
    setExcludedMetricIds([]);
  }, []);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      resetFilters,
      matrixAxes,
      setMatrixAxes,
      resetMatrixAxes,
      colorCardsByCategory,
      setColorCardsByCategory,
      showMatrixQuadrantColors,
      setShowMatrixQuadrantColors,
      mapClusterMode,
      setMapClusterMode,
      metricManualPositions,
      setMetricManualPosition,
      clearMetricManualPositions,
      excludedMetricIds,
      excludeMetric,
      includeMetric,
      clearExcludedMetrics,
    }),
    [
      colorCardsByCategory,
      filters,
      mapClusterMode,
      matrixAxes,
      metricManualPositions,
      resetFilters,
      resetMatrixAxes,
      setColorCardsByCategory,
      setMapClusterMode,
      setMatrixAxes,
      setMetricManualPosition,
      setShowMatrixQuadrantColors,
      showMatrixQuadrantColors,
      clearMetricManualPositions,
      excludedMetricIds,
      excludeMetric,
      includeMetric,
      clearExcludedMetrics,
    ],
  );

  return (
    <AtlasFiltersContext.Provider value={value}>
      {children}
    </AtlasFiltersContext.Provider>
  );
}

export function useAtlasFilters() {
  const ctx = React.useContext(AtlasFiltersContext);
  if (!ctx) {
    throw new Error("useAtlasFilters must be used within AtlasFiltersProvider");
  }
  return ctx;
}
