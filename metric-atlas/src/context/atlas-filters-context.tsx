"use client";

import * as React from "react";
import type {
  AtlasFilters,
  MatrixAxesState,
  MetricScoresMap,
} from "@/lib/types";
import { defaultAtlasFilters } from "@/lib/filters";
import { defaultMatrixAxes, normalizeAxes } from "@/lib/matrix-axes";
import type { MatrixBoardCanvasSettings } from "@/lib/matrix-boards";
import { defaultBoardCanvas, DEFAULT_QUADRANT_COLORS } from "@/lib/matrix-boards";

type QuadrantColors = [string, string, string, string];

/** Una posición en el lienzo (0–1) que, al asignarse, escribe los valores de
 *  los dos ejes activos en esa dimensión. */
export type PositionedMetric = { id: string; pos: { x: number; y: number } };

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
  quadrantColors: QuadrantColors;
  setQuadrantColor: (index: number, color: string) => void;
  resetQuadrantColors: () => void;
  /** Audiencias aplicadas al board (ids de la lista canónica del contexto). */
  audiences: string[];
  setAudiences: (ids: string[]) => void;
  toggleAudience: (id: string) => void;
  /** Objetivo seleccionado ("" si ninguno). Persistido en el board. */
  objective: string;
  setObjective: (id: string) => void;
  /** Plantilla de origen (para el significado de cuadrantes en el export). */
  templateId: string;
  setTemplateId: (id: string) => void;
  mapClusterMode: boolean;
  setMapClusterMode: React.Dispatch<React.SetStateAction<boolean>>;
  /** Valoraciones por métrica y dimensión (0–1). La posición sale de aquí. */
  metricScores: MetricScoresMap;
  /** Asigna el valor de una ficha en los dos ejes activos (arrastrar). */
  setMetricPosition: (metricId: string, pos: { x: number; y: number }) => void;
  /** Reposiciona varias fichas (arrastre en grupo) en un solo paso de historial. */
  moveMetrics: (entries: PositionedMetric[]) => void;
  /** Borra todas las valoraciones asignadas en esta matriz. */
  clearMetricScores: () => void;
  excludedMetricIds: string[];
  excludeMetric: (metricId: string) => void;
  /** Saca varias fichas del lienzo (Delete múltiple). */
  excludeMetrics: (metricIds: string[]) => void;
  includeMetric: (metricId: string) => void;
  /** Reincluye una ficha asignándole una posición (los dos ejes activos), en un paso. */
  includeMetricAt: (metricId: string, pos: { x: number; y: number }) => void;
  clearExcludedMetrics: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

/** Estado del canvas que participa en el historial undo/redo. */
type CanvasUndoState = {
  scores: MetricScoresMap;
  excluded: string[];
};

