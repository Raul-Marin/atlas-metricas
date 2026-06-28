"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import { metricVizCategory, VIZ_LEGEND } from "@/lib/quadrant-viz";
import { getMetricIcon } from "@/data/metric-icons";
import { cn } from "@/lib/utils";
import { MetricCanvasCard } from "./metric-card";

function vizColor(metric: Metric) {
  const key = metricVizCategory(metric);
  return VIZ_LEGEND.find((item) => item.key === key)?.color ?? "#9ca3af";
}

export function MetricsTray({
  metrics,
  selectedId,
  excludedIds,
  onSelect,
  onMetricPointerDown,
  cardColorByCategory = false,
  variant = "card",
}: {
  metrics: Metric[];
  selectedId: string | null;
  excludedIds?: string[];
  onSelect: (metric: Metric) => void;
  /** Si se pasa, las fichas se pueden arrastrar al canvas (clic sin mover = onSelect). */
  onMetricPointerDown?: (metric: Metric, e: React.PointerEvent) => void;
  /** Refleja el color de fichas del canvas en la preview (para que coincida). */
  cardColorByCategory?: boolean;
  variant?: "card" | "flat";
}) {
  const [query, setQuery] = React.useState("");
  const sectionRef = React.useRef<HTMLElement>(null);
  const [hover, setHover] = React.useState<{ metric: Metric; top: number } | null>(
    null,
  );
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const flat = variant === "flat";
  const canHover = !!onMetricPointerDown;

  const clearHover = React.useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(null);
  }, []);

  const scheduleHover = (metric: Metric, el: HTMLElement) => {
    if (!canHover) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    const rect = el.getBoundingClientRect();
    const top = rect.top + rect.height / 2;
    hoverTimer.current = setTimeout(() => setHover({ metric, top }), 160);
  };

  React.useEffect(() => () => clearHover(), [clearHover]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "flex min-h-0 flex-col",
        flat
          ? "h-full"
          : "rounded-lg border border-[#e6e6e6] bg-white p-3 shadow-sm",
      )}
    >
      <div className="mb-3 shrink-0">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar métrica"
          className="w-full rounded-md border border-[#e6e6e6] bg-[#fafafa] px-2.5 py-2 text-xs text-[#1e1e1e] outline-none placeholder:text-[#949494] focus:border-[#0d99ff]"
        />
      </div>

      <div
        className={cn(
          "grid grid-cols-3 gap-1.5 overflow-y-auto pr-1",
          flat ? "min-h-0 flex-1" : "max-h-[46dvh]",
        )}
      >
        {filtered.map((metric) => {
          const selected = selectedId === metric.id;
          const excluded = excludedIds?.includes(metric.id) ?? false;
          const placed = !excluded; // ya está en el canvas
          // Solo las que NO están colocadas se pueden arrastrar/añadir.
          const draggable = !!onMetricPointerDown && excluded;
          const Icon = getMetricIcon(metric.id);

          return (
            <button
              key={metric.id}
              type="button"
              onClick={draggable ? undefined : () => onSelect(metric)}
              onPointerDown={
                draggable
                  ? (e) => {
                      clearHover();
                      if (e.button === 0) onMetricPointerDown!(metric, e);
                    }
                  : undefined
              }
              onKeyDown={
                draggable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(metric);
                      }
                    }
                  : undefined
              }
              onMouseEnter={(e) => scheduleHover(metric, e.currentTarget)}
              onMouseLeave={clearHover}
              title={
                placed
                  ? "Ya en el canvas · clic para localizarla"
                  : "Arrastra al canvas · clic para añadir"
              }
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-1 text-center transition-[box-shadow,transform,border-color,opacity] duration-150 ease-out",
                selected
                  ? "border-[#0d99ff] bg-white shadow-[0_0_0_2px_rgba(13,153,255,0.18)]"
                  : placed
                    ? "border-[#ececec] bg-[#fafafa] opacity-55 hover:border-[#d9d9d9] hover:opacity-100"
                    : "border-[#e6e6e6] bg-white hover:translate-y-[-1px] hover:border-[#d4d4d4] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{ color: vizColor(metric) }}
                  aria-hidden
                />
              </span>
              <span className="line-clamp-2 w-full text-[9px] font-medium leading-[1.15] text-[#1e1e1e]">
                {metric.shortName ?? metric.name}
              </span>
            </button>
          );
        })}

        {filtered.length === 0 ? (
          <p className="col-span-3 rounded-md border border-dashed border-[#d8d8d8] px-3 py-4 text-center text-[11px] text-[#757575]">
            No hay métricas con esa búsqueda.
          </p>
        ) : null}
      </div>

      {canHover && hover ? (
        <div
          className="pointer-events-none fixed z-50 -translate-y-1/2"
          style={{
            left: (sectionRef.current?.getBoundingClientRect().right ?? 248) + 14,
            top: hover.top,
          }}
        >
          <MetricCanvasCard
            metric={hover.metric}
            colorByCategory={cardColorByCategory}
            className="shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
          />
        </div>
      ) : null}
    </section>
  );
}
