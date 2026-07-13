import type { AtlasFilters, MatrixAxesState, MetricScoresMap } from "./types";
import { defaultAtlasFilters } from "./filters";
import { defaultMatrixAxes, normalizeAxes } from "./matrix-axes";

/**
 * Portada del board: `"canvas"` (mini-preview del lienzo en vivo) o el id de una
 * imagen de portada del contexto (ver `contexts/design-systems/covers.ts`).
 */
export const CANVAS_COVER = "canvas";
export type BoardCover = string;

/**
 * Colores sólidos por cuadrante (orden TL, TR, BL, BR). Mismos tonos que los
 * tintes históricos (indigo / naranja / teal / amarillo) pero más vivos y muy
 * luminosos, para mantener legibles los textos de las fichas encima.
 */
export const DEFAULT_QUADRANT_COLORS: [string, string, string, string] = [
  "#E8EAFE",
  "#FEEAD8",
  "#DAF7F0",
  "#FCF3CD",
];

/** Normaliza un array de 4 colores hex; rellena con defaults lo que falte o sea inválido. */
function sanitizeQuadrantColors(raw: unknown): [string, string, string, string] {
  const isHex = (v: unknown): v is string =>
    typeof v === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
  const arr = Array.isArray(raw) ? raw : [];
  return DEFAULT_QUADRANT_COLORS.map((fallback, i) =>
    isHex(arr[i]) ? (arr[i] as string) : fallback,
  ) as [string, string, string, string];
}

export interface MatrixBoardCanvasSettings {
  matrixAxes: MatrixAxesState;
  colorCardsByCategory: boolean;
  showMatrixQuadrantColors: boolean;
  mapClusterMode: boolean;
  filters: AtlasFilters;
  /** Valoraciones por métrica y dimensión (0–1), asignadas arrastrando. Por matriz. */
  metricScores: MetricScoresMap;
  /** IDs de métricas eliminadas del canvas (Delete). Se pueden volver a añadir desde la lista lateral. */
  excludedMetricIds: string[];
  /** Colores sólidos de los 4 cuadrantes (orden TL, TR, BL, BR). */
  quadrantColors: [string, string, string, string];
  /** IDs de audiencias aplicadas a esta matriz (lista canónica del contexto). */
  audiences: string[];
  /** Objetivo seleccionado ("¿Qué quieres demostrar?"); "" si ninguno. */
  objective: string;
  /** Plantilla de origen (para el significado de los cuadrantes en el export); "" si ninguna. */
  templateId: string;
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
  cover: BoardCover;
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
    metricScores: {},
    excludedMetricIds: [],
    quadrantColors: [...DEFAULT_QUADRANT_COLORS] as [
      string,
      string,
      string,
      string,
    ],
    audiences: [],
    objective: "",
    templateId: "",
  };
}

export function defaultBoardCover(): BoardCover {
  return CANVAS_COVER;
}

/** Normaliza el mapa de valoraciones: solo entradas con valores numéricos válidos. */
function sanitizeMetricScores(raw: unknown): MetricScoresMap {
  if (!raw || typeof raw !== "object") return {};
  const out: MetricScoresMap = {};
  for (const [metricId, dims] of Object.entries(raw as Record<string, unknown>)) {
    if (!dims || typeof dims !== "object") continue;
    const clean: Record<string, number> = {};
    for (const [dim, value] of Object.entries(dims as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        clean[dim] = Math.min(1, Math.max(0, value));
      }
    }
    if (Object.keys(clean).length > 0) out[metricId] = clean;
  }
  return out;
}

/** Limpia un board parcial garantizando shape consistente (para datos de Firestore o legacy). */
export function sanitizeBoard(raw: Partial<MatrixBoard> & { id: string }): MatrixBoard {
  const canvasIn = raw.canvas ?? ({} as Partial<MatrixBoardCanvasSettings>);
  return {
    id: raw.id,
    name: raw.name ?? "Sin título",
    spaceId: raw.spaceId ?? null,
    starred: Boolean(raw.starred),
    cover:
      typeof raw.cover === "string" && raw.cover
        ? raw.cover
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
      metricScores: sanitizeMetricScores(canvasIn.metricScores),
      excludedMetricIds: Array.isArray(canvasIn.excludedMetricIds)
        ? canvasIn.excludedMetricIds.filter((s): s is string => typeof s === "string")
        : [],
      quadrantColors: sanitizeQuadrantColors(canvasIn.quadrantColors),
      audiences: Array.isArray(canvasIn.audiences)
        ? canvasIn.audiences.filter((s): s is string => typeof s === "string")
        : [],
      objective: typeof canvasIn.objective === "string" ? canvasIn.objective : "",
      templateId: typeof canvasIn.templateId === "string" ? canvasIn.templateId : "",
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
