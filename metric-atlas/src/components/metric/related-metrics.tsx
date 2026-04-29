"use client";

import type { Metric } from "@/lib/types";
import { useMetrics } from "@/lib/metrics/provider";

export function RelatedMetrics({
  relatedMetricIds,
  onOpenMetric,
}: {
  relatedMetricIds: string[];
  onOpenMetric: (metric: Metric) => void;
}) {
  const { getMetricById } = useMetrics();
  const resolved = relatedMetricIds
    .map((id) => ({ id, m: getMetricById(id) }))
    .filter((x): x is { id: string; m: Metric } => Boolean(x.m));

  if (resolved.length === 0) {
    return (
      <p className="text-sm text-[#757575]">
        Aún sin enlaces en el dataset.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {resolved.map(({ id, m }) => (
        <li key={id}>
          <button
            type="button"
            onClick={() => onOpenMetric(m)}
            className="group flex w-full flex-col rounded-lg border border-[#e6e6e6] bg-[#fafafa] px-3 py-2 text-left transition-[background-color,border-color,transform] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#bde3ff] hover:bg-[#f7fbff]"
          >
            <span className="text-sm font-medium text-[#1e1e1e] group-hover:text-[#0d99ff]">
              {m.name}
            </span>
            <span className="line-clamp-2 text-xs text-[#757575]">
              {m.description}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
