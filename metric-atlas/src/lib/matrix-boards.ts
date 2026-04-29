import type { AtlasFilters, MatrixAxesState } from "./types";
import { defaultAtlasFilters } from "./filters";
import { defaultMatrixAxes, normalizeAxes } from "./matrix-axes";

export const BOARD_COVER_IDS = [
  "summary",
  "signals",
  "catalog",
  "quality",
] as const;
export type BoardCoverId = (typeof BOARD_COVER_IDS)[number];

export interface MatrixBoardCanvasSettings {
  matrixAxes: MatrixAxesState;
  colorCardsByCategory: boolean;
  showMatrixQuadrantColors: boolean;
  mapClusterMode: boolean;
  filters: AtlasFilters;
  /** Posiciones 0–1 fijadas a mano (id de métrica → centro de la ficha). */
  metricManualPositions: Record<string, { x: number; y: number }>;
  /** IDs de métricas eliminadas del canvas (Delete). Se pueden volver a añadir desde la lista lateral. */
  excludedMetricIds: string[];
}

export interface MatrixSpace {
  id: string;
  name: string;
}

export interface MatrixBoard {
  id: string;
  name: string;
  spaceId: string | null;
  starred: boolean;
  coverId: BoardCoverId;
  createdAt: string;
  updatedAt: string;
  canvas: MatrixBoardCanvasSettings;
}

export function defaultBoardCanvas(): MatrixBoardCanvasSettings {
  return {
    matrixAxes: normalizeAxes(defaultMatrixAxes),
    colorCardsByCategory: false,
    showMatrixQuadrantColors: true,
    mapClusterMode: false,
    filters: defaultAtlasFilters,
    metricManualPositions: {},
    excludedMetricIds: [],
  };
}

export function defaultBoardCover(): BoardCoverId {
  return "summary";
}

/** Limpia un board parcial garantizando shape consistente (para datos de Firestore o legacy). */
export function sanitizeBoard(raw: Partial<MatrixBoard> & { id: string }): MatrixBoard {
  const canvasIn = raw.canvas ?? ({} as Partial<MatrixBoardCanvasSettings>);
  return {
    id: raw.id,
    name: raw.name ?? "Sin título",
    spaceId: raw.spaceId ?? null,
    starred: Boolean(raw.starred),
    coverId:
      typeof raw.coverId === "string" &&
      BOARD_COVER_IDS.includes(raw.coverId as BoardCoverId)
        ? (raw.coverId as BoardCoverId)
        : defaultBoardCover(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    canvas: {
      ...defaultBoardCanvas(),
      ...canvasIn,
      matrixAxes: normalizeAxes(canvasIn.matrixAxes ?? defaultMatrixAxes),
      filters: canvasIn.filters ?? defaultAtlasFilters,
      colorCardsByCategory: Boolean(canvasIn.colorCardsByCategory),
      showMatrixQuadrantColors:
        canvasIn.showMatrixQuadrantColors === undefined
          ? true
          : Boolean(canvasIn.showMatrixQuadrantColors),
      mapClusterMode: Boolean(canvasIn.mapClusterMode),
      metricManualPositions:
        canvasIn.metricManualPositions && typeof canvasIn.metricManualPositions === "object"
          ? canvasIn.metricManualPositions
          : {},
      excludedMetricIds: Array.isArray(canvasIn.excludedMetricIds)
        ? canvasIn.excludedMetricIds.filter((s): s is string => typeof s === "string")
        : [],
    },
  };
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}
