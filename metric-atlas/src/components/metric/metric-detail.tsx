import type { Metric } from "@/lib/types";
import { sourceLegend } from "@/data/legends";
import { MetricBadges } from "./metric-badges";
import { RelatedMetrics } from "./related-metrics";

function ListSection({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;
  return (
    <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
        {title}
      </h2>
      <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-[1.6] text-[#444]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function MetricDetail({ metric }: { metric: Metric }) {
  const primaryLabel =
    sourceLegend.find((s) => s.value === metric.sourcePrimary)?.label ??
    metric.sourcePrimary;
  const secondaryLabels =
    metric.sourceSecondary?.map(
      (s) => sourceLegend.find((x) => x.value === s)?.label ?? s,
    ) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-lg border border-[#e6e6e6] bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
              Ficha documental
            </p>
            <h1 className="mt-2 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#1e1e1e]">
              {metric.name}
            </h1>
          </div>
          <MetricBadges metric={metric} />
          <p className="max-w-[70ch] text-[16px] leading-[1.6] text-[#626262]">
            {metric.description}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Por qué importa
            </h2>
            <p className="mt-3 text-sm leading-[1.65] text-[#444]">
              {metric.whyItMatters}
            </p>
          </section>

          <ListSection title="Cómo se mide" items={metric.howToMeasure} />
          <ListSection title="Ideas de dashboard" items={metric.dashboardIdeas} />
          <ListSection title="Ideas de automatización" items={metric.automationIdeas} />
          <ListSection title="Riesgos o sesgos" items={metric.risksBiases} />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Fuentes
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-[1.6] text-[#444]">
              <p>
                <span className="font-medium text-[#1e1e1e]">Principal:</span> {primaryLabel}
              </p>
              {secondaryLabels.length > 0 ? (
                <p>
                  <span className="font-medium text-[#1e1e1e]">Secundarias:</span>{" "}
                  {secondaryLabels.join(", ")}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Tags
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#626262]">
              {metric.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-[#e6e6e6] bg-[#fafafa] px-2 py-1"
                >
                  #{t}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Métricas relacionadas
            </h2>
            <div className="mt-3">
              <RelatedMetrics relatedMetricIds={metric.relatedMetricIds} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
