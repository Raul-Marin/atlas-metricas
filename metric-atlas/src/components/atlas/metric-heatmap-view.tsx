"use client";

import * as React from "react";
import type { Metric, MetricScoresMap } from "@/lib/types";
import { MATRIX_AXIS_OPTIONS } from "@/lib/matrix-axes";
import { metricDimValue } from "./chart-data";

/**
 * Vista "Heatmap": tabla métricas × dimensiones; el color de cada celda
 * codifica el valor (0–100). Vista de conjunto de todos los scores.
 */
export function MetricHeatmapView({
  metrics,
  metricScores,
}: {
  metrics: Metric[];
  metricScores: MetricScoresMap;
}) {
  if (metrics.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-xs text-[#949494]">
        No hay métricas en el canvas para mostrar.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-white p-3">
      <table className="border-separate border-spacing-[2px] text-[10px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[2] bg-white px-2 py-1 text-left align-bottom" />
            {MATRIX_AXIS_OPTIONS.map((o) => (
              <th key={o.id} className="px-1 align-bottom">
                <span className="block h-[96px] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[9px] font-medium uppercase tracking-wide text-[#757575]">
                  {o.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.id}>
              <td className="sticky left-0 z-[1] max-w-[160px] truncate bg-white px-2 py-1 text-left text-[11px] text-[#1e1e1e]">
                {m.shortName ?? m.name}
              </td>
              {MATRIX_AXIS_OPTIONS.map((o) => {
                const v = metricDimValue(m, o.id, metricScores);
                return (
                  <td
                    key={o.id}
                    title={`${m.shortName ?? m.name} · ${o.label}: ${v}`}
                    className="h-7 w-9 rounded-[3px] text-center tabular-nums"
                    style={{
                      backgroundColor: `rgba(13,153,255,${0.06 + (v / 100) * 0.82})`,
                      color: v > 55 ? "#ffffff" : "#1e1e1e",
                    }}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
