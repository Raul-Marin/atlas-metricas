"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import type { MatrixBoard } from "@/lib/matrix-boards";
import { filterMetrics } from "@/lib/filters";
import { resolveMetricLayout } from "@/lib/metric-layout";
import { metricVizCategory, VIZ_LEGEND } from "@/lib/quadrant-viz";
import { cn } from "@/lib/utils";

function vizColor(m: Metric): string {
  return VIZ_LEGEND.find((row) => row.key === metricVizCategory(m))?.color ?? "#9ca3af";
}

/**
 * Mini-preview fiel del board: coloca cada métrica visible en su posición real
 * (ejes + posiciones manuales) como un punto coloreado por categoría, sobre los
 * cuadrantes. Reemplaza al color plano del thumbnail.
 */
export function BoardThumbnailPreview({
  board,
  metrics,
  className,
  fallbackColor,
}: {
  board: MatrixBoard;
  metrics: Metric[];
  className?: string;
  fallbackColor?: string;
}) {
  const dots = React.useMemo(() => {
    const visible = filterMetrics(metrics, board.canvas.filters).filter(
      (m) => !board.canvas.excludedMetricIds.includes(m.id),
    );
    if (visible.length === 0) return [];
    const layout = resolveMetricLayout(
      visible,
      board.canvas.matrixAxes,
      board.canvas.metricScores,
    );
    return visible.map((m) => {
      const pos = layout.get(m.id) ?? { x: 0.5, y: 0.5 };
      return { id: m.id, x: pos.x, y: pos.y, color: vizColor(m) };
    });
  }, [board.canvas, metrics]);

  return (
    <div
      className={cn("relative overflow-hidden bg-[#f7f7f7]", className)}
      style={
        fallbackColor && dots.length === 0
          ? { backgroundColor: fallbackColor }
          : undefined
      }
      aria-hidden
    >
      {board.canvas.showMatrixQuadrantColors ? (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {board.canvas.quadrantColors.map((color, i) => (
            <div key={i} style={{ backgroundColor: color }} />
          ))}
        </div>
      ) : null}
      {/* Líneas guía centrales del 2×2 */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/[0.06]" />
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/[0.06]" />
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/70"
          style={{
            left: `${d.x * 100}%`,
            top: `${d.y * 100}%`,
            backgroundColor: d.color,
          }}
        />
      ))}
      {dots.length === 0 ? (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-[#b0b0b0]">
          Matrix vacía
        </span>
      ) : null}
    </div>
  );
}
