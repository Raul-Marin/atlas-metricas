"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disableShare,
  enableShare,
  subscribeToShareState,
  type ShareState,
} from "@/lib/boards/firestore";
import type { Metric } from "@/lib/types";
import { filterMetrics } from "@/lib/filters";
import { metricMapPosition } from "@/lib/matrix-axes";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { FiltersBar } from "@/components/layout/filters-bar";
import { FigJamBoard, type FigJamBoardHandle } from "./figjam-board";
import { MetricInsightPanel } from "./metric-insight-panel";
import { MetricsTray } from "./metrics-tray";
import {
  MetricsFiltersCard,
  MetricsHeaderCard,
  MetricsNavCard,
  MetricsResultsGrid,
  useMetricsFilters,
} from "@/components/metric/metrics-library";
import { MetricDetail } from "@/components/metric/metric-detail";
import { cn } from "@/lib/utils";
import { renameBoard } from "@/lib/boards/firestore";
import { useAuth } from "@/lib/auth/auth-provider";

export function AtlasWorkspace({
  metrics,
  boardId,
  initialTitle,
}: {
  metrics: Metric[];
  boardId?: string;
  initialTitle?: string;
}) {
  const {
    filters,
    excludedMetricIds,
    excludeMetric,
    includeMetric,
    matrixAxes,
    metricManualPositions,
    setMetricManualPosition,
  } = useAtlasFilters();
  const { user } = useAuth();
  const visible = React.useMemo(
    () => filterMetrics(metrics, filters),
    [metrics, filters],
  );
  const canvasMetrics = React.useMemo(
    () => visible.filter((m) => !excludedMetricIds.includes(m.id)),
    [visible, excludedMetricIds],
  );
  const trayMetrics = React.useMemo(
    () => visible.filter((m) => !m.archived),
    [visible],
  );
  const [selected, setSelected] = React.useState<Metric | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(false);
  const [docsMetric, setDocsMetric] = React.useState<Metric | null>(null);
  const [sidebarTab, setSidebarTab] = React.useState<"metrics" | "variables">(
    "metrics",
  );
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareState, setShareState] = React.useState<ShareState | null>(null);
  const [title, setTitle] = React.useState(initialTitle ?? "Metric Atlas");
  const figjamRef = React.useRef<FigJamBoardHandle | null>(null);

  React.useEffect(() => {
    if (!boardId) return;
    return subscribeToShareState(boardId, setShareState);
  }, [boardId]);

  const variablesActive =
    filters.layers.length > 0 ||
    filters.sources.length > 0 ||
    filters.measurementTypes.length > 0 ||
    filters.experimentalOnly ||
    filters.aiRelatedOnly ||
    filters.figmaAvailability.length > 0;

  React.useEffect(() => {
    if (!docsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDocsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [docsOpen]);

  React.useEffect(() => {
    if (initialTitle !== undefined) setTitle(initialTitle);
  }, [initialTitle]);

  const flushTitle = React.useCallback(() => {
    if (boardId && user) {
      renameBoard(user.uid, boardId, title).catch((err) => {
        console.error("[atlas-workspace] renameBoard", err);
      });
    }
  }, [boardId, title, user]);

  React.useEffect(() => {
    if (selected && !canvasMetrics.some((m) => m.id === selected.id)) {
      setSelected(null);
    }
  }, [selected, canvasMetrics]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selected) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      const existing = metricManualPositions[selected.id];
      const pos = existing ?? metricMapPosition(selected, matrixAxes);
      setMetricManualPosition(selected.id, pos);
      excludeMetric(selected.id);
      setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, excludeMetric, metricManualPositions, matrixAxes, setMetricManualPosition]);

  const handleSelect = React.useCallback(
    (m: Metric) => {
      if (excludedMetricIds.includes(m.id)) {
        const center = figjamRef.current?.getViewportCenterNorm();
        if (center) {
          setMetricManualPosition(m.id, center);
        }
        includeMetric(m.id);
      }
      setSelected(m);
    },
    [excludedMetricIds, includeMetric, setMetricManualPosition],
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f5f5f5]">
      {/* Global top header (full width across left + main + right) */}
      <header className="flex h-12 shrink-0 items-stretch border-b border-[#e6e6e6] bg-white">
        {/* Left: Volver (matches sidebar width on desktop) */}
        <div className="hidden h-full w-[248px] shrink-0 items-center border-r border-[#e6e6e6] px-3 md:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium tracking-[-0.01em] text-[#626262] transition-colors hover:bg-[#f0f0f0] hover:text-[#1e1e1e]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
        {/* Right: title + actions (spans canvas + right panel) */}
        <div className="flex h-full min-w-0 flex-1 items-center gap-3 px-4">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[#626262] hover:bg-[#f0f0f0] md:hidden"
            aria-label="Volver"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {boardId ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={flushTitle}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="min-w-0 max-w-[min(100%,280px)] flex-1 border-b border-transparent bg-transparent text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e] outline-none focus:border-[#b3b3b3] sm:max-w-[320px]"
              aria-label="Nombre de la matrix"
            />
          ) : (
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
              Metric Atlas
            </span>
          )}
          <span className="ml-auto shrink-0 text-xs tabular-nums text-[#757575]">
            {canvasMetrics.length}/{metrics.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setDocsMetric(null);
              setDocsOpen(true);
            }}
            className="hidden h-8 shrink-0 items-center rounded-md border border-[#e6e6e6] bg-white px-2.5 text-xs font-medium text-[#444] transition-[background-color,border-color] hover:border-[#d9d9d9] hover:bg-[#f7f7f7] lg:inline-flex"
          >
            Documentación
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs font-medium text-[#444] shadow-sm hover:bg-[#f7f7f7] md:hidden"
          >
            Variables
          </button>
          {boardId && user ? (
            <div className="relative">
              <Button
                size="sm"
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className="h-8 shrink-0 gap-1.5 bg-[#0d99ff] text-white hover:translate-y-[-1px] hover:bg-[#0b87e0]"
                aria-expanded={shareOpen}
                aria-haspopup="dialog"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartir
              </Button>
              {shareOpen ? (
                <SharePopover
                  ownerUid={user.uid}
                  boardId={boardId}
                  shareEnabled={shareState?.enabled === true}
                  onClose={() => setShareOpen(false)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {/* Body row */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar 248px (same as dashboard) */}
        <aside className="hidden h-full w-[248px] shrink-0 flex-col border-r border-[#e6e6e6] bg-white md:flex">
          {/* Tabs header */}
          <SidebarTabs
            tab={sidebarTab}
            onChange={setSidebarTab}
            variablesActive={variablesActive}
          />
          {/* Sidebar scrollable body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3.5">
            {sidebarTab === "metrics" ? (
              <MetricsTray
                metrics={trayMetrics}
                excludedIds={excludedMetricIds}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                variant="flat"
              />
            ) : (
              <FiltersBar variant="minimal" />
            )}
          </div>
        </aside>

      {filtersOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          role="presentation"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="absolute left-0 top-0 flex h-full w-[min(100%,300px)] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end border-b border-[#f0f0f0] px-3 py-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-[#757575] hover:bg-[#f5f5f5]"
              >
                Cerrar
              </button>
            </div>
            <SidebarTabs
              tab={sidebarTab}
              onChange={setSidebarTab}
              variablesActive={variablesActive}
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3.5">
              {sidebarTab === "metrics" ? (
                <MetricsTray
                  metrics={trayMetrics}
                  excludedIds={excludedMetricIds}
                  selectedId={selected?.id ?? null}
                  onSelect={(m) => {
                    handleSelect(m);
                    setFiltersOpen(false);
                  }}
                  variant="flat"
                />
              ) : (
                <FiltersBar variant="minimal" />
              )}
            </div>
          </div>
        </div>
      ) : null}

        {/* Main content column: canvas */}
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f3f3f3] p-3 md:p-4"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 24%)",
            }}
          >
            <FigJamBoard
              ref={figjamRef}
              metrics={visible}
              selectedId={selected?.id ?? null}
              onSelect={(m) => setSelected(m)}
            />
          </div>
        </div>

        {/* Right insight panel */}
        <MetricInsightPanel
          metric={selected}
          onClose={() => setSelected(null)}
          onOpenFullCard={(m) => {
            setDocsMetric(m);
            setDocsOpen(true);
          }}
          className={cn(!selected && "max-md:hidden")}
        />
      </div>

      {docsOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#f5f5f5]"
          role="dialog"
          aria-modal="true"
          aria-label="Documentación de métricas"
        >
          <header className="flex h-12 shrink-0 border-b border-[#e6e6e6] bg-white">
            {/* Bloque izquierdo (mismo ancho que sidebar): Cerrar */}
            <div className="hidden h-full w-[248px] shrink-0 items-center border-r border-[#e6e6e6] px-3 md:flex">
              <button
                type="button"
                onClick={() => setDocsOpen(false)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium tracking-[-0.01em] text-[#626262] transition-colors hover:bg-[#f0f0f0] hover:text-[#1e1e1e]"
              >
                <X className="h-4 w-4" />
                Cerrar
              </button>
            </div>
            {/* Bloque derecho: cabecera de página */}
            <div className="flex h-full min-w-0 flex-1 items-center gap-3 px-4 md:px-6">
              {/* Mobile-only Cerrar */}
              <button
                type="button"
                onClick={() => setDocsOpen(false)}
                aria-label="Cerrar documentación"
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[#626262] hover:bg-[#f0f0f0] md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
              {docsMetric ? (
                <button
                  type="button"
                  onClick={() => setDocsMetric(null)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[#626262] transition-colors hover:bg-[#f0f0f0] hover:text-[#1e1e1e]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Biblioteca
                </button>
              ) : null}
              <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
                Documentación
              </span>
              <span className="hidden truncate text-xs text-[#949494] sm:inline">
                {docsMetric ? docsMetric.name : "Biblioteca de métricas"}
              </span>
            </div>
          </header>
          <div className="flex-1 overflow-auto px-4 py-6 md:px-6">
            <DocsModalBody
              metrics={metrics}
              docsMetric={docsMetric}
              onOpenMetric={(m) => setDocsMetric(m)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocsModalBody({
  metrics,
  docsMetric,
  onOpenMetric,
}: {
  metrics: Metric[];
  docsMetric: Metric | null;
  onOpenMetric: (m: Metric) => void;
}) {
  const filters = useMetricsFilters(metrics);
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
        <MetricsHeaderCard />
        <MetricsNavCard filters={filters} />
        <MetricsFiltersCard filters={filters} />
      </aside>
      <div className="min-w-0">
        {docsMetric ? (
          <MetricDetail metric={docsMetric} onOpenRelated={onOpenMetric} />
        ) : (
          <MetricsResultsGrid filters={filters} onOpenMetric={onOpenMetric} />
        )}
      </div>
    </div>
  );
}

function SidebarTabs({
  tab,
  onChange,
  variablesActive,
}: {
  tab: "metrics" | "variables";
  onChange: (next: "metrics" | "variables") => void;
  variablesActive: boolean;
}) {
  return (
    <div className="flex gap-1 border-b border-[#f0f0f0] px-3 pb-2 pt-3">
      <button
        type="button"
        onClick={() => onChange("metrics")}
        className={cn(
          "flex-1 rounded-md px-2 py-1.5 text-xs font-medium tracking-[-0.01em] transition-colors",
          tab === "metrics"
            ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
            : "text-[#626262] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]",
        )}
      >
        Métricas
      </button>
      <button
        type="button"
        onClick={() => onChange("variables")}
        className={cn(
          "flex-1 rounded-md px-2 py-1.5 text-xs font-medium tracking-[-0.01em] transition-colors",
          tab === "variables"
            ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
            : "text-[#626262] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]",
        )}
      >
        <span className="relative inline-block">
          Variables
          {variablesActive ? (
            <span
              aria-hidden
              className="absolute -right-2.5 -top-1 h-2 w-2 rounded-full bg-[#0d99ff] ring-2 ring-white"
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}

function SharePopover({
  ownerUid,
  boardId,
  shareEnabled,
  onClose,
}: {
  ownerUid: string;
  boardId: string;
  shareEnabled: boolean;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${boardId}`
      : `/share/${boardId}`;

  const onToggle = async () => {
    setError(null);
    setBusy(true);
    try {
      if (shareEnabled) {
        await disableShare(ownerUid, boardId);
      } else {
        await enableShare(ownerUid, boardId);
      }
    } catch (err) {
      console.error("[share-popover] toggle", err);
      setError("No se pudo actualizar el estado de compartir.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("[share-popover] copy", err);
      setError("No se pudo copiar al portapapeles.");
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Compartir matriz"
      className="absolute right-0 top-[calc(100%+8px)] z-40 w-[320px] rounded-lg border border-[#e6e6e6] bg-white p-3 shadow-lg"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold tracking-[-0.01em] text-[#1e1e1e]">
            Compartir matriz
          </p>
          <p className="text-[11px] leading-[1.4] text-[#757575]">
            Cualquiera con el enlace podrá ver el canvas (sin editar).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="mb-3 flex items-center justify-between gap-2 rounded-md bg-[#fafafa] px-2.5 py-2">
        <span className="text-[12px] font-medium text-[#1e1e1e]">
          Compartir públicamente
        </span>
        <input
          type="checkbox"
          checked={shareEnabled}
          onChange={onToggle}
          disabled={busy}
          className="h-4 w-4 cursor-pointer accent-[#0d99ff]"
        />
      </label>

      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-[#e6e6e6] bg-white px-2 py-1.5",
          !shareEnabled && "opacity-50",
        )}
      >
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          disabled={!shareEnabled}
          className="min-w-0 flex-1 truncate bg-transparent text-[11px] text-[#444] outline-none"
          aria-label="URL para compartir"
        />
        <button
          type="button"
          onClick={onCopy}
          disabled={!shareEnabled}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-[11px] font-medium text-[#444] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiar
            </>
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
