import Link from "next/link";
import type { Metric } from "@/lib/types";
import { getMetricById } from "@/lib/metrics-data";

export function RelatedMetrics({
  relatedMetricIds,
}: {
  relatedMetricIds: string[];
}) {
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
          <Link
            href={`/metrics/${id}`}
            className="group flex flex-col rounded-lg border border-[#e6e6e6] bg-[#fafafa] px-3 py-2 transition-[background-color,border-color,transform] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#bde3ff] hover:bg-[#f7fbff]"
          >
            <span className="text-sm font-medium text-[#1e1e1e] group-hover:text-[#0d99ff]">
              {m.name}
            </span>
            <span className="line-clamp-2 text-xs text-[#757575]">
              {m.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
