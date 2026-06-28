"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import {
  metricVizCategory,
  vizCategoryCardAccent,
  VIZ_LEGEND,
  type VizCategory,
} from "@/lib/quadrant-viz";
import { getMetricIcon } from "@/data/metric-icons";
import { cn } from "@/lib/utils";

/** Ancho lógico de la ficha del canvas (px). */
export const METRIC_CARD_WIDTH = 220;

/** Clases base de la caja de la ficha (compartidas por canvas, preview y fantasma). */
export const METRIC_CARD_BASE = "w-[220px] rounded-xl border px-3 py-2.5 text-left";

export function VizShape({
  shape,
  color,
  size = 11,
}: {
  shape: (typeof VIZ_LEGEND)[number]["shape"];
  color: string;
  size?: number;
}) {
  const s = size;
  switch (shape) {
    case "diamond":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path d="M6 1 L11 6 L6 11 L1 6 Z" fill={color} />
        </svg>
      );
    case "pentagon":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path d="M6 1 L10.2 4.3 L8.8 9.5 L3.2 9.5 L1.8 4.3 Z" fill={color} />
        </svg>
      );
    case "bag":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <path
            d="M3 4h6l.5 6.5c0 .8-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.7-1.5-1.5L3 4z M4 4V3.5C4 2.1 5 1 6.5 1S9 2.1 9 3.5V4"
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "square":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1" fill={color} />
        </svg>
      );
    case "circle":
    case "dot":
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" aria-hidden className="shrink-0">
          <circle cx="6" cy="6" r={shape === "dot" ? 4.5 : 5} fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export function shapeFor(cat: VizCategory) {
  const row = VIZ_LEGEND.find((l) => l.key === cat);
  if (!row) return null;
  return <VizShape shape={row.shape} color={row.color} size={12} />;
}

/** Estilo de la caja (fondo, borde, sombra) idéntico al de la ficha del canvas. */
export function metricCardBoxStyle({
  metric,
  selected = false,
  colorByCategory = false,
  glow: glowing = false,
}: {
  metric: Metric;
  selected?: boolean;
  colorByCategory?: boolean;
  /** Glow azul transitorio (al localizar la ficha); independiente de la selección. */
  glow?: boolean;
}): React.CSSProperties {
  const cat = metricVizCategory(metric);
  const accentColor = VIZ_LEGEND.find((row) => row.key === cat)?.color ?? "#9ca3af";
  const cardAccent = colorByCategory
    ? vizCategoryCardAccent(cat, { selected })
    : undefined;
  // Glow azul evidente al localizarla; se desvanece por la transición de box-shadow.
  const glow = glowing
    ? ", 0 0 0 3px rgba(13,153,255,0.55), 0 0 12px 5px rgba(13,153,255,0.45)"
    : "";
  const base = colorByCategory
    ? `inset 5px 0 0 ${accentColor}, 0 6px 18px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.85)`
    : "0 6px 18px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.88)";
  return {
    backgroundColor: colorByCategory
      ? selected
        ? cardAccent?.backgroundColor
        : "rgba(255,255,255,0.94)"
      : "#fffdf9",
    borderColor: selected
      ? "#0d99ff"
      : colorByCategory
        ? cardAccent?.borderColor
        : "#cfc7bb",
    boxShadow: base + glow,
  };
}

/** Contenido interno de la ficha: forma + categoría + badge + nombre. */
export function MetricCardContent({ metric }: { metric: Metric }) {
  const cat = metricVizCategory(metric);
  const legendRow = VIZ_LEGEND.find((row) => row.key === cat);
  const Icon = getMetricIcon(metric.id);
  return (
    <span className="pointer-events-none block">
      <span className="mb-1 flex items-center gap-2">
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: legendRow?.color ?? "#9ca3af" }}
          aria-hidden
        />
        <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#757575]">
          {legendRow?.label ?? "Métrica"}
        </span>
        {metric.archived ? (
          <span className="ml-auto rounded-md bg-[#fff3cd] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#8a6d3b]">
            Obsoleta
          </span>
        ) : null}
      </span>
      <span className="block text-[13px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#1e1e1e]">
        {metric.shortName ?? metric.name}
      </span>
    </span>
  );
}

/**
 * Ficha del canvas como componente autónomo (no interactivo). Es EXACTAMENTE la
 * misma que se ve en el lienzo: se usa para la preview al hover de la bandeja y
 * para el fantasma de arrastre cuando entra en el canvas, garantizando que lo
 * que previsualizas es lo que se deja.
 */
export function MetricCanvasCard({
  metric,
  selected = false,
  colorByCategory = false,
  glow = false,
  className,
  style,
}: {
  metric: Metric;
  selected?: boolean;
  colorByCategory?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        METRIC_CARD_BASE,
        "select-none",
        selected && "ring-2 ring-[#0d99ff] ring-offset-2 ring-offset-[#f5f5f5]",
        className,
      )}
      style={{
        ...metricCardBoxStyle({ metric, selected, colorByCategory, glow }),
        ...style,
      }}
    >
      <MetricCardContent metric={metric} />
    </div>
  );
}
