"use client";

import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import type { Metric } from "@/lib/types";
import { sourceLegend } from "@/data/legends";
import { cn } from "@/lib/utils";

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
        {title}
      </h3>
      <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-[1.55] text-[#444]">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function MetricInsightPanel({
  metric,
  onClose,
  className,
}: {
  metric: Metric | null;
  onClose: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-[#e6e6e6] bg-white shadow-[inset_1px_0_0_rgba(0,0,0,0.04)]",
        "w-full max-md:fixed max-md:inset-0 max-md:z-30 max-md:max-w-none md:w-[min(100%,360px)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
          Cómo hacerla / extraerla
        </span>
        {metric ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#757575] hover:bg-[#f5f5f5]"
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!metric ? (
          <p className="max-w-[28ch] text-sm leading-[1.55] text-[#757575]">
            Toca una tarjeta en el mapa 2×2. Aquí verás cómo medirla, con qué
            fuentes y ideas de automatización.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-[20px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1e1e1e]">
                {metric.name}
              </h2>
              <p className="mt-2.5 text-[14px] leading-[1.55] text-[#626262]">
                {metric.description}
              </p>
            </div>

            <div className="rounded-md bg-[#f7f7f7] px-3 py-2.5 text-[12px] leading-[1.5] text-[#626262]">
              <span className="font-medium text-[#1e1e1e]">Por qué importa: </span>
              {metric.whyItMatters}
            </div>

            <ListBlock title="Cómo medirla / extraer datos" items={metric.howToMeasure} />

            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
                Fuentes
              </h3>
              <p className="text-[13px] leading-[1.5] text-[#444]">
                <span className="font-medium">Principal: </span>
                {sourceLegend.find((s) => s.value === metric.sourcePrimary)?.label ??
                  metric.sourcePrimary}
              </p>
              {metric.sourceSecondary?.length ? (
                <p className="text-[13px] leading-[1.5] text-[#444]">
                  <span className="font-medium">Secundarias: </span>
                  {metric.sourceSecondary
                    .map(
                      (s) => sourceLegend.find((x) => x.value === s)?.label ?? s,
                    )
                    .join(", ")}
                </p>
              ) : null}
            </div>

            <ListBlock title="Automatización" items={metric.automationIdeas} />
            <ListBlock title="Riesgos / sesgos" items={metric.risksBiases} />

            <Link
              href={`/metrics/${metric.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-sm font-medium tracking-[-0.01em] text-[#1e1e1e] shadow-sm hover:bg-[#f7f7f7]"
            >
              Ficha completa
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
