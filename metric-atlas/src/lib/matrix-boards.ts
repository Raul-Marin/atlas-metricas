import type { AtlasFilters, MatrixAxesState } from "./types";
import { defaultAtlasFilters } from "./filters";
import { defaultMatrixAxes, normalizeAxes } from "./matrix-axes";

export const BOARDS_STORAGE_KEY = "metric-atlas-boards-v1";
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

export interface BoardsStore {
  spaces: MatrixSpace[];
  boards: MatrixBoard[];
}

export function defaultBoardCanvas(): MatrixBoardCanvasSettings {
  return {
    matrixAxes: normalizeAxes(defaultMatrixAxes),
    colorCardsByCategory: false,
    showMatrixQuadrantColors: true,
    mapClusterMode: false,
    filters: defaultAtlasFilters,
    metricManualPositions: {},
  };
}

function safeParse(raw: string | null): BoardsStore | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as BoardsStore;
    if (!data || !Array.isArray(data.boards)) return null;
    return data;
  } catch {
    return null;
  }
}

export function defaultBoardCover(): BoardCoverId {
  return "summary";
}

export function loadBoardsStore(): BoardsStore {
  if (typeof window === "undefined") {
    return { spaces: [], boards: [] };
  }
  const parsed = safeParse(localStorage.getItem(BOARDS_STORAGE_KEY));
  if (parsed) {
    parsed.boards = parsed.boards.map((b) => ({
      ...b,
      coverId:
        typeof b.coverId === "string" &&
        BOARD_COVER_IDS.includes(b.coverId as BoardCoverId)
          ? (b.coverId as BoardCoverId)
          : defaultBoardCover(),
      canvas: {
        ...defaultBoardCanvas(),
        ...b.canvas,
        matrixAxes: normalizeAxes(b.canvas?.matrixAxes ?? defaultMatrixAxes),
        filters: b.canvas?.filters ?? defaultAtlasFilters,
        colorCardsByCategory: Boolean(b.canvas?.colorCardsByCategory),
        showMatrixQuadrantColors:
          b.canvas?.showMatrixQuadrantColors === undefined
            ? true
            : Boolean(b.canvas?.showMatrixQuadrantColors),
        mapClusterMode: Boolean(b.canvas?.mapClusterMode),
        metricManualPositions:
          b.canvas?.metricManualPositions && typeof b.canvas.metricManualPositions === "object"
            ? b.canvas.metricManualPositions
            : {},
      },
    }));
    if (!parsed.spaces) parsed.spaces = [];
    return parsed;
  }
  return seedBoardsStore();
}

function seedBoardsStore(): BoardsStore {
  const spaceId = crypto.randomUUID();
  const boardId = crypto.randomUUID();
  const store: BoardsStore = {
    spaces: [{ id: spaceId, name: "General" }],
    boards: [
      {
        id: boardId,
        name: "Mi primera matrix",
        spaceId: null,
        starred: false,
        coverId: defaultBoardCover(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canvas: defaultBoardCanvas(),
      },
    ],
  };
  saveBoardsStore(store);
  return store;
}

export function saveBoardsStore(store: BoardsStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(store));
}

export function emitBoardsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("metric-atlas-boards-changed"));
}

export function getBoardById(id: string): MatrixBoard | undefined {
  return loadBoardsStore().boards.find((b) => b.id === id);
}

export function createBoard(
  name: string,
  canvasOverrides?: Partial<MatrixBoardCanvasSettings>,
): MatrixBoard {
  const store = loadBoardsStore();
  const board: MatrixBoard = {
    id: crypto.randomUUID(),
    name: name.trim() || "Matrix sin título",
    spaceId: null,
    starred: false,
    coverId: defaultBoardCover(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    canvas: {
      ...defaultBoardCanvas(),
      ...canvasOverrides,
      matrixAxes: normalizeAxes(
        canvasOverrides?.matrixAxes ?? defaultBoardCanvas().matrixAxes,
      ),
      filters: canvasOverrides?.filters ?? defaultBoardCanvas().filters,
      metricManualPositions:
        canvasOverrides?.metricManualPositions ?? defaultBoardCanvas().metricManualPositions,
    },
  };
  store.boards = [board, ...store.boards];
  saveBoardsStore(store);
  emitBoardsChanged();
  return board;
}

export function updateBoardCanvas(
  id: string,
  canvas: MatrixBoardCanvasSettings,
): void {
  const store = loadBoardsStore();
  const idx = store.boards.findIndex((b) => b.id === id);
  if (idx < 0) return;
  store.boards[idx] = {
    ...store.boards[idx],
    updatedAt: new Date().toISOString(),
    canvas: {
      ...canvas,
      matrixAxes: normalizeAxes(canvas.matrixAxes),
      metricManualPositions: canvas.metricManualPositions ?? {},
    },
  };
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function renameBoard(id: string, name: string): void {
  const store = loadBoardsStore();
  const idx = store.boards.findIndex((b) => b.id === id);
  if (idx < 0) return;
  store.boards[idx] = {
    ...store.boards[idx],
    name: name.trim() || "Sin título",
    updatedAt: new Date().toISOString(),
  };
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function toggleStarBoard(id: string): void {
  const store = loadBoardsStore();
  const idx = store.boards.findIndex((b) => b.id === id);
  if (idx < 0) return;
  store.boards[idx] = {
    ...store.boards[idx],
    starred: !store.boards[idx].starred,
    updatedAt: new Date().toISOString(),
  };
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function updateBoardCover(id: string, coverId: BoardCoverId): void {
  const store = loadBoardsStore();
  const idx = store.boards.findIndex((b) => b.id === id);
  if (idx < 0) return;
  store.boards[idx] = {
    ...store.boards[idx],
    coverId,
    updatedAt: new Date().toISOString(),
  };
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function setBoardSpace(id: string, spaceId: string | null): void {
  const store = loadBoardsStore();
  const idx = store.boards.findIndex((b) => b.id === id);
  if (idx < 0) return;
  store.boards[idx] = {
    ...store.boards[idx],
    spaceId,
    updatedAt: new Date().toISOString(),
  };
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function deleteBoard(id: string): void {
  const store = loadBoardsStore();
  store.boards = store.boards.filter((b) => b.id !== id);
  saveBoardsStore(store);
  emitBoardsChanged();
}

export function createSpace(name: string): MatrixSpace {
  const store = loadBoardsStore();
  const space: MatrixSpace = {
    id: crypto.randomUUID(),
    name: name.trim() || "Espacio",
  };
  store.spaces = [...store.spaces, space];
  saveBoardsStore(store);
  emitBoardsChanged();
  return space;
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
