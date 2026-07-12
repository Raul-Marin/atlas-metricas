"use client";

import { X, ExternalLink } from "lucide-react";
import type { Metric } from "@/lib/types";
import { sourceLegend } from "@/data/legends";
import { cn } from "@/lib/utils";

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
        {title}
      </h3>
      <ul className="list-inside list-disc space-y-1.5 text-[12px] leading-[1.55] text-[#444]">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-md border border-[#eee] bg-[#fafafa] px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#949494]">
        {label}
      </div>
      <div className="mt-0.5 text-[11px] leading-tight text-[#1e1e1e]">{value}</div>
    </div>
  );
}

export function MetricInsightPanel({
  metric,
  onClose,
  onOpenFullCard,
  className,
}: {
  metric: Metric | null;
  onClose: () => void;
  onOpenFullCard?: (metric: Metric) => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-[#e6e6e6] bg-white shadow-[inset_1px_0_0_rgba(0,0,0,0.04)]",
        "w-full max-md:fixed max-md:inset-0 max-md:z-30 max-md:max-w-none md:w-[248px]",
        className,
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#e6e6e6] px-3">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
          Cómo hacerla / extraerla
        </span>
        {metric ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!metric ? (
          <p className="max-w-[28ch] text-[12px] leading-[1.55] text-[#757575]">
            Toca una tarjeta en el mapa 2×2. Aquí verás cómo medirla, con qué
            fuentes y ideas de automatización.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-[17px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1e1e1e]">
                {metric.name}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.55] text-[#626262]">
                {metric.description}
              </p>
            </div>

            <div className="rounded-md bg-[#f7f7f7] px-3 py-2.5 text-[11px] leading-[1.5] text-[#626262]">
              <span className="font-medium text-[#1e1e1e]">Por qué importa: </span>
              {metric.whyItMatters}
            </div>

            <ListBlock title="Cómo medirla / extraer datos" items={metric.howToMeasure} />

            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
                Fuentes
              </h3>
              <p className="text-[12px] leading-[1.5] text-[#444]">
                <span className="font-medium">Principal: </span>
                {sourceLegend.find((s) => s.value === metric.sourcePrimary)?.label ??
                  metric.sourcePrimary}
              </p>
              {metric.sourceSecondary?.length ? (
                <p className="text-[12px] leading-[1.5] text-[#444]">
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

            {metric.ficha?.frecuencia ||
            metric.ficha?.esfuerzo ||
            metric.ficha?.confianza ? (
              <div className="grid grid-cols-3 gap-2">
                <MetaChip label="Frecuencia" value={metric.ficha?.frecuencia} />
                <MetaChip label="Esfuerzo" value={metric.ficha?.esfuerzo} />
                <MetaChip label="Confianza" value={metric.ficha?.confianza} />
              </div>
            ) : null}

            <ListBlock title="Mejor cruzarla con" items={metric.ficha?.cruzarCon} />
            <ListBlock title="Audiencia" items={metric.ficha?.audience} />

            {metric.ficha?.decision ? (
              <div className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
                  Decisión que permite tomar
                </h3>
                <p className="text-[12px] leading-[1.55] text-[#444]">
                  {metric.ficha.decision}
                </p>
              </div>
            ) : null}

            {onOpenFullCard ? (
              <button
                type="button"
                onClick={() => onOpenFullCard(metric)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-[13px] font-medium tracking-[-0.01em] text-[#1e1e1e] shadow-sm hover:bg-[#f7f7f7]"
              >
                Ficha completa
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
