"use client";

import * as React from "react";
import { ArrowUpRight, BookOpenText, Search } from "lucide-react";
import type { Metric, MetricLayer, SourceType } from "@/lib/types";
import { METRIC_LAYERS, SOURCE_TYPES } from "@/lib/constants";
import { layerLabels } from "@/data/filters";
import { sourceLegend } from "@/data/legends";

const ALL_LAYERS = "all";
const ALL_SOURCES = "all";

type LayerValue = MetricLayer | typeof ALL_LAYERS;
type SourceValue = SourceType | typeof ALL_SOURCES;

function sourceLabel(value: SourceType) {
  return sourceLegend.find((item) => item.value === value)?.label ?? value;
}

export type MetricsFilters = ReturnType<typeof useMetricsFilters>;

export function useMetricsFilters(metrics: Metric[]) {
  const [query, setQuery] = React.useState("");
  const [layer, setLayer] = React.useState<LayerValue>(ALL_LAYERS);
  const [source, setSource] = React.useState<SourceValue>(ALL_SOURCES);

  const countsByLayer = React.useMemo(
    () =>
      Object.fromEntries(
        METRIC_LAYERS.map((item) => [
          item,
          metrics.filter((metric) => metric.layer === item).length,
        ]),
      ) as Record<MetricLayer, number>,
    [metrics],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return metrics.filter((metric) => {
      if (layer !== ALL_LAYERS && metric.layer !== layer) return false;
      if (source !== ALL_SOURCES && metric.sourcePrimary !== source) return false;
      if (!q) return true;
      const haystack = [
        metric.name,
        metric.shortName,
        metric.description,
        metric.whyItMatters,
        ...metric.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [layer, metrics, query, source]);

  return {
    query,
    setQuery,
    layer,
    setLayer,
    source,
    setSource,
    countsByLayer,
    filtered,
    total: metrics.length,
  };
}

/** Bloque 1: cabecera "Biblioteca de métricas" con descripción. */
export function MetricsHeaderCard() {
  return (
    <section className="rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-md bg-[#f0f7ff] px-2.5 py-1 text-[11px] font-medium text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]">
        <BookOpenText className="h-3.5 w-3.5" />
        Documentación
      </div>
      <h1 className="mt-3 text-[20px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1e1e1e]">
        Biblioteca de métricas
      </h1>
      <p className="mt-2 text-[12px] leading-[1.5] text-[#626262]">
        Un índice vivo para consultar qué medir, cómo obtener la señal y en
        qué contexto usar cada métrica.
      </p>
    </section>
  );
}

/** Bloque 2: navegación por capas con contadores. */
export function MetricsNavCard({
  filters,
}: {
  filters: MetricsFilters;
}) {
  const { layer, setLayer, total, countsByLayer } = filters;
  return (
    <section className="rounded-lg border border-[#e6e6e6] bg-white p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#757575]">
        Navegación
      </p>
      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={() => setLayer(ALL_LAYERS)}
          className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-[background-color,color,border-color] ${
            layer === ALL_LAYERS
              ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
              : "text-[#626262] hover:bg-[#f7f7f7]"
          }`}
        >
          <span>Todas las métricas</span>
          <span className="text-[10px]">{total}</span>
        </button>
        {METRIC_LAYERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLayer(item)}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-[background-color,color,border-color] ${
              layer === item
                ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
                : "text-[#626262] hover:bg-[#f7f7f7]"
            }`}
          >
            <span className="truncate leading-tight">{layerLabels[item]}</span>
            <span className="text-[10px]">{countsByLayer[item]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Bloque 3: buscador + selectores de capa y fuente. */
export function MetricsFiltersCard({
  filters,
}: {
  filters: MetricsFilters;
}) {
  const { query, setQuery, layer, setLayer, source, setSource } = filters;
  return (
    <section className="rounded-lg border border-[#e6e6e6] bg-white p-3 shadow-sm">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
            Buscar
          </span>
          <span className="flex items-center gap-2 rounded-md border border-[#e6e6e6] bg-[#f7f7f7] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#949494]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o tag"
              className="w-full bg-transparent text-xs text-[#1e1e1e] outline-none placeholder:text-[#949494]"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
            Capa
          </span>
          <select
            value={layer}
            onChange={(event) => setLayer(event.target.value as LayerValue)}
            className="w-full rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15"
          >
            <option value={ALL_LAYERS}>Todas las capas</option>
            {METRIC_LAYERS.map((item) => (
              <option key={item} value={item}>
                {layerLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
            Fuente principal
          </span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as SourceValue)}
            className="w-full rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15"
          >
            <option value={ALL_SOURCES}>Todas las fuentes</option>
            {SOURCE_TYPES.map((item) => (
              <option key={item} value={item}>
                {sourceLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

/** Cards principales: encabezado "Métricas documentadas" + grid de fichas. */
export function MetricsResultsGrid({
  filters,
  onOpenMetric,
}: {
  filters: MetricsFilters;
  onOpenMetric: (metric: Metric) => void;
}) {
  const { filtered } = filters;
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e6e6e6] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
              Biblioteca
            </p>
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1e1e1e]">
              Métricas documentadas
            </h2>
          </div>
          <p className="text-sm text-[#626262]">
            Recorre la lista como un catálogo y abre la ficha cuando necesites profundidad.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {filtered.map((metric) => (
          <article
            key={metric.id}
            className="group rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-[#d8eaff] bg-[#f0f7ff] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#0d99ff]">
                {layerLabels[metric.layer]}
              </span>
              <span className="rounded-md border border-[#ececec] bg-[#fafafa] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
                {sourceLabel(metric.sourcePrimary)}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-[18px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1e1e1e]">
                {metric.name}
              </h2>
              <p className="line-clamp-3 text-sm leading-[1.6] text-[#626262]">
                {metric.description}
              </p>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-[#444] sm:grid-cols-2">
              <div className="rounded-lg bg-[#fafafa] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#757575]">
                  Cómo medir
                </p>
                <p className="mt-1 line-clamp-2 leading-[1.5]">
                  {metric.howToMeasure[0] ?? "Sin detalle todavía"}
                </p>
              </div>
              <div className="rounded-lg bg-[#fafafa] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#757575]">
                  Uso recomendado
                </p>
                <p className="mt-1 leading-[1.5]">
                  {metric.dashboardIdeas?.[0] ??
                    metric.automationIdeas?.[0] ??
                    "Revisión y seguimiento documental"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-[#757575]">
                {metric.howToMeasure.length} formas de medir · {metric.tags.length} tags
              </p>
              <button
                type="button"
                onClick={() => onOpenMetric(metric)}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium tracking-[-0.01em] text-[#0d99ff] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f7ff] hover:translate-y-[-1px] active:translate-y-0"
              >
                Abrir ficha
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#d8d8d8] bg-white px-6 py-10 text-center">
          <p className="text-sm text-[#626262]">
            No hay métricas que coincidan con esta búsqueda. Prueba con otro
            término o limpia los filtros.
          </p>
        </section>
      ) : null}
    </div>
  );
}