const HISTORY_LIMIT = 80;

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
    quadrantColors: (c.quadrantColors ?? DEFAULT_QUADRANT_COLORS) as QuadrantColors,
    mapClusterMode: c.mapClusterMode,
    metricScores: c.metricScores ?? {},
    excludedMetricIds: c.excludedMetricIds ?? [],
    audiences: c.audiences ?? [],
    objective: c.objective ?? "",
    templateId: c.templateId ?? "",
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
  const [quadrantColors, setQuadrantColors] = React.useState<QuadrantColors>(
    init.quadrantColors,
  );
  const [mapClusterMode, setMapClusterMode] = React.useState(init.mapClusterMode);
  const [audiences, setAudiences] = React.useState<string[]>(init.audiences);
  const [objective, setObjective] = React.useState<string>(init.objective);
  const [templateId, setTemplateId] = React.useState<string>(init.templateId);

  const toggleAudience = React.useCallback((id: string) => {
    setAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }, []);

  // ── Estado del canvas con historial (undo/redo) ──
  const [present, setPresent] = React.useState<CanvasUndoState>({
    scores: init.metricScores,
    excluded: init.excludedMetricIds,
  });
  const [past, setPast] = React.useState<CanvasUndoState[]>([]);
  const [future, setFuture] = React.useState<CanvasUndoState[]>([]);
  const presentRef = React.useRef(present);
  presentRef.current = present;
  // Los ejes activos en el momento de asignar (para escribir el valor en la dimensión correcta).
  const axesRef = React.useRef(matrixAxes);
  axesRef.current = matrixAxes;

  const metricScores = present.scores;
  const excludedMetricIds = present.excluded;

  /** Escribe el valor de una ficha en los dos ejes activos. */
  const writeScores = React.useCallback(
    (scores: MetricScoresMap, metricId: string, pos: { x: number; y: number }) => {
      const { axisX, axisY } = axesRef.current;
      return {
        ...scores,
        [metricId]: { ...scores[metricId], [axisX]: pos.x, [axisY]: pos.y },
      };
    },
    [],
  );

  /** Aplica un nuevo estado al canvas y registra el anterior en el historial. */
  const commit = React.useCallback((next: CanvasUndoState) => {
    const prev = presentRef.current;
    presentRef.current = next;
    setPast((p) => {
      const np = [...p, prev];
      return np.length > HISTORY_LIMIT ? np.slice(np.length - HISTORY_LIMIT) : np;
    });
    setFuture([]);
    setPresent(next);
  }, []);

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

  const setQuadrantColor = React.useCallback((index: number, color: string) => {
    setQuadrantColors((prev) => {
      if (index < 0 || index > 3 || prev[index] === color) return prev;
      const next = [...prev] as QuadrantColors;
      next[index] = color;
      return next;
    });
  }, []);

  const resetQuadrantColors = React.useCallback(() => {
    setQuadrantColors([...DEFAULT_QUADRANT_COLORS] as QuadrantColors);
  }, []);

  const setMetricPosition = React.useCallback(
    (metricId: string, pos: { x: number; y: number }) => {
      const cur = presentRef.current;
      commit({ ...cur, scores: writeScores(cur.scores, metricId, pos) });
    },
    [commit, writeScores],
  );

  const moveMetrics = React.useCallback(
    (entries: PositionedMetric[]) => {
      if (entries.length === 0) return;
      const cur = presentRef.current;
      let scores = cur.scores;
      for (const e of entries) scores = writeScores(scores, e.id, e.pos);
      commit({ ...cur, scores });
    },
    [commit, writeScores],
  );

  const clearMetricScores = React.useCallback(() => {
    const cur = presentRef.current;
    if (Object.keys(cur.scores).length === 0) return;
    commit({ ...cur, scores: {} });
  }, [commit]);

  const excludeMetric = React.useCallback(
    (metricId: string) => {
      const cur = presentRef.current;
      if (cur.excluded.includes(metricId)) return;
      commit({ ...cur, excluded: [...cur.excluded, metricId] });
    },
    [commit],
  );

  const excludeMetrics = React.useCallback(
    (metricIds: string[]) => {
      if (metricIds.length === 0) return;
      const cur = presentRef.current;
      const excluded = new Set(cur.excluded);
      let changed = false;
      for (const id of metricIds) {
        if (!excluded.has(id)) {
          excluded.add(id);
          changed = true;
        }
      }
      if (!changed) return;
      commit({ ...cur, excluded: [...excluded] });
    },
    [commit],
  );

  const includeMetric = React.useCallback(
    (metricId: string) => {
      const cur = presentRef.current;
      if (!cur.excluded.includes(metricId)) return;
      commit({ ...cur, excluded: cur.excluded.filter((id) => id !== metricId) });
    },
    [commit],
  );

  const includeMetricAt = React.useCallback(
    (metricId: string, pos: { x: number; y: number }) => {
      const cur = presentRef.current;
      commit({
        scores: writeScores(cur.scores, metricId, pos),
        excluded: cur.excluded.filter((id) => id !== metricId),
      });
    },
    [commit, writeScores],
  );

  const clearExcludedMetrics = React.useCallback(() => {
    const cur = presentRef.current;
    if (cur.excluded.length === 0) return;
    commit({ ...cur, excluded: [] });
  }, [commit]);

  const undo = React.useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1]!;
    presentRef.current = prev;
    setPast(past.slice(0, -1));
    setFuture((f) => [present, ...f]);
    setPresent(prev);
  }, [past, present]);

  const redo = React.useCallback(() => {
    if (future.length === 0) return;
    const next = future[0]!;
    presentRef.current = next;
    setFuture(future.slice(1));
    setPast((p) => [...p, present]);
    setPresent(next);
  }, [future, present]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

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
      quadrantColors,
      setQuadrantColor,
      resetQuadrantColors,
      audiences,
      setAudiences,
      toggleAudience,
      objective,
      setObjective,
      templateId,
      setTemplateId,
      mapClusterMode,
      setMapClusterMode,
      metricScores,
      setMetricPosition,
      moveMetrics,
      clearMetricScores,
      excludedMetricIds,
      excludeMetric,
      excludeMetrics,
      includeMetric,
      includeMetricAt,
      clearExcludedMetrics,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [
      colorCardsByCategory,
      filters,
      mapClusterMode,
      matrixAxes,
      metricScores,
      resetFilters,
      resetMatrixAxes,
      setColorCardsByCategory,
      setMapClusterMode,
      setMatrixAxes,
      setMetricPosition,
      moveMetrics,
      setShowMatrixQuadrantColors,
      showMatrixQuadrantColors,
      quadrantColors,
      setQuadrantColor,
      resetQuadrantColors,
      audiences,
      toggleAudience,
      objective,
      templateId,
      clearMetricScores,
      excludedMetricIds,
      excludeMetric,
      excludeMetrics,
      includeMetric,
      includeMetricAt,
      clearExcludedMetrics,
      undo,
      redo,
      canUndo,
      canRedo,
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
