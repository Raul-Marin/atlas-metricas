"use client";

import * as React from "react";
import { X } from "lucide-react";
import type {
  FigmaAvailability,
  MeasurementType,
  MetricLayer,
  SourceType,
} from "@/lib/types";
import {
  FIGMA_AVAILABILITY,
  MEASUREMENT_TYPES,
  METRIC_LAYERS,
  SOURCE_TYPES,
} from "@/lib/constants";
import { layerLabels } from "@/data/filters";
import { sourceLegend } from "@/data/legends";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { MatrixAxisControls } from "@/components/atlas/matrix-axis-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const figmaLabels: Record<FigmaAvailability, string> = {
  yes: "Figma sí",
  partial: "Figma parcial",
  no: "Figma no",
};

function chipClass(on: boolean) {
  return on
    ? "border-[#bde3ff] bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.04)] hover:bg-[#e8f4ff] hover:shadow-[0_1px_2px_rgba(13,153,255,0.12)]"
    : "border-[#e6e6e6] bg-white text-[#626262] hover:bg-[#f7f7f7] hover:border-[#d7d7d7] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="rounded-md border border-[#ececec] bg-[#fcfcfc]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#757575]">
          {title}
        </span>
        <span className="text-xs text-[#949494]">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border-t border-[#eeeeee] px-3 py-3">{children}</div> : null}
    </section>
  );
}

export function FiltersBar({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "minimal";
}) {
  const { filters, setFilters, resetFilters } = useAtlasFilters();

  const toggleLayer = (l: MetricLayer) => {
    setFilters((f) => ({ ...f, layers: toggle(f.layers, l) }));
  };

  const toggleSource = (s: SourceType) => {
    setFilters((f) => ({ ...f, sources: toggle(f.sources, s) }));
  };

  const toggleFigma = (fa: FigmaAvailability) => {
    setFilters((f) => ({
      ...f,
      figmaAvailability: toggle(f.figmaAvailability, fa),
    }));
  };

  const toggleMeasurement = (mt: MeasurementType) => {
    setFilters((f) => ({
      ...f,
      measurementTypes: toggle(f.measurementTypes, mt),
    }));
  };

  const measureLabels: Record<MeasurementType, string> = {
    qualitative: "Cualitativa",
    quantitative: "Cuantitativa",
    hybrid: "Híbrida",
    experimental: "Experimental",
  };

  const active =
    filters.layers.length > 0 ||
    filters.sources.length > 0 ||
    filters.measurementTypes.length > 0 ||
    filters.experimentalOnly ||
    filters.aiRelatedOnly ||
    filters.figmaAvailability.length > 0;

  const minimal = variant === "minimal";

  return (
    <div
      className={cn(
        minimal
          ? "text-[#1e1e1e]"
          : "rounded-xl border border-[#e6e6e6] bg-white/90 p-5 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {!minimal ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-[#1e1e1e]">Filtros</h2>
            <p className="text-xs text-[#757575]">Vacío = mostrar todas.</p>
          </div>
          {active ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-[#757575] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
              onClick={resetFilters}
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#757575]">
            Variables
          </span>
          {active ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#757575] hover:bg-[#f5f5f5]"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          ) : null}
        </div>
      )}

      {minimal ? (
        <div className="mb-4">
          <MatrixAxisControls compact />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <FilterSection title="Capa" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {METRIC_LAYERS.map((layer) => {
              const on = filters.layers.includes(layer);
              return (
                <button
                  key={layer}
                  type="button"
                  onClick={() => toggleLayer(layer)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-left text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                    chipClass(on),
                  )}
                >
                  {layerLabels[layer]}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Tipo de medición" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {MEASUREMENT_TYPES.map((mt) => {
              const on = filters.measurementTypes.includes(mt);
              return (
                <button
                  key={mt}
                  type="button"
                  onClick={() => toggleMeasurement(mt)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                    chipClass(on),
                  )}
                >
                  {measureLabels[mt]}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Fuente" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_TYPES.map((s) => {
              const meta = sourceLegend.find((x) => x.value === s);
              const on = filters.sources.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  title={meta?.hint}
                  onClick={() => toggleSource(s)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                    chipClass(on),
                  )}
                >
                  {meta?.label ?? s}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Disponibilidad Figma" defaultOpen={true}>
          <div className="flex flex-wrap gap-1.5">
            {FIGMA_AVAILABILITY.map((fa) => {
              const on = filters.figmaAvailability.includes(fa);
              return (
                <button
                  key={fa}
                  type="button"
                  onClick={() => toggleFigma(fa)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs capitalize transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                    chipClass(on),
                  )}
                >
                  {figmaLabels[fa]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  experimentalOnly: !f.experimentalOnly,
                }))
              }
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                chipClass(filters.experimentalOnly),
              )}
            >
              Solo experimentales
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({ ...f, aiRelatedOnly: !f.aiRelatedOnly }))
              }
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d99ff]/20 active:scale-[0.985]",
                chipClass(filters.aiRelatedOnly),
              )}
            >
              Solo IA
            </button>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
