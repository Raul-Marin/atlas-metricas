"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Metric, MetricScoresMap } from "@/lib/types";
import { MATRIX_AXIS_OPTIONS } from "@/lib/matrix-axes";
import { metricColor, metricDimValue } from "./chart-data";

/**
 * Vista "Radar por métrica": el perfil multidimensional de una métrica del
 * canvas (todas las dimensiones a la vez). Selector para elegir cuál.
 */
export function MetricRadarView({
  metrics,
  metricScores,
  selectedId,
}: {
  metrics: Metric[];
  metricScores: MetricScoresMap;
  selectedId?: string | null;
}) {
  const [pickedId, setPickedId] = React.useState<string | null>(
    selectedId ?? metrics[0]?.id ?? null,
  );

  // Mantén una métrica válida seleccionada si cambia el conjunto.
  React.useEffect(() => {
    if (!pickedId || !metrics.some((m) => m.id === pickedId)) {
      setPickedId(selectedId ?? metrics[0]?.id ?? null);
    }
  }, [metrics, pickedId, selectedId]);

  const picked = metrics.find((m) => m.id === pickedId) ?? null;
  const color = picked ? metricColor(picked) : "#0d99ff";

  const data = React.useMemo(() => {
    if (!picked) return [];
    return MATRIX_AXIS_OPTIONS.map((opt) => ({
      dim: opt.label,
      value: metricDimValue(picked, opt.id, metricScores),
    }));
  }, [picked, metricScores]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#eee] px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#757575]">
          Radar de
        </span>
        <select
          value={pickedId ?? ""}
          onChange={(e) => setPickedId(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] sm:max-w-[280px]"
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shortName ?? m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1">
        {picked ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="#e6e6e6" />
              <PolarAngleAxis
                dataKey="dim"
                tick={{ fontSize: 11, fill: "#626262" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                angle={90}
                tick={{ fontSize: 9, fill: "#bbb" }}
              />
              <Radar
                name={picked.shortName ?? picked.name}
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.32}
              />
              <Tooltip
                formatter={(value) => [`${value}/100`, "Valor"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e6e6e6",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-[#949494]">
            No hay métricas en el canvas para mostrar.
          </p>
        )}
      </div>
    </div>
  );
}
