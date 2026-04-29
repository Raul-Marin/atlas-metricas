"use client";

import * as React from "react";
import { Archive, Pencil, Plus, RotateCcw, Sparkles } from "lucide-react";
import type { Metric } from "@/lib/types";
import { metrics as seedMetrics } from "@/data/metrics";
import { useMetrics } from "@/lib/metrics/provider";
import {
  archiveMetric,
  createMetric,
  seedMetricsIfEmpty,
  unarchiveMetric,
  updateMetric,
} from "@/lib/metrics/firestore";
import { layerLabels } from "@/data/filters";
import { sourceLegend } from "@/data/legends";
import { cn } from "@/lib/utils";
import { MetricFormModal, type MetricFormSubmit } from "@/components/admin/metric-form";

type Filter = "all" | "active" | "archived";

function sourceLabel(value: string) {
  return sourceLegend.find((s) => s.value === value)?.label ?? value;
}

export default function AdminMetricsPage() {
  const { metrics, loading } = useMetrics();
  const [filter, setFilter] = React.useState<Filter>("active");
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<Metric | undefined>(undefined);
  const [creating, setCreating] = React.useState(false);
  const [seedBusy, setSeedBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const onSeed = async () => {
    setFeedback(null);
    setSeedBusy(true);
    try {
      const res = await seedMetricsIfEmpty(seedMetrics);
      setFeedback(
        `Seed completado · creadas ${res.created} · ya existían ${res.skipped} (total seed ${res.total}).`,
      );
    } catch (err) {
      console.error("[admin-metrics] seed", err);
      setFeedback(
        `Error al seedear: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setSeedBusy(false);
    }
  };

  const onSubmit = async (payload: MetricFormSubmit) => {
    if (payload.isCreate) {
      await createMetric(payload.metric);
    } else {
      const { id: _id, ...patch } = payload.metric;
      void _id;
      await updateMetric(payload.metric.id, patch);
    }
  };

  const onArchive = async (m: Metric) => {
    setPendingId(m.id);
    try {
      await archiveMetric(m.id);
    } catch (err) {
      console.error("[admin-metrics] archive", err);
      setFeedback(
        err instanceof Error ? err.message : "Error al archivar.",
      );
    } finally {
      setPendingId(null);
    }
  };

  const onUnarchive = async (m: Metric) => {
    setPendingId(m.id);
    try {
      await unarchiveMetric(m.id);
    } catch (err) {
      console.error("[admin-metrics] unarchive", err);
      setFeedback(
        err instanceof Error ? err.message : "Error al restaurar.",
      );
    } finally {
      setPendingId(null);
    }
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return metrics.filter((m) => {
      if (filter === "active" && m.archived) return false;
      if (filter === "archived" && !m.archived) return false;
      if (!q) return true;
      const hay = `${m.name} ${m.id} ${m.tags.join(" ")} ${m.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [metrics, filter, query]);

  const counts = React.useMemo(
    () => ({
      total: metrics.length,
      active: metrics.filter((m) => !m.archived).length,
      archived: metrics.filter((m) => m.archived).length,
    }),
    [metrics],
  );

  const existingIds = React.useMemo(() => metrics.map((m) => m.id), [metrics]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#1e1e1e]">
            Métricas
          </h1>
          <p className="text-xs text-[#757575]">
            Catálogo global. Las métricas se sirven en tiempo real a las
            matrices y a la documentación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.length === 0 ? (
            <button
              type="button"
              onClick={onSeed}
              disabled={seedBusy}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#e6e6e6] bg-white px-3 text-xs font-medium text-[#444] hover:border-[#d9d9d9] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0d99ff]" />
              {seedBusy ? "Sembrando…" : "Sembrar dataset estático"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0d99ff] px-3 text-xs font-medium text-white hover:bg-[#0b87e0]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva métrica
          </button>
        </div>
      </header>

      {feedback ? (
        <div className="rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-xs text-[#444]">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          {(["active", "archived", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
                  : "text-[#626262] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]",
              )}
            >
              {f === "active" ? "Activas" : f === "archived" ? "Obsoletas" : "Todas"}
              <span className="ml-1.5 text-[10px] tabular-nums text-[#949494]">
                {f === "active"
                  ? counts.active
                  : f === "archived"
                    ? counts.archived
                    : counts.total}
              </span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, id, tag o descripción"
          className="min-w-[220px] flex-1 rounded-md border border-[#e6e6e6] bg-[#fafafa] px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff]"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#f0f0f0] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
            <tr>
              <th className="px-4 py-2.5">Métrica</th>
              <th className="px-4 py-2.5">Capa</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Fuente</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Tags</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="w-[180px] px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-[#757575]">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-[#757575]">
                  {metrics.length === 0
                    ? 'La colección está vacía. Pulsa "Sembrar dataset estático" o "Nueva métrica".'
                    : "Ninguna métrica con esos criterios."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className={cn(
                    "border-b border-[#f3f3f3] hover:bg-[#fafafa]",
                    m.archived && "opacity-70",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#1e1e1e]">{m.name}</span>
                      <span className="font-mono text-[10px] text-[#949494]">
                        {m.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#444]">
                    {layerLabels[m.layer]}
                  </td>
                  <td className="hidden px-4 py-2.5 text-[12px] text-[#444] md:table-cell">
                    {sourceLabel(m.sourcePrimary)}
                  </td>
                  <td className="hidden max-w-[280px] truncate px-4 py-2.5 text-[11px] text-[#757575] md:table-cell">
                    {m.tags.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.archived ? (
                      <span className="rounded-md bg-[#fff3cd] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#8a6d3b]">
                        Obsoleta
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#e9f8ee] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#16794c]">
                        Activa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(m)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#444] hover:bg-[#f5f5f5]"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      {m.archived ? (
                        <button
                          type="button"
                          onClick={() => onUnarchive(m)}
                          disabled={pendingId === m.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#0d99ff] hover:bg-[#f0f7ff] disabled:opacity-60"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onArchive(m)}
                          disabled={pendingId === m.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8a6d3b] hover:bg-[#fff3cd] disabled:opacity-60"
                        >
                          <Archive className="h-3 w-3" />
                          Archivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MetricFormModal
        open={creating}
        existingIds={existingIds}
        allMetrics={metrics}
        onClose={() => setCreating(false)}
        onSubmit={onSubmit}
      />
      <MetricFormModal
        open={Boolean(editing)}
        initial={editing}
        existingIds={existingIds}
        allMetrics={metrics}
        onClose={() => setEditing(undefined)}
        onSubmit={onSubmit}
      />
    </div>
  );
}
