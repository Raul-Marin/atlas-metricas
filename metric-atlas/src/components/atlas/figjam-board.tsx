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
import {
  metricVizCategory,
  vizCategoryCardAccent,
  VIZ_LEGEND,
  type VizCategory,
} from "@/lib/quadrant-viz";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw } from "lucide-react";

/** Tamaño lógico del canvas (px); el mapa ocupa todo el rectángulo y puedes desplazarte fuera. */
const CANVAS_WORLD_W = 5600;
const CANVAS_WORLD_H = 4200;

/** Cuadrantes TL, TR, BL, BR — refuerzan la lectura 2×2 sin cerrar el canvas. */
const MATRIX_QUADRANT_TINTS = [
  "rgba(129, 140, 248, 0.11)",
  "rgba(251, 146, 60, 0.1)",
  "rgba(45, 212, 191, 0.1)",
  "rgba(250, 204, 21, 0.12)",
] as const;

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

function VizShape({
  shape,
  color,
  size = 11,
}: {
  shape: (typeof VIZ_LEGEND)[number]["shape"];
  color: string;
  size?: number;
}) {
  const s = size;
  switch (shape) {
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path d="M6 1 L11 6 L6 11 L1 6 Z" fill={color} />
        </svg>
      );
    case "pentagon":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path d="M6 1 L10.2 4.3 L8.8 9.5 L3.2 9.5 L1.8 4.3 Z" fill={color} />
        </svg>
      );
    case "bag":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path
            d="M3 4h6l.5 6.5c0 .8-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.7-1.5-1.5L3 4z M4 4V3.5C4 2.1 5 1 6.5 1S9 2.1 9 3.5V4"
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1" fill={color} />
        </svg>
      );
    case "circle":
    case "dot":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <circle cx="6" cy="6" r={shape === "dot" ? 4.5 : 5} fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

function shapeFor(cat: VizCategory) {
  const row = VIZ_LEGEND.find((l) => l.key === cat);
  if (!row) return null;
  return <VizShape shape={row.shape} color={row.color} size={12} />;
}

