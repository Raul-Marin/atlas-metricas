"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatrixAxisId, Metric, MetricScoresMap } from "@/lib/types";
import { MATRIX_AXIS_OPTIONS, axisEndLabels } from "@/lib/matrix-axes";
import { metricColor, metricDimValue } from "./chart-data";

/**
 * Vista "Ranking": las métricas del canvas ordenadas por una dimensión, en
 * barras horizontales (la priorización accionable). Selector de dimensión.
 */
export function MetricRankingView({
  metrics,
  metricScores,
}: {
  metrics: Metric[];
  metricScores: MetricScoresMap;
}) {
  const [axisId, setAxisId] = React.useState<MatrixAxisId>("impacto");

  const data = React.useMemo(
    () =>
      metrics
        .map((m) => ({
          id: m.id,
          name: m.shortName ?? m.name,
          value: metricDimValue(m, axisId, metricScores),
          color: metricColor(m),
        }))
        .sort((a, b) => b.value - a.value),
    [metrics, axisId, metricScores],
  );

  const ends = axisEndLabels(axisId);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#eee] px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#757575]">
          Ordenar por
        </span>
        <select
          value={axisId}
          onChange={(e) => setAxisId(e.target.value as MatrixAxisId)}
          className="min-w-0 rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff]"
        >
          {MATRIX_AXIS_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-[#949494]">
          0 = {ends.low} · 100 = {ends.high}
        </span>
      </div>

      <div className="min-h-0 flex-1 py-2">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-xs text-[#949494]">
            No hay métricas en el canvas para mostrar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 28, bottom: 4, left: 8 }}
              barCategoryGap={3}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#949494" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 10, fill: "#444" }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                formatter={(value) => [`${value}/100`, "Valor"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e6e6e6",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((d) => (
                  <Cell key={d.id} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
