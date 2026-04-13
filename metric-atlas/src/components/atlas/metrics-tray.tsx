"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import { metricVizCategory, vizCategoryCardAccent, VIZ_LEGEND } from "@/lib/quadrant-viz";
import { cn } from "@/lib/utils";

function categoryMeta(metric: Metric) {
  const key = metricVizCategory(metric);
  return VIZ_LEGEND.find((item) => item.key === key);
}

export function MetricsTray({
  metrics,
  selectedId,
  onSelect,
}: {
  metrics: Metric[];
  selectedId: string | null;
  onSelect: (metric: Metric) => void;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metrics;
    return metrics.filter((metric) =>
      [metric.name, metric.shortName, metric.description, ...metric.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [metrics, query]);

  return (
    <section className="rounded-lg border border-[#e6e6e6] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
            Métricas
          </p>
          <p className="text-[11px] text-[#757575]">
            Selecciona una ficha para enfocarla en el canvas.
          </p>
        </div>
        <span className="rounded-md bg-[#f5f5f5] px-2 py-1 text-[10px] font-medium text-[#626262]">
          {filtered.length}
        </span>
      </div>

      <div className="mb-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar métrica"
          className="w-full rounded-md border border-[#e6e6e6] bg-[#fafafa] px-2.5 py-2 text-xs text-[#1e1e1e] outline-none placeholder:text-[#949494] focus:border-[#0d99ff]"
        />
      </div>

      <div className="max-h-[46dvh] space-y-2 overflow-y-auto pr-1">
        {filtered.map((metric) => {
          const meta = categoryMeta(metric);
          const selected = selectedId === metric.id;
          const accent = vizCategoryCardAccent(metricVizCategory(metric), { selected });

          return (
            <button
              key={metric.id}
              type="button"
              onClick={() => onSelect(metric)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition-[box-shadow,transform,border-color] duration-150 ease-out",
                selected
                  ? "shadow-[0_0_0_2px_rgba(13,153,255,0.18)]"
                  : "hover:translate-y-[-1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
              )}
              style={{
                backgroundColor: accent.backgroundColor,
                borderColor: selected ? "#0d99ff" : accent.borderColor,
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta?.color ?? "#9ca3af" }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium leading-[1.35] text-[#1e1e1e]">
                    {metric.shortName ?? metric.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-[#757575]">
                    {meta?.label ?? "Métrica"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#d8d8d8] px-3 py-4 text-center text-[11px] text-[#757575]">
            No hay métricas con esa búsqueda.
          </p>
        ) : null}
      </div>
    </section>
  );
}