function LegendFloat() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[200px] rounded-xl border border-[#e6e6e6] bg-white/96 p-3 text-[10px] shadow-md backdrop-blur-sm">
      <p className="mb-2 font-semibold uppercase tracking-wide text-[#757575]">
        Tipos
      </p>
      <ul className="space-y-1 text-[#444]">
        {VIZ_LEGEND.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <VizShape shape={row.shape} color={row.color} size={10} />
            {row.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FigJamBoard({
  metrics,
  selectedId,
  onSelect,
}: {
  metrics: Metric[];
  selectedId: string | null;
  onSelect: (m: Metric) => void;
}) {
  const {
    matrixAxes,
    colorCardsByCategory,
    showMatrixQuadrantColors,
    mapClusterMode,
    metricManualPositions,
    setMetricManualPosition,
  } = useAtlasFilters();

  const [dragPreview, setDragPreview] = React.useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const cardDragRef = React.useRef<{
    pointerId: number;
    id: string;
    cx: number;
    cy: number;
    nx: number;
    ny: number;
    moved: boolean;
  } | null>(null);
  const liveDragNormRef = React.useRef<{ x: number; y: number } | null>(null);
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

  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

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

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevZ = zoomRef.current;
      const prevP = panRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.11;
      const newZoom = clampZoom(prevZ * factor);
      const wx = (mx - prevP.x) / prevZ;
      const wy = (my - prevP.y) / prevZ;
      const newPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
      zoomRef.current = newZoom;
      panRef.current = newPan;
      setZoom(newZoom);
      setPan(newPan);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  const zoomToCluster = React.useCallback((nx: number, ny: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const prevZ = zoomRef.current;
    const newZoom = clampZoom(prevZ * 1.45);
    const cx = nx * CANVAS_WORLD_W;
    const cy = ny * CANVAS_WORLD_H;
    const newPan = { x: w / 2 - cx * newZoom, y: h / 2 - cy * newZoom };
    zoomRef.current = newZoom;
    panRef.current = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }, []);

  const resetView = React.useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
    centerCamera();
  }, [centerCamera]);

  const onGridPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = panRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      panX: p.x,
      panY: p.y,
    };
  };

  const onGridPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const next = { x: d.panX + dx, y: d.panY + dy };
    panRef.current = next;
    setPan(next);
  };

  const onGridPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const layoutMap = React.useMemo(
    () => resolveMetricLayout(metrics, matrixAxes, metricManualPositions),
    [matrixAxes, metricManualPositions, metrics],
  );

  React.useEffect(() => {
    if (!selectedId) return;
    const el = viewportRef.current;
    const pos = layoutMap.get(selectedId);
    if (!el || !pos) return;
    const z = zoomRef.current;
    const next = {
      x: el.clientWidth / 2 - pos.x * CANVAS_WORLD_W * z,
      y: el.clientHeight / 2 - pos.y * CANVAS_WORLD_H * z,
    };
    panRef.current = next;
    setPan(next);
  }, [layoutMap, selectedId]);

  const points: MapPoint[] = React.useMemo(
    () =>
      metrics.map((m) => {
        const base = layoutMap.get(m.id) ?? { x: 0.5, y: 0.5 };
        const d = dragPreview?.id === m.id ? dragPreview : null;
        return {
          id: m.id,
          x: d ? d.x : base.x,
          y: d ? d.y : base.y,
          metric: m,
        };
      }),
    [dragPreview, layoutMap, metrics],
  );

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

      <div className="pointer-events-none absolute left-1/2 top-9 z-[15] -translate-x-1/2 rounded-md border border-[#e6e6e6] bg-white/92 px-2 py-1 text-center shadow-sm backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#757575]">
          Team matrix
        </p>
        <p className="text-[10px] font-medium text-[#1e1e1e]">
          <span className="text-[#555]">{xAxisTitle}</span>
          <span className="mx-1 text-[#b3b3b3]">×</span>
          <span className="text-[#555]">{yAxisTitle}</span>
        </p>
      </div>

      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none overflow-hidden rounded-[24px] border border-[#dcdcdc] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.8), transparent 42%), linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%)",
        }}
        role="application"
        aria-label={`Team matrix: ${xAxisTitle} por ${yAxisTitle}. Zoom y arrastre.`}
      >
        <div className="absolute right-2 top-2 z-20 flex flex-col gap-1 rounded-lg border border-[#e6e6e6] bg-white/96 p-1 shadow-sm">
          <button
            type="button"
            className="rounded p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
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
              const newZoom = clampZoom(prevZ * 1.2);
              const wx = (mx - prevP.x) / prevZ;
              const wy = (my - prevP.y) / prevZ;
              const newPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
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
            className="rounded p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
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
              const newZoom = clampZoom(prevZ / 1.2);
              const wx = (mx - prevP.x) / prevZ;
              const wy = (my - prevP.y) / prevZ;
              const newPan = { x: mx - wx * newZoom, y: my - wy * newZoom };
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
            className="rounded p-1.5 text-[#626262] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20"
            aria-label="Restablecer vista"
            onClick={resetView}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <p className="pointer-events-none absolute bottom-2 left-2 z-20 max-w-[min(100%,280px)] text-[9px] leading-snug text-[#757575]">
          Cuadrantes = matriz 2×2 · Rueda: zoom · Arrastra el fondo · Arrastra ficha =
          posición manual
          {mapClusterMode ? " · Clic en círculo: acercar al grupo" : null}
        </p>

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
                {MATRIX_QUADRANT_TINTS.map((tint, i) => (
                  <div
                    key={i}
                    className="min-h-0 min-w-0"
                    style={{
                      background:
                        `linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04)), ${tint}`,
                    }}
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
              const anySelected = c.metrics.some((m) => m.id === selectedId);
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
            const cat = metricVizCategory(m);
            const legendRow = VIZ_LEGEND.find((row) => row.key === cat);
            const label = m.shortName ?? m.name;
            const dragging = dragPreview?.id === m.id;
            const rot = dragging ? 0 : hashRot(m.id);
            const selected = selectedId === m.id;
            const accentColor = legendRow?.color ?? "#9ca3af";
            const cardAccent = colorCardsByCategory
              ? vizCategoryCardAccent(cat, { selected })
              : undefined;

            return (
              <button
                key={m.id}
                type="button"
                className={cn(
                  "pointer-events-auto absolute z-[6] w-[220px] touch-none rounded-xl border px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-[box-shadow,transform,border-color,background-color] duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/25",
                  dragging
                    ? "z-30 cursor-grabbing shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
                    : "cursor-grab hover:z-20 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]",
                  "border-[#cfc7bb] bg-white",
                  selected
                    ? cn(
                        "z-10 ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-[#f5f5f5]",
                        "border-[#0d99ff]/40",
                      )
                    : "hover:bg-white",
                )}
                style={{
                  left: c.x * CANVAS_WORLD_W,
                  top: c.y * CANVAS_WORLD_H,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                  backgroundColor: colorCardsByCategory
                    ? selected
                      ? cardAccent?.backgroundColor
                      : "rgba(255,255,255,0.94)"
                    : "#fffdf9",
                  borderColor: selected
                    ? "#0d99ff"
                    : colorCardsByCategory
                      ? cardAccent?.borderColor
                      : "#cfc7bb",
                  boxShadow: colorCardsByCategory
                    ? `inset 5px 0 0 ${accentColor}, 0 6px 18px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.85)`
                    : "0 6px 18px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.88)",
                }}
                title="Arrastra para colocar a mano · Clic para detalle"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  const pos = layoutMap.get(m.id) ?? { x: c.x, y: c.y };
                  liveDragNormRef.current = null;
                  cardDragRef.current = {
                    pointerId: e.pointerId,
                    id: m.id,
                    cx: e.clientX,
                    cy: e.clientY,
                    nx: pos.x,
                    ny: pos.y,
                    moved: false,
                  };
                  (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = cardDragRef.current;
                  if (!d || e.pointerId !== d.pointerId || d.id !== m.id) return;
                  const dx = e.clientX - d.cx;
                  const dy = e.clientY - d.cy;
                  if (Math.hypot(dx, dy) > 4) d.moved = true;
                  const z = zoomRef.current;
                  const dnx = dx / z / CANVAS_WORLD_W;
                  const dny = dy / z / CANVAS_WORLD_H;
                  const nx = Math.min(0.97, Math.max(0.03, d.nx + dnx));
                  const ny = Math.min(0.97, Math.max(0.03, d.ny + dny));
                  liveDragNormRef.current = { x: nx, y: ny };
                  setDragPreview({ id: m.id, x: nx, y: ny });
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
                    setMetricManualPosition(m.id, final);
                  } else if (!d.moved) {
                    onSelect(m);
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
                <span className="pointer-events-none block">
                  <span className="mb-1 flex items-center gap-2">
                    <span className="mt-0.5">{shapeFor(cat)}</span>
                    <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
                      {legendRow?.label ?? "Métrica"}
                    </span>
                  </span>
                  <span className="block text-[13px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#1e1e1e]">
                    {label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {metrics.length === 0 ? (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-[#757575]">
          Ninguna métrica con estos filtros. Ajusta variables a la izquierda.
        </p>
      ) : null}
    </div>
  );
}
