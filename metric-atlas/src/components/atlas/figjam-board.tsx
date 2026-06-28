"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { axisEndLabels, MATRIX_AXIS_OPTIONS } from "@/lib/matrix-axes";
import { resolveMetricLayout } from "@/lib/metric-layout";
import {
  clusterMapPoints,
  clusterRadiusForZoom,
  clampZoom,
  singletonClustersFromPoints,
  type MapPoint,
} from "@/lib/map-cluster";
import { VIZ_LEGEND } from "@/lib/quadrant-viz";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { Info, Maximize, Minus, Plus, RotateCcw } from "lucide-react";
import { MetricsDataTable } from "./metrics-data-table";
import {
  MetricCardContent,
  METRIC_CARD_BASE,
  metricCardBoxStyle,
} from "./metric-card";

/** Tamaño lógico del canvas (px); el mapa ocupa todo el rectángulo y puedes desplazarte fuera. */
const CANVAS_WORLD_W = 5600;
const CANVAS_WORLD_H = 4200;

const FIGJAM_DOT_GRID = {
  backgroundColor: "#f7f7f7",
  backgroundImage: [
    "radial-gradient(circle, rgba(110, 110, 110, 0.2) 1.1px, transparent 1.2px)",
    "radial-gradient(circle, rgba(255, 255, 255, 0.82) 0.55px, transparent 0.65px)",
    "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(244,244,244,0.92))",
  ].join(", "),
  backgroundPosition: "0 0, 14px 14px, 0 0",
  backgroundSize: "28px 28px, 28px 28px, 100% 100%",
} as const;

function hashRot(id: string): number {
  void id;
  return 0;
}

type HintKey = "zoom" | "pan" | "card";
type HintStatus = "pending" | "hit" | "fading" | "gone";

function HintItem({
  status,
  children,
}: {
  status: HintStatus;
  children: React.ReactNode;
}) {
  if (status === "gone") return null;
  return (
    <span
      className={cn(
        "transition-opacity duration-500",
        status === "pending" && "text-[#757575] opacity-100",
        status === "hit" && "text-emerald-600 opacity-100",
        status === "fading" && "text-emerald-600 opacity-0",
      )}
    >
      {children}
    </span>
  );
}

