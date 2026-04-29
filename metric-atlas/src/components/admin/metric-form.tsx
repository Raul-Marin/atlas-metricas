"use client";

import * as React from "react";
import { X } from "lucide-react";
import type {
  FigmaAvailability,
  ImpactZone,
  Maturity,
  MeasurementType,
  Metric,
  MetricLayer,
  SignalQuality,
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
import { cn } from "@/lib/utils";

const measurementLabels: Record<MeasurementType, string> = {
  qualitative: "Cualitativa",
  quantitative: "Cuantitativa",
  hybrid: "Híbrida",
  experimental: "Experimental",
};

const figmaLabels: Record<FigmaAvailability, string> = {
  yes: "Sí",
  partial: "Parcial",
  no: "No",
};

const IMPACT_ZONES: ImpactZone[] = [
  "system",
  "operations",
  "product",
  "business",
  "ai-automation",
];
const impactLabels: Record<ImpactZone, string> = {
  system: "Sistema",
  operations: "Operaciones",
  product: "Producto",
  business: "Negocio",
  "ai-automation": "IA / automatización",
};

const MATURITIES: Maturity[] = ["classical", "advanced", "experimental"];
const maturityLabels: Record<Maturity, string> = {
  classical: "Clásica",
  advanced: "Avanzada",
  experimental: "Experimental",
};

const SIGNALS: SignalQuality[] = ["strong", "medium", "weak", "speculative"];
const signalLabels: Record<SignalQuality, string> = {
  strong: "Fuerte",
  medium: "Media",
  weak: "Débil",
  speculative: "Especulativa",
};

function sourceLabel(s: SourceType) {
  return sourceLegend.find((x) => x.value === s)?.label ?? s;
}

const labelClass =
  "block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]";
const inputClass =
  "w-full rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15";
const textareaClass = `${inputClass} font-mono text-[11px]`;

function emptyMetric(): Metric {
  return {
    id: "",
    name: "",
    layer: "system-health",
    impactZone: "system",
    measurementType: "qualitative",
    sourcePrimary: "research",
    sourceSecondary: [],
    figmaAvailability: "no",
    maturity: "experimental",
    signalQuality: "weak",
    experimental: false,
    aiRelated: false,
    realtimePossible: false,
    description: "",
    whyItMatters: "",
    howToMeasure: [],
    tags: [],
    relatedMetricIds: [],
    dashboardIdeas: [],
    automationIdeas: [],
    risksBiases: [],
    archived: false,
  };
}

function joinLines(arr: string[] | undefined): string {
  return (arr ?? []).join("\n");
}
function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
function joinTags(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}
function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export type MetricFormSubmit = {
  metric: Metric;
  isCreate: boolean;
};

export function MetricFormModal({
  open,
  initial,
  existingIds,
  allMetrics,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Metric;
  existingIds: string[];
  allMetrics: Metric[];
  onClose: () => void;
  onSubmit: (payload: MetricFormSubmit) => Promise<void> | void;
}) {
  const isCreate = !initial;
  const [draft, setDraft] = React.useState<Metric>(() =>
    initial ? { ...initial } : emptyMetric(),
  );
  const [howToText, setHowToText] = React.useState(
    joinLines(initial?.howToMeasure),
  );
  const [tagsText, setTagsText] = React.useState(joinTags(initial?.tags));
  const [dashboardText, setDashboardText] = React.useState(
    joinLines(initial?.dashboardIdeas),
  );
  const [automationText, setAutomationText] = React.useState(
    joinLines(initial?.automationIdeas),
  );
  const [risksText, setRisksText] = React.useState(
    joinLines(initial?.risksBiases),
  );
  const [relatedQuery, setRelatedQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial } : emptyMetric());
    setHowToText(joinLines(initial?.howToMeasure));
    setTagsText(joinTags(initial?.tags));
    setDashboardText(joinLines(initial?.dashboardIdeas));
    setAutomationText(joinLines(initial?.automationIdeas));
    setRisksText(joinLines(initial?.risksBiases));
    setRelatedQuery("");
    setError(null);
    setBusy(false);
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const set = <K extends keyof Metric>(key: K, value: Metric[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleSecondary = (s: SourceType) => {
    const current = draft.sourceSecondary ?? [];
    set(
      "sourceSecondary",
      current.includes(s) ? current.filter((x) => x !== s) : [...current, s],
    );
  };

  const toggleRelated = (id: string) => {
    const current = draft.relatedMetricIds;
    set(
      "relatedMetricIds",
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };

  const filteredCandidates = React.useMemo(() => {
    const q = relatedQuery.trim().toLowerCase();
    return allMetrics
      .filter((m) => m.id !== draft.id)
      .filter((m) =>
        q
          ? `${m.name} ${m.id}`.toLowerCase().includes(q)
          : true,
      )
      .slice(0, 200);
  }, [allMetrics, relatedQuery, draft.id]);

  const onIdAutoGen = () => {
    if (draft.id || !draft.name) return;
    set("id", slugify(draft.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!draft.id.trim()) {
      setError("El id es obligatorio.");
      return;
    }
    if (!draft.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (isCreate && existingIds.includes(draft.id)) {
      setError(`Ya existe una métrica con id "${draft.id}".`);
      return;
    }
    const payload: Metric = {
      ...draft,
      id: draft.id.trim(),
      name: draft.name.trim(),
      shortName: draft.shortName?.trim() || undefined,
      subgroup: draft.subgroup?.trim() || undefined,
      description: draft.description.trim(),
      whyItMatters: draft.whyItMatters.trim(),
      howToMeasure: splitLines(howToText),
      tags: splitTags(tagsText),
      dashboardIdeas: splitLines(dashboardText).length
        ? splitLines(dashboardText)
        : undefined,
      automationIdeas: splitLines(automationText).length
        ? splitLines(automationText)
        : undefined,
      risksBiases: splitLines(risksText).length
        ? splitLines(risksText)
        : undefined,
      relatedMetricIds: draft.relatedMetricIds,
      sourceSecondary: draft.sourceSecondary?.length
        ? draft.sourceSecondary
        : undefined,
      priority:
        typeof draft.priority === "number" && !Number.isNaN(draft.priority)
          ? draft.priority
          : undefined,
      archived: Boolean(draft.archived),
    };
    setBusy(true);
    try {
      await onSubmit({ metric: payload, isCreate });
      onClose();
    } catch (err) {
      console.error("[metric-form] submit", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Crear métrica" : `Editar ${draft.name}`}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex h-full w-full max-w-[640px] flex-col bg-white shadow-xl"
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e6e6e6] bg-white px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
              {isCreate ? "Nueva métrica" : "Editar métrica"}
            </span>
            {!isCreate ? (
              <span className="truncate text-xs text-[#949494]">{draft.id}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          {/* Identidad */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Identidad
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Id (slug)</span>
                <input
                  type="text"
                  className={cn(inputClass, !isCreate && "opacity-60")}
                  value={draft.id}
                  onChange={(e) => set("id", e.target.value)}
                  onBlur={onIdAutoGen}
                  readOnly={!isCreate}
                  placeholder="design-token-usage"
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Nombre</span>
                <input
                  type="text"
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Nombre corto (opcional)</span>
                <input
                  type="text"
                  className={inputClass}
                  value={draft.shortName ?? ""}
                  onChange={(e) => set("shortName", e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Subgrupo (opcional)</span>
                <input
                  type="text"
                  className={inputClass}
                  value={draft.subgroup ?? ""}
                  onChange={(e) => set("subgroup", e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          {/* Categorización */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Categorización
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Capa</span>
                <select
                  className={inputClass}
                  value={draft.layer}
                  onChange={(e) => set("layer", e.target.value as MetricLayer)}
                >
                  {METRIC_LAYERS.map((l) => (
                    <option key={l} value={l}>
                      {layerLabels[l]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Zona de impacto</span>
                <select
                  className={inputClass}
                  value={draft.impactZone}
                  onChange={(e) => set("impactZone", e.target.value as ImpactZone)}
                >
                  {IMPACT_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {impactLabels[z]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Tipo de medición</span>
                <select
                  className={inputClass}
                  value={draft.measurementType}
                  onChange={(e) =>
                    set("measurementType", e.target.value as MeasurementType)
                  }
                >
                  {MEASUREMENT_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {measurementLabels[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Fuente principal</span>
                <select
                  className={inputClass}
                  value={draft.sourcePrimary}
                  onChange={(e) =>
                    set("sourcePrimary", e.target.value as SourceType)
                  }
                >
                  {SOURCE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {sourceLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <span className={labelClass}>Fuentes secundarias</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SOURCE_TYPES.filter((s) => s !== draft.sourcePrimary).map((s) => {
                  const on = draft.sourceSecondary?.includes(s) ?? false;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSecondary(s)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px]",
                        on
                          ? "border-[#bde3ff] bg-[#f0f7ff] text-[#0d99ff]"
                          : "border-[#e6e6e6] bg-white text-[#626262] hover:bg-[#f7f7f7]",
                      )}
                    >
                      {sourceLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>

          {/* Calidad y disponibilidad */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Calidad y disponibilidad
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="space-y-1">
                <span className={labelClass}>Disponibilidad Figma</span>
                <select
                  className={inputClass}
                  value={draft.figmaAvailability}
                  onChange={(e) =>
                    set("figmaAvailability", e.target.value as FigmaAvailability)
                  }
                >
                  {FIGMA_AVAILABILITY.map((f) => (
                    <option key={f} value={f}>
                      {figmaLabels[f]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Madurez</span>
                <select
                  className={inputClass}
                  value={draft.maturity}
                  onChange={(e) => set("maturity", e.target.value as Maturity)}
                >
                  {MATURITIES.map((m) => (
                    <option key={m} value={m}>
                      {maturityLabels[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Calidad de señal</span>
                <select
                  className={inputClass}
                  value={draft.signalQuality}
                  onChange={(e) =>
                    set("signalQuality", e.target.value as SignalQuality)
                  }
                >
                  {SIGNALS.map((s) => (
                    <option key={s} value={s}>
                      {signalLabels[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-[#444]">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.experimental}
                  onChange={(e) => set("experimental", e.target.checked)}
                />
                Experimental
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.aiRelated}
                  onChange={(e) => set("aiRelated", e.target.checked)}
                />
                Relacionada con IA
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.realtimePossible}
                  onChange={(e) => set("realtimePossible", e.target.checked)}
                />
                Posible en tiempo real
              </label>
              <label className="inline-flex items-center gap-1.5">
                <span className={labelClass}>Prioridad</span>
                <input
                  type="number"
                  className={`${inputClass} w-20`}
                  value={draft.priority ?? ""}
                  onChange={(e) =>
                    set(
                      "priority",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  step={1}
                />
              </label>
            </div>
          </fieldset>

          {/* Contenido */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Contenido
            </legend>
            <label className="block space-y-1">
              <span className={labelClass}>Descripción</span>
              <textarea
                className={textareaClass}
                rows={3}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Por qué importa</span>
              <textarea
                className={textareaClass}
                rows={3}
                value={draft.whyItMatters}
                onChange={(e) => set("whyItMatters", e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Cómo se mide (una por línea)</span>
              <textarea
                className={textareaClass}
                rows={4}
                value={howToText}
                onChange={(e) => setHowToText(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Tags (separados por coma)</span>
              <input
                type="text"
                className={inputClass}
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="tokens, figma-native, system-health"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>
                Ideas de dashboard (una por línea, opcional)
              </span>
              <textarea
                className={textareaClass}
                rows={3}
                value={dashboardText}
                onChange={(e) => setDashboardText(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>
                Ideas de automatización (una por línea, opcional)
              </span>
              <textarea
                className={textareaClass}
                rows={3}
                value={automationText}
                onChange={(e) => setAutomationText(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>
                Riesgos / sesgos (una por línea, opcional)
              </span>
              <textarea
                className={textareaClass}
                rows={3}
                value={risksText}
                onChange={(e) => setRisksText(e.target.value)}
              />
            </label>
          </fieldset>

          {/* Relacionadas */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Métricas relacionadas
            </legend>
            <p className="text-[11px] text-[#757575]">
              Marca todas las que se enlazarán desde esta ficha. {draft.relatedMetricIds.length} seleccionadas.
            </p>
            <input
              type="search"
              placeholder="Buscar métrica…"
              value={relatedQuery}
              onChange={(e) => setRelatedQuery(e.target.value)}
              className={inputClass}
            />
            <div className="max-h-[220px] overflow-y-auto rounded-md border border-[#e6e6e6] bg-[#fafafa]">
              {filteredCandidates.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-[#757575]">
                  Sin resultados.
                </p>
              ) : (
                <ul className="divide-y divide-[#eeeeee]">
                  {filteredCandidates.map((m) => {
                    const on = draft.relatedMetricIds.includes(m.id);
                    return (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-white">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={on}
                            onChange={() => toggleRelated(m.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium text-[#1e1e1e]">
                              {m.name}
                            </span>
                            <span className="block truncate text-[10px] text-[#757575]">
                              {m.id}
                            </span>
                          </span>
                          {m.archived ? (
                            <span className="rounded-md bg-[#fff3cd] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#8a6d3b]">
                              Obsoleta
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </fieldset>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e6e6e6] bg-white px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#626262] hover:bg-[#f5f5f5]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[#0d99ff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0b87e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Guardando…"
              : isCreate
                ? "Crear métrica"
                : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}