function LegendFloat() {
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <button
        type="button"
        data-export-hide="true"
        onClick={() => setOpen(true)}
        aria-label="Mostrar leyenda de tipos"
        className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/55 text-[#626262] shadow-sm backdrop-blur-md transition-colors hover:bg-white/75 hover:text-[#1e1e1e]"
      >
        <Info className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-export-hide="true"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(false);
        }
      }}
      aria-label="Ocultar leyenda de tipos"
      className="absolute left-4 top-4 z-10 max-w-[200px] cursor-pointer rounded-xl border border-white/40 bg-white/55 p-3 text-[10px] shadow-md backdrop-blur-md transition-colors hover:bg-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
    >
      <p className="mb-2 font-semibold uppercase tracking-wide text-[#757575]">
        Tipos
      </p>
      <ul className="space-y-1 text-[#444]">
        {VIZ_LEGEND.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
            {row.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export type FigJamBoardHandle = {
  getViewportCenterNorm: () => { x: number; y: number } | null;
  /** Captura el viewport visible como PNG (dataURL). Oculta controles flotantes. */
  exportImage: () => Promise<string | null>;
  /** Encuadra (zoom + pan) las fichas seleccionadas para que llenen la vista. */
  zoomToSelection: () => void;
  /** Encaja todas las fichas del canvas en la vista (zoom-to-fit). */
  zoomToFit: () => void;
  /** Convierte un punto de pantalla a coordenadas normalizadas del canvas.
   *  Devuelve null si el punto está fuera del lienzo (no se debe colocar). */
  screenToCanvasNorm: (clientX: number, clientY: number) => { x: number; y: number } | null;
  /** Centra la vista en una métrica concreta (sin cambiar el zoom). */
  focusMetric: (metricId: string) => void;
};

type FigJamBoardProps = {
  metrics: Metric[];
  selectedIds: Set<string>;
  onSelect: (m: Metric, additive: boolean) => void;
  onClearSelection: () => void;
  /** Selección por recuadro (Shift+arrastrar el fondo): añade las fichas a la selección. */
  onBoxSelect?: (ids: string[]) => void;
  /** Tabla de datos flotante (dentro del canvas), con valores en vivo. */
  dataTableOpen?: boolean;
  onCloseDataTable?: () => void;
};

export const FigJamBoard = React.forwardRef<FigJamBoardHandle, FigJamBoardProps>(
  function FigJamBoard(
    {
      metrics,
      selectedIds,
      onSelect,
      onClearSelection,
      onBoxSelect,
      dataTableOpen,
      onCloseDataTable,
    },
    forwardedRef,
  ) {
  const {
    matrixAxes,
    colorCardsByCategory,
    showMatrixQuadrantColors,
    quadrantColors,
    mapClusterMode,
    metricScores,
    setMetricPosition,
    moveMetrics,
    excludedMetricIds,
  } = useAtlasFilters();

  /** Overrides de posición en vivo durante el arrastre (id → posición norm). */
  const [dragPreview, setDragPreview] = React.useState<
    Record<string, { x: number; y: number }> | null
  >(null);
  // Métrica con "glow" transitorio (al localizarla); se desvanece tras ~1s.
  const [glowId, setGlowId] = React.useState<string | null>(null);
  const glowTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRef = React.useRef<(id: string) => void>(() => {});
  const [hints, setHints] = React.useState<Record<HintKey, HintStatus>>({
    zoom: "pending",
    pan: "pending",
    card: "pending",
  });
  const markHintHit = React.useCallback((key: HintKey) => {
    setHints((prev) => {
      if (prev[key] !== "pending") return prev;
      return { ...prev, [key]: "hit" };
    });
    window.setTimeout(() => {
      setHints((prev) =>
        prev[key] === "hit" ? { ...prev, [key]: "fading" } : prev,
      );
    }, 600);
    window.setTimeout(() => {
      setHints((prev) =>
        prev[key] === "fading" ? { ...prev, [key]: "gone" } : prev,
      );
    }, 1200);
  }, []);
  const cardDragRef = React.useRef<{
    pointerId: number;
    id: string;
    cx: number;
    cy: number;
    /** Posición inicial de cada ficha arrastrada (1 si es individual, N si es grupo). */
    starts: Map<string, { x: number; y: number }>;
    moved: boolean;
  } | null>(null);
  /** Posiciones finales en vivo de las fichas arrastradas (id → posición norm). */
  const liveDragNormRef = React.useRef<Record<string, { x: number; y: number }> | null>(
    null,
  );
  const xEnds = axisEndLabels(matrixAxes.axisX);
  const yEnds = axisEndLabels(matrixAxes.axisY);
  const xAxisTitle =
    MATRIX_AXIS_OPTIONS.find((o) => o.id === matrixAxes.axisX)?.label ?? "Eje horizontal";
  const yAxisTitle =
    MATRIX_AXIS_OPTIONS.find((o) => o.id === matrixAxes.axisY)?.label ?? "Eje vertical";

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const zoomRef = React.useRef(zoom);
  const panRef = React.useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  // Refs en vivo para que el handle imperativo (deps []) lea siempre lo último.
  const selectedIdsRef = React.useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const layoutMapRef = React.useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const pointsRef = React.useRef<MapPoint[]>([]);
  const frameNormRef = React.useRef<(pts: { x: number; y: number }[]) => void>(
    () => {},
  );
  const clampPanRef = React.useRef<
    (
      next: { x: number; y: number },
      zoom: number,
      vpW: number,
      vpH: number,
    ) => { x: number; y: number }
  >((next) => next);

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      getViewportCenterNorm: () => {
        const vp = viewportRef.current;
        if (!vp) return null;
        const w = vp.clientWidth;
        const h = vp.clientHeight;
        if (w < 8 || h < 8) return null;
        const z = zoomRef.current;
        const p = panRef.current;
        const wx = (w / 2 - p.x) / z;
        const wy = (h / 2 - p.y) / z;
        return {
          x: Math.min(0.97, Math.max(0.03, wx / CANVAS_WORLD_W)),
          y: Math.min(0.97, Math.max(0.03, wy / CANVAS_WORLD_H)),
        };
      },
      exportImage: async () => {
        const vp = viewportRef.current;
        if (!vp) return null;
        return toPng(vp, {
          pixelRatio: 2,
          backgroundColor: "#f3f3f3",
          // Excluye controles flotantes (zoom, hints, leyenda) de la captura.
          filter: (node) =>
            !(node instanceof HTMLElement && node.dataset.exportHide === "true"),
        });
      },
      zoomToSelection: () => {
        const lm = layoutMapRef.current;
        const pts = [...selectedIdsRef.current]
          .map((id) => lm.get(id))
          .filter((p): p is { x: number; y: number } => !!p);
        frameNormRef.current(pts);
      },
      zoomToFit: () => {
        frameNormRef.current(
          pointsRef.current.map((p) => ({ x: p.x, y: p.y })),
        );
      },
      screenToCanvasNorm: (clientX, clientY) => {
        const vp = viewportRef.current;
        if (!vp) return null;
        const rect = vp.getBoundingClientRect();
        const lx = clientX - rect.left;
        const ly = clientY - rect.top;
        // Fuera del lienzo → no se coloca.
        if (lx < 0 || ly < 0 || lx > rect.width || ly > rect.height) return null;
        const z = zoomRef.current;
        const p = panRef.current;
        return {
          x: Math.min(0.97, Math.max(0.03, (lx - p.x) / z / CANVAS_WORLD_W)),
          y: Math.min(0.97, Math.max(0.03, (ly - p.y) / z / CANVAS_WORLD_H)),
        };
      },
      focusMetric: (metricId) => {
        const vp = viewportRef.current;
        if (!vp) return;
        const pos = layoutMapRef.current.get(metricId);
        if (!pos) return;
        const w = vp.clientWidth;
        const h = vp.clientHeight;
        if (w < 8 || h < 8) return;
        const z = zoomRef.current;
        const p = panRef.current;
        const cx = pos.x * CANVAS_WORLD_W;
        const cy = pos.y * CANVAS_WORLD_H;
        // Posición en pantalla del centro de la ficha.
        const sx = cx * z + p.x;
        const sy = cy * z + p.y;
        // Si ya está cómodamente visible (con margen para el tamaño de la ficha):
        // la iluminamos ya mismo y no movemos la vista.
        const mx = 130;
        const my = 70;
        if (sx >= mx && sx <= w - mx && sy >= my && sy <= h - my) {
          flashRef.current(metricId);
          return;
        }
        // Si no, paneamos (animado, mismo zoom) y el glow arranca cuando aparece.
        const newPan = clampPanRef.current(
          { x: w / 2 - cx * z, y: h / 2 - cy * z },
          z,
          w,
          h,
        );
        animatePanToRef.current(newPan, 420, () => flashRef.current(metricId));
      },
    }),
    // El handle solo usa refs (frameNormRef/pointsRef/...); se crea una vez.
    [],
  );

  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

  // Selección por recuadro (lasso): Shift + arrastrar el fondo.
  const boxRef = React.useRef<{
    pointerId: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const [selectBox, setSelectBox] = React.useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  React.useEffect(() => {
    if (zoom !== 1) markHintHit("zoom");
  }, [zoom, markHintHit]);

  // Red de seguridad: si el `pointerup` no llega al elemento (por pérdida de captura,
  // salir del viewport, blur de ventana, etc.) limpiamos el estado de drag a nivel global.
  React.useEffect(() => {
    const release = () => {
      dragRef.current = null;
      if (boxRef.current) {
        boxRef.current = null;
        setSelectBox(null);
      }
      if (cardDragRef.current) {
        cardDragRef.current = null;
        liveDragNormRef.current = null;
        setDragPreview(null);
      }
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
    };
  }, []);

  const centerCamera = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    if (vw < 8 || vh < 8) return;
    const z = zoomRef.current;
    const next = {
      x: vw / 2 - (CANVAS_WORLD_W / 2) * z,
      y: vh / 2 - (CANVAS_WORLD_H / 2) * z,
    };
    panRef.current = next;
    setPan(next);
  }, []);

  React.useLayoutEffect(() => {
    zoomRef.current = 1;
    setZoom(1);
    const run = () => centerCamera();
    run();
    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [matrixAxes.axisX, matrixAxes.axisY, centerCamera]);

  React.useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (zoomRef.current === 1) centerCamera();
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [centerCamera]);

  /** Zoom mínimo dinámico: el canvas no puede ser más pequeño que el viewport en ningún eje. */
  const getMinZoom = React.useCallback((vpW: number, vpH: number) => {
    if (vpW <= 0 || vpH <= 0) return 0.35;
    return Math.max(vpW / CANVAS_WORLD_W, vpH / CANVAS_WORLD_H);
  }, []);

  /** Restringe el pan para que el canvas (5600×4200 * zoom) nunca deje hueco fuera del viewport. */
  const clampPan = React.useCallback(
    (next: { x: number; y: number }, zoom: number, vpW: number, vpH: number) => {
      const cw = CANVAS_WORLD_W * zoom;
      const ch = CANVAS_WORLD_H * zoom;
      let minX: number;
      let maxX: number;
      let minY: number;
      let maxY: number;
      if (cw > vpW) {
        minX = vpW - cw;
        maxX = 0;
      } else {
        minX = 0;
        maxX = vpW - cw;
      }
      if (ch > vpH) {
        minY = vpH - ch;
        maxY = 0;
      } else {
        minY = 0;
        maxY = vpH - ch;
      }
      return {
        x: Math.min(maxX, Math.max(minX, next.x)),
        y: Math.min(maxY, Math.max(minY, next.y)),
      };
    },
    [],
  );

  /** Encuadra un conjunto de posiciones normalizadas para que llenen la vista. */
  const frameNorm = React.useCallback(
    (pts: { x: number; y: number }[]) => {
      const vp = viewportRef.current;
      if (!vp || pts.length === 0) return;
      const w = vp.clientWidth;
      const h = vp.clientHeight;
      if (w < 8 || h < 8) return;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      // Incluye el tamaño de la ficha + margen para que no quede pegada al borde.
      const CARD_W = 260;
      const CARD_H = 96;
      const spanW = (maxX - minX) * CANVAS_WORLD_W + CARD_W;
      const spanH = (maxY - minY) * CANVAS_WORLD_H + CARD_H;
      const fit = 0.82;
      const z = clampZoom(
        Math.min((w * fit) / spanW, (h * fit) / spanH),
        getMinZoom(w, h),
      );
      const cx = ((minX + maxX) / 2) * CANVAS_WORLD_W;
      const cy = ((minY + maxY) / 2) * CANVAS_WORLD_H;
      const newPan = clampPan({ x: w / 2 - cx * z, y: h / 2 - cy * z }, z, w, h);
      zoomRef.current = z;
      panRef.current = newPan;
      setZoom(z);
      setPan(newPan);
    },
    [clampPan, getMinZoom],
  );
  frameNormRef.current = frameNorm;
  clampPanRef.current = clampPan;

  // Paneo animado con easing (ease-in-out) para "localizar" una métrica con suavidad.
  const panAnimRef = React.useRef<number | null>(null);
  const cancelPanAnim = React.useCallback(() => {
    if (panAnimRef.current != null) {
      cancelAnimationFrame(panAnimRef.current);
      panAnimRef.current = null;
    }
  }, []);
  const animatePanTo = React.useCallback(
    (target: { x: number; y: number }, duration = 420, onDone?: () => void) => {
      cancelPanAnim();
      const start = { ...panRef.current };
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      if (Math.hypot(dx, dy) < 0.5) {
        panRef.current = target;
        setPan(target);
        onDone?.();
        return;
      }
      const t0 = performance.now();
      // easeInOutQuad
      const ease = (t: number) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const e = ease(p);
        const next = { x: start.x + dx * e, y: start.y + dy * e };
        panRef.current = next;
        setPan(next);
        if (p < 1) {
          panAnimRef.current = requestAnimationFrame(step);
        } else {
          panAnimRef.current = null;
          onDone?.();
        }
      };
      panAnimRef.current = requestAnimationFrame(step);
    },
    [cancelPanAnim],
  );
  const animatePanToRef = React.useRef(animatePanTo);
  animatePanToRef.current = animatePanTo;

  // Glow transitorio: ilumina la ficha y a ~1s se desvanece.
  const flash = React.useCallback((id: string) => {
    setGlowId(id);
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => setGlowId(null), 550);
  }, []);
  flashRef.current = flash;

  React.useEffect(
    () => () => {
      cancelPanAnim();
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    },
    [cancelPanAnim],
  );

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      // Mientras se arrastra una ficha el wheel no debe zoomear el canvas.
      if (cardDragRef.current) return;
      if (panAnimRef.current != null) {
        cancelAnimationFrame(panAnimRef.current);
        panAnimRef.current = null;
      }
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevZ = zoomRef.current;
      const prevP = panRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.11;
      const minZ = getMinZoom(el.clientWidth, el.clientHeight);
      const newZoom = clampZoom(prevZ * factor, minZ);
      const wx = (mx - prevP.x) / prevZ;
      const wy = (my - prevP.y) / prevZ;
      const rawPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
      const newPan = clampPan(rawPan, newZoom, el.clientWidth, el.clientHeight);
      zoomRef.current = newZoom;
      panRef.current = newPan;
      setZoom(newZoom);
      setPan(newPan);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [clampPan, getMinZoom]);

  const zoomToCluster = React.useCallback(
    (nx: number, ny: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const prevZ = zoomRef.current;
      const newZoom = clampZoom(prevZ * 1.45, getMinZoom(w, h));
      const cx = nx * CANVAS_WORLD_W;
      const cy = ny * CANVAS_WORLD_H;
      const rawPan = { x: w / 2 - cx * newZoom, y: h / 2 - cy * newZoom };
      const newPan = clampPan(rawPan, newZoom, w, h);
      zoomRef.current = newZoom;
      panRef.current = newPan;
      setZoom(newZoom);
      setPan(newPan);
    },
    [clampPan, getMinZoom],
  );

  const resetView = React.useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
    centerCamera();
  }, [centerCamera]);

  /** Coordenadas del puntero relativas al viewport (px). */
  const viewportPoint = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return rect
      ? { x: clientX - rect.left, y: clientY - rect.top }
      : { x: clientX, y: clientY };
  };

  const onGridPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Si ya hay una ficha capturada, no arrancamos pan paralelo.
    if (cardDragRef.current) return;
    cancelPanAnim();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Shift + arrastrar el fondo = selección por recuadro (lasso). Si no, pan.
    if (e.shiftKey && onBoxSelect) {
      const { x, y } = viewportPoint(e.clientX, e.clientY);
      boxRef.current = { pointerId: e.pointerId, sx: x, sy: y, moved: false };
      setSelectBox({ x, y, w: 0, h: 0 });
      return;
    }
    const p = panRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      panX: p.x,
      panY: p.y,
      moved: false,
    };
  };

  const onGridPointerMove = (e: React.PointerEvent) => {
    const b = boxRef.current;
    if (b && e.pointerId === b.pointerId) {
      const { x, y } = viewportPoint(e.clientX, e.clientY);
      if (Math.hypot(x - b.sx, y - b.sy) > 3) b.moved = true;
      setSelectBox({
        x: Math.min(b.sx, x),
        y: Math.min(b.sy, y),
        w: Math.abs(x - b.sx),
        h: Math.abs(y - b.sy),
      });
      return;
    }
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 4) {
      d.moved = true;
      markHintHit("pan");
    }
    const el = viewportRef.current;
    const raw = { x: d.panX + dx, y: d.panY + dy };
    const next = el
      ? clampPan(raw, zoomRef.current, el.clientWidth, el.clientHeight)
      : raw;
    panRef.current = next;
    setPan(next);
  };

  const onGridPointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const b = boxRef.current;
    if (b && e.pointerId === b.pointerId) {
      boxRef.current = null;
      setSelectBox(null);
      if (b.moved && onBoxSelect) {
        const end = viewportPoint(e.clientX, e.clientY);
        const z = zoomRef.current;
        const p = panRef.current;
        // Recuadro (px viewport) → coordenadas normalizadas del canvas.
        const toNorm = (vx: number, vy: number) => ({
          nx: (vx - p.x) / z / CANVAS_WORLD_W,
          ny: (vy - p.y) / z / CANVAS_WORLD_H,
        });
        const a = toNorm(Math.min(b.sx, end.x), Math.min(b.sy, end.y));
        const c = toNorm(Math.max(b.sx, end.x), Math.max(b.sy, end.y));
        const ids = pointsRef.current
          .filter(
            (pt) =>
              pt.x >= a.nx && pt.x <= c.nx && pt.y >= a.ny && pt.y <= c.ny,
          )
          .map((pt) => pt.id);
        if (ids.length > 0) onBoxSelect(ids);
      }
      return;
    }
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    // Clic en el fondo sin arrastrar = deseleccionar todo.
    if (!d.moved) onClearSelection();
  };

  const layoutMap = React.useMemo(
    () => resolveMetricLayout(metrics, matrixAxes, metricScores),
    [matrixAxes, metricScores, metrics],
  );
  layoutMapRef.current = layoutMap;

  const renderableMetrics = React.useMemo(
    () => metrics.filter((m) => !excludedMetricIds.includes(m.id)),
    [metrics, excludedMetricIds],
  );

  const points: MapPoint[] = React.useMemo(
    () =>
      renderableMetrics.map((m) => {
        const base = layoutMap.get(m.id) ?? { x: 0.5, y: 0.5 };
        const d = dragPreview?.[m.id] ?? null;
        return {
          id: m.id,
          x: d ? d.x : base.x,
          y: d ? d.y : base.y,
          metric: m,
        };
      }),
    [dragPreview, layoutMap, renderableMetrics],
  );
  pointsRef.current = points;

  const clusters = React.useMemo(() => {
    if (!mapClusterMode) return singletonClustersFromPoints(points);
    const r = clusterRadiusForZoom(zoom);
    return clusterMapPoints(points, r);
  }, [mapClusterMode, points, zoom]);

  return (
    <div className="relative h-full min-h-[320px] w-full">
      <LegendFloat />

      <span
        className="pointer-events-none absolute left-1/2 top-2 z-[15] flex max-w-[min(92vw,300px)] -translate-x-1/2 flex-col items-center gap-0.5 text-center"
        title={yAxisTitle}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#757575]">
          {yAxisTitle}
        </span>
        <span className="text-[11px] font-bold leading-tight text-[#1e1e1e] sm:text-xs">
          {yEnds.low} · arriba
        </span>
      </span>
      <span
        className="pointer-events-none absolute bottom-3 left-1/2 z-[15] flex max-w-[min(92vw,300px)] -translate-x-1/2 flex-col items-center gap-0.5 text-center"
        title={yAxisTitle}
      >
        <span className="text-[11px] font-bold leading-tight text-[#1e1e1e] sm:text-xs">
          {yEnds.high} · abajo
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#757575]">
          {yAxisTitle}
        </span>
      </span>
      <span
        className="pointer-events-none absolute left-2 top-1/2 z-[15] flex max-w-[88px] -translate-y-1/2 flex-col items-center gap-0.5 text-center sm:left-3 sm:max-w-[104px]"
        title={xAxisTitle}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#757575]">
          {xAxisTitle}
        </span>
        <span className="text-[11px] font-bold leading-tight text-[#1e1e1e] sm:text-xs">
          {xEnds.low}
        </span>
        <span className="text-[8px] text-[#757575]">← izq.</span>
      </span>
      <span
        className="pointer-events-none absolute right-2 top-1/2 z-[15] flex max-w-[88px] -translate-y-1/2 flex-col items-center gap-0.5 text-center sm:right-3 sm:max-w-[104px]"
        title={xAxisTitle}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#757575]">
          {xAxisTitle}
        </span>
        <span className="text-[11px] font-bold leading-tight text-[#1e1e1e] sm:text-xs">
          {xEnds.high}
        </span>
        <span className="text-[8px] text-[#757575]">der. →</span>
      </span>

      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none overflow-hidden rounded-[12px] border border-[#dcdcdc] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.8), transparent 42%), linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%)",
        }}
        role="application"
        aria-label={`Team matrix: ${xAxisTitle} por ${yAxisTitle}. Zoom y arrastre.`}
      >
        <div
          data-export-hide="true"
          className="absolute right-2 top-2 z-20 flex flex-col gap-1 rounded-full border border-white/40 bg-white/55 p-1 shadow-sm backdrop-blur-md"
        >
          <button
            type="button"
            className="rounded-full p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
            aria-label="Acercar"
            onClick={() => {
              const el = viewportRef.current;
              if (!el) return;
              const w = el.clientWidth;
              const h = el.clientHeight;
              const mx = w / 2;
              const my = h / 2;
              const prevZ = zoomRef.current;
              const prevP = panRef.current;
              const newZoom = clampZoom(prevZ * 1.2, getMinZoom(w, h));
              const wx = (mx - prevP.x) / prevZ;
              const wy = (my - prevP.y) / prevZ;
              const rawPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
              const newPan = clampPan(rawPan, newZoom, w, h);
              zoomRef.current = newZoom;
              panRef.current = newPan;
              setZoom(newZoom);
              setPan(newPan);
            }}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
            aria-label="Alejar"
            onClick={() => {
              const el = viewportRef.current;
              if (!el) return;
              const w = el.clientWidth;
              const h = el.clientHeight;
              const mx = w / 2;
              const my = h / 2;
              const prevZ = zoomRef.current;
              const prevP = panRef.current;
              const newZoom = clampZoom(prevZ / 1.2, getMinZoom(w, h));
              const wx = (mx - prevP.x) / prevZ;
              const wy = (my - prevP.y) / prevZ;
              const rawPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
              const newPan = clampPan(rawPan, newZoom, w, h);
              zoomRef.current = newZoom;
              panRef.current = newPan;
              setZoom(newZoom);
              setPan(newPan);
            }}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
            aria-label="Restablecer vista"
            onClick={resetView}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
            aria-label="Encajar todo (Shift+1)"
            title="Encajar todo (Shift+1)"
            onClick={() => frameNormRef.current(pointsRef.current.map((p) => ({ x: p.x, y: p.y })))}
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        {(() => {
          const row1 = [
            { key: "zoom" as const, label: "Rueda: zoom", status: hints.zoom },
            { key: "pan" as const, label: "Arrastra el fondo", status: hints.pan },
          ].filter((item) => item.status !== "gone");
          if (
            row1.length === 0 &&
            hints.card === "gone" &&
            !mapClusterMode
          ) {
            return null;
          }
          return (
            <div
              data-export-hide="true"
              className="pointer-events-none absolute bottom-2 left-2 z-20 max-w-[min(100%,280px)] text-[9px] leading-snug"
            >
              {row1.length > 0 ? (
                <p>
                  {row1.map((item, i) => (
                    <React.Fragment key={item.key}>
                      {i > 0 ? (
                        <span className="text-[#757575]"> · </span>
                      ) : null}
                      <HintItem status={item.status}>{item.label}</HintItem>
                    </React.Fragment>
                  ))}
                </p>
              ) : null}
              {hints.card !== "gone" ? (
                <p>
                  <HintItem status={hints.card}>
                    Arrastra ficha = posición manual
                  </HintItem>
                  {mapClusterMode ? (
                    <span className="text-[#757575]">
                      {" · Clic en círculo: acercar al grupo"}
                    </span>
                  ) : null}
                </p>
              ) : mapClusterMode ? (
                <p className="text-[#757575]">
                  Clic en círculo: acercar al grupo
                </p>
              ) : null}
            </div>
          );
        })()}

        {selectBox ? (
          <div
            data-export-hide="true"
            className="pointer-events-none absolute z-[16] rounded-[2px] border border-[#0d99ff] bg-[#0d99ff]/10"
            style={{
              left: selectBox.x,
              top: selectBox.y,
              width: selectBox.w,
              height: selectBox.h,
            }}
          />
        ) : null}

        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: CANVAS_WORLD_W,
            height: CANVAS_WORLD_H,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={onGridPointerDown}
            onPointerMove={onGridPointerMove}
            onPointerUp={onGridPointerUp}
            onPointerCancel={onGridPointerUp}
            aria-hidden
          >
            <div className="pointer-events-none absolute inset-0 z-0" style={FIGJAM_DOT_GRID} />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.52),_transparent_68%)]" />
            {showMatrixQuadrantColors ? (
              <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-2 grid-rows-2 gap-px bg-[#d9d9d9]/80">
                {quadrantColors.map((color, i) => (
                  <div
                    key={i}
                    className="min-h-0 min-w-0"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ) : null}

            <div className="pointer-events-none absolute left-1/2 top-3 z-[4] -translate-x-1/2 rounded border border-[#dcdcdc] bg-white/92 px-2 py-0.5 text-[10px] font-bold text-[#1e1e1e] shadow-sm backdrop-blur-sm">
              {yEnds.low}
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-[4] -translate-x-1/2 rounded border border-[#dcdcdc] bg-white/92 px-2 py-0.5 text-[10px] font-bold text-[#1e1e1e] shadow-sm backdrop-blur-sm">
              {yEnds.high}
            </div>
            <div className="pointer-events-none absolute left-3 top-1/2 z-[4] max-w-[min(140px,22vw)] -translate-y-1/2 rounded border border-[#dcdcdc] bg-white/92 px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-[#1e1e1e] shadow-sm backdrop-blur-sm">
              {xEnds.low}
            </div>
            <div className="pointer-events-none absolute right-3 top-1/2 z-[4] max-w-[min(140px,22vw)] -translate-y-1/2 rounded border border-[#dcdcdc] bg-white/92 px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-[#1e1e1e] shadow-sm backdrop-blur-sm">
              {xEnds.high}
            </div>
          </div>

          {clusters.map((c) => {
            if (c.metrics.length > 1) {
              const anySelected = c.metrics.some((m) => selectedIds.has(m.id));
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "pointer-events-auto absolute z-[6] flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-neutral-700 px-1.5 text-xs font-bold text-white shadow-lg transition-[transform,box-shadow,background-color] duration-150 ease-out hover:scale-[1.08] hover:bg-neutral-800 hover:shadow-[0_10px_24px_rgba(0,0,0,0.22)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/25 sm:text-sm",
                    anySelected && "ring-2 ring-[#0d99ff] ring-offset-2",
                  )}
                  style={{
                    left: c.x * CANVAS_WORLD_W,
                    top: c.y * CANVAS_WORLD_H,
                  }}
                  title={`${c.metrics.length} métricas — clic para acercar`}
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomToCluster(c.x, c.y);
                  }}
                >
                  {c.metrics.length}
                </button>
              );
            }

            const m = c.metrics[0]!;
            const dragging = dragPreview?.[m.id] != null;
            const rot = dragging ? 0 : hashRot(m.id);
            const selected = selectedIds.has(m.id);
            const glow = glowId === m.id;

            return (
              <button
                key={m.id}
                type="button"
                className={cn(
                  "pointer-events-auto absolute z-[6] touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/25",
                  METRIC_CARD_BASE,
                  dragging
                    ? "z-30 cursor-grabbing"
                    : "cursor-grab hover:z-20 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]",
                  selected
                    ? "z-10 ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-[#f5f5f5] border-[#0d99ff]/40"
                    : "hover:bg-white",
                )}
                style={{
                  left: c.x * CANVAS_WORLD_W,
                  top: c.y * CANVAS_WORLD_H,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                  // El glow entra rápido (120ms) y se desvanece suave (650ms).
                  transition: `box-shadow ${glow ? 120 : 650}ms ease-out, transform 150ms ease-out, border-color 220ms ease-out, background-color 220ms ease-out`,
                  ...metricCardBoxStyle({
                    metric: m,
                    selected,
                    colorByCategory: colorCardsByCategory,
                    glow,
                  }),
                }}
                title="Arrastra para colocar a mano · Clic para detalle"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  cancelPanAnim();
                  // Arrastre en grupo solo si la ficha ya forma parte de una
                  // selección múltiple; si no, se arrastra solo esta ficha.
                  const groupDrag = selectedIds.has(m.id) && selectedIds.size > 1;
                  const dragIds = groupDrag ? [...selectedIds] : [m.id];
                  const starts = new Map<string, { x: number; y: number }>();
                  for (const id of dragIds) {
                    starts.set(id, layoutMap.get(id) ?? { x: c.x, y: c.y });
                  }
                  liveDragNormRef.current = null;
                  cardDragRef.current = {
                    pointerId: e.pointerId,
                    id: m.id,
                    cx: e.clientX,
                    cy: e.clientY,
                    starts,
                    moved: false,
                  };
                  (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = cardDragRef.current;
                  if (!d || e.pointerId !== d.pointerId || d.id !== m.id) return;
                  const dx = e.clientX - d.cx;
                  const dy = e.clientY - d.cy;
                  if (Math.hypot(dx, dy) > 4) {
                    d.moved = true;
                    markHintHit("card");
                  }
                  const z = zoomRef.current;
                  const dnx = dx / z / CANVAS_WORLD_W;
                  const dny = dy / z / CANVAS_WORLD_H;
                  const preview: Record<string, { x: number; y: number }> = {};
                  for (const [id, start] of d.starts) {
                    preview[id] = {
                      x: Math.min(0.97, Math.max(0.03, start.x + dnx)),
                      y: Math.min(0.97, Math.max(0.03, start.y + dny)),
                    };
                  }
                  liveDragNormRef.current = preview;
                  setDragPreview(preview);
                }}
                onPointerUp={(e) => {
                  const d = cardDragRef.current;
                  if (!d || e.pointerId !== d.pointerId) return;
                  try {
                    (e.currentTarget as HTMLButtonElement).releasePointerCapture(
                      e.pointerId,
                    );
                  } catch {
                    /* noop */
                  }
                  if (d.id !== m.id) return;
                  cardDragRef.current = null;
                  setDragPreview(null);
                  const final = liveDragNormRef.current;
                  liveDragNormRef.current = null;
                  if (d.moved && final) {
                    const entries = Object.entries(final).map(([id, pos]) => ({
                      id,
                      pos,
                    }));
                    if (entries.length > 1) {
                      moveMetrics(entries);
                    } else if (entries[0]) {
                      setMetricPosition(entries[0].id, entries[0].pos);
                    }
                  } else if (!d.moved) {
                    onSelect(m, e.shiftKey || e.metaKey || e.ctrlKey);
                  }
                }}
                onPointerCancel={(e) => {
                  const d = cardDragRef.current;
                  if (d?.pointerId === e.pointerId) {
                    cardDragRef.current = null;
                    liveDragNormRef.current = null;
                    setDragPreview(null);
                  }
                }}
              >
                <MetricCardContent metric={m} />
              </button>
            );
          })}
        </div>
      </div>

      <MetricsDataTable
        open={dataTableOpen ?? false}
        onClose={() => onCloseDataTable?.()}
        axes={matrixAxes}
        rows={points}
      />
    </div>
  );
  },
);
FigJamBoard.displayName = "FigJamBoard";
