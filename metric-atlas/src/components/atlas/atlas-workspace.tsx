"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Redo2,
  Share2,
  Table2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disableShare,
  enableShare,
  subscribeToShareState,
  type ShareState,
} from "@/lib/boards/firestore";
import type { Metric } from "@/lib/types";
import { filterMetrics } from "@/lib/filters";
import { resolveMetricLayout } from "@/lib/metric-layout";
import { MATRIX_AXIS_OPTIONS } from "@/lib/matrix-axes";
import { useMetricContext } from "@/lib/context/provider";
import { audienceIdsFromLabels } from "@/lib/context/adapter";
import { AudienceModal } from "./audience-modal";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { FiltersBar } from "@/components/layout/filters-bar";
import { FigJamBoard, type FigJamBoardHandle } from "./figjam-board";
import { MetricCanvasCard } from "./metric-card";
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
    colorCardsByCategory,
    matrixAxes,
    setMatrixAxes,
    metricScores,
    excludedMetricIds,
    excludeMetrics,
    includeMetric,
    includeMetricAt,
    audiences,
    setAudiences,
    toggleAudience,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAtlasFilters();
  const { user } = useAuth();
  const metricContext = useMetricContext();
  const [objectiveId, setObjectiveId] = React.useState<string>("");
  const [audienceModalOpen, setAudienceModalOpen] = React.useState(false);

  // Al elegir un objetivo: filtra la biblioteca, actualiza los ejes del canvas a
  // los de la matriz que ese objetivo propone y pre-rellena su audiencia (editable).
  const handleObjectiveChange = React.useCallback(
    (id: string) => {
      setObjectiveId(id);
      const obj = metricContext.objectives.find((o) => o.id === id);
      const tpl = obj?.matrixTemplateId
        ? metricContext.templates.find((t) => t.id === obj.matrixTemplateId)
        : null;
      if (tpl) {
        setMatrixAxes({ axisX: tpl.axisX, axisY: tpl.axisY });
        setAudiences(audienceIdsFromLabels(tpl.audience, metricContext));
      }
    },
    [metricContext, setMatrixAxes, setAudiences],
  );
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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [primaryId, setPrimaryId] = React.useState<string | null>(null);
  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const primary = React.useMemo(
    () => canvasMetrics.find((m) => m.id === primaryId) ?? null,
    [canvasMetrics, primaryId],
  );
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(false);
  const [docsMetric, setDocsMetric] = React.useState<Metric | null>(null);
  const [sidebarTab, setSidebarTab] = React.useState<"metrics" | "variables">(
    "metrics",
  );
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareState, setShareState] = React.useState<ShareState | null>(null);
  const [title, setTitle] = React.useState(initialTitle ?? "Metric Atlas");
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState<null | "png" | "pdf">(null);
  const [dataTableOpen, setDataTableOpen] = React.useState(false);
  const figjamRef = React.useRef<FigJamBoardHandle | null>(null);

  const handleExport = React.useCallback(
    async (format: "png" | "pdf") => {
      setExportOpen(false);
      if (exporting) return;
      setExporting(format);
      try {
        const dataUrl = await figjamRef.current?.exportImage();
        if (!dataUrl) return;
        const safe =
          title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "matrix";
        if (format === "png") {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${safe}.png`;
          a.click();
        } else {
          const { jsPDF } = await import("jspdf");
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          const orientation =
            img.width >= img.height ? "landscape" : "portrait";
          const pdf = new jsPDF({
            orientation,
            unit: "px",
            format: [img.width, img.height],
          });
          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
          pdf.save(`${safe}.pdf`);
        }
      } catch (err) {
        console.error("[atlas-workspace] export", err);
      } finally {
        setExporting(null);
      }
    },
    [exporting, title],
  );

  // Exporta la tabla de datos del canvas (métrica + valor en los dos ejes activos) a CSV.
  const handleExportCsv = React.useCallback(() => {
    setExportOpen(false);
    const safe = title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "matrix";
    const xLabel =
      MATRIX_AXIS_OPTIONS.find((o) => o.id === matrixAxes.axisX)?.label ?? "Eje X";
    const yLabel =
      MATRIX_AXIS_OPTIONS.find((o) => o.id === matrixAxes.axisY)?.label ?? "Eje Y";
    const layout = resolveMetricLayout(canvasMetrics, matrixAxes, metricScores);
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [[esc("Métrica"), esc(xLabel), esc(yLabel)].join(",")];
    for (const m of canvasMetrics) {
      const pos = layout.get(m.id) ?? { x: 0.5, y: 0.5 };
      lines.push(
        [
          esc(m.shortName ?? m.name),
          Math.round(pos.x * 100),
          Math.round(pos.y * 100),
        ].join(","),
      );
    }
    // BOM para que Excel respete los acentos.
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasMetrics, matrixAxes, metricScores, title]);

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

  React.useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-export-menu]")) setExportOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [exportOpen]);

  const flushTitle = React.useCallback(() => {
    if (boardId && user) {
      renameBoard(user.uid, boardId, title).catch((err) => {
        console.error("[atlas-workspace] renameBoard", err);
      });
    }
  }, [boardId, title, user]);

  // Poda de la selección cuando una métrica deja de estar en el canvas.
  React.useEffect(() => {
    setSelectedIds((prev) => {
      const next = prev.filter((id) => canvasMetrics.some((m) => m.id === id));
      return next.length === prev.length ? prev : next;
    });
    setPrimaryId((prev) =>
      prev && !canvasMetrics.some((m) => m.id === prev) ? null : prev,
    );
  }, [canvasMetrics]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
    setPrimaryId(null);
  }, []);

  const isEditingTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    return (
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable)
    );
  };

  // Borrar (Delete/Backspace) saca del canvas todas las fichas seleccionadas.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (selectedIds.length === 0) return;
      if (isEditingTarget(e.target)) return;
      e.preventDefault();
      excludeMetrics(selectedIds);
      clearSelection();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIds, excludeMetrics, clearSelection]);

  // Undo / Redo: Cmd/Ctrl+Z y Cmd/Ctrl+Shift+Z (o Ctrl+Y).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (isEditingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Shift+1 = encajar todo · Shift+2 = encuadrar la selección (estilo Figma).
  // Usamos e.code (tecla física) para que funcione en cualquier distribución.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditingTarget(e.target)) return;
      if (e.code === "Digit1") {
        e.preventDefault();
        figjamRef.current?.zoomToFit();
      } else if (e.code === "Digit2") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        figjamRef.current?.zoomToSelection();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIds]);

  /** Selección desde el canvas: clic normal = solo esa; Shift/Cmd = alternar. */
  const handleCanvasSelect = React.useCallback(
    (m: Metric, additive: boolean) => {
      if (additive) {
        setSelectedIds((prev) =>
          prev.includes(m.id)
            ? prev.filter((id) => id !== m.id)
            : [...prev, m.id],
        );
      } else {
        setSelectedIds([m.id]);
      }
      setPrimaryId(m.id);
    },
    [],
  );

  /** Selección por recuadro (lasso): añade las fichas del recuadro a la selección. */
  const handleBoxSelect = React.useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const set = new Set(prev);
      for (const id of ids) set.add(id);
      return [...set];
    });
    setPrimaryId(ids[ids.length - 1] ?? null);
  }, []);

  /** Selección desde la bandeja lateral: reincluye al canvas si estaba fuera. */
  const handleTraySelect = React.useCallback(
    (m: Metric) => {
      if (excludedMetricIds.includes(m.id)) {
        // Fuera del canvas → añadir al centro y seleccionar.
        const center = figjamRef.current?.getViewportCenterNorm();
        if (center) includeMetricAt(m.id, center);
        else includeMetric(m.id);
        setSelectedIds([m.id]);
        setPrimaryId(m.id);
      } else {
        // Ya colocada → solo localizarla en el canvas (sin seleccionar).
        figjamRef.current?.focusMetric?.(m.id);
      }
    },
    [excludedMetricIds, includeMetric, includeMetricAt],
  );

  // Arrastrar una métrica desde la bandeja y soltarla en el canvas (con fantasma).
  // Clic sin mover = comportamiento actual (handleTraySelect, al centro).
  const trayDragRef = React.useRef<{
    metric: Metric;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [trayGhost, setTrayGhost] = React.useState<{
    metric: Metric;
    x: number;
    y: number;
    overCanvas: boolean;
  } | null>(null);

  const handleMetricPointerDown = React.useCallback(
    (metric: Metric, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      trayDragRef.current = { metric, startX: e.clientX, startY: e.clientY, moved: false };
      const onMove = (ev: PointerEvent) => {
        const d = trayDragRef.current;
        if (!d) return;
        if (!d.moved && Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) > 5) {
          d.moved = true;
        }
        if (d.moved) {
          // Sobre el canvas el fantasma se convierte en la ficha completa.
          const overCanvas =
            figjamRef.current?.screenToCanvasNorm(ev.clientX, ev.clientY) != null;
          setTrayGhost({ metric: d.metric, x: ev.clientX, y: ev.clientY, overCanvas });
        }
      };
      const onUp = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const d = trayDragRef.current;
        trayDragRef.current = null;
        setTrayGhost(null);
        if (!d) return;
        if (d.moved) {
          const norm = figjamRef.current?.screenToCanvasNorm(ev.clientX, ev.clientY);
          // Fuera del canvas → no añade.
          if (norm) {
            includeMetricAt(d.metric.id, norm);
            setSelectedIds([d.metric.id]);
            setPrimaryId(d.metric.id);
          }
        } else {
          handleTraySelect(d.metric);
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [includeMetricAt, handleTraySelect],
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
          <button
            type="button"
            onClick={() => setDataTableOpen((v) => !v)}
            aria-pressed={dataTableOpen}
            aria-label="Tabla de datos"
            title="Tabla de datos"
            className={cn(
              "ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
              dataTableOpen
                ? "border-[#0d99ff]/40 bg-[#f0f7ff] text-[#0d99ff]"
                : "border-[#e6e6e6] bg-white text-[#444] hover:bg-[#f7f7f7]",
            )}
          >
            <Table2 className="h-4 w-4" />
          </button>
          <span className="shrink-0 text-xs tabular-nums text-[#757575]">
            {selectedIds.length > 1 ? (
              <span className="mr-2 rounded-md bg-[#f0f7ff] px-1.5 py-0.5 font-medium text-[#0d99ff]">
                {selectedIds.length} sel.
              </span>
            ) : null}
            {canvasMetrics.length}/{metrics.length}
          </span>
          {boardId ? (
            <div className="flex shrink-0 items-center rounded-md border border-[#e6e6e6] bg-white">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Deshacer"
                title="Deshacer (⌘/Ctrl+Z)"
                className="inline-flex h-8 w-8 items-center justify-center rounded-l-md text-[#444] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:text-[#cfcfcf] disabled:hover:bg-transparent"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <span className="h-5 w-px bg-[#e6e6e6]" />
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Rehacer"
                title="Rehacer (⌘/Ctrl+Shift+Z)"
                className="inline-flex h-8 w-8 items-center justify-center rounded-r-md text-[#444] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:text-[#cfcfcf] disabled:hover:bg-transparent"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
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
          {boardId ? (
            <div className="relative" data-export-menu>
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                disabled={exporting !== null}
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#e6e6e6] bg-white px-2.5 text-xs font-medium text-[#444] transition-[background-color,border-color] hover:border-[#d9d9d9] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {exporting ? "Exportando…" : "Exportar"}
                </span>
              </button>
              {exportOpen ? (
                <div className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[180px] rounded-lg border border-[#e6e6e6] bg-white py-1 shadow-lg">
                  <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#949494]">
                    Exportar vista actual
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExport("png")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7]"
                  >
                    <FileImage className="h-3.5 w-3.5 text-[#757575]" />
                    Imagen PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#757575]" />
                    Documento PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#757575]" />
                    Tabla CSV
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
                selectedId={primaryId}
                onSelect={handleTraySelect}
                onMetricPointerDown={handleMetricPointerDown}
                cardColorByCategory={colorCardsByCategory}
                objectiveId={objectiveId}
                onObjectiveChange={handleObjectiveChange}
                audienceCount={audiences.length}
                onOpenAudiences={() => setAudienceModalOpen(true)}
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
                  selectedId={primaryId}
                  onSelect={(m) => {
                    handleTraySelect(m);
                    setFiltersOpen(false);
                  }}
                  objectiveId={objectiveId}
                  onObjectiveChange={handleObjectiveChange}
                  audienceCount={audiences.length}
                  onOpenAudiences={() => setAudienceModalOpen(true)}
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
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f3f3f3] p-1.5 md:p-2"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 24%)",
            }}
          >
            <FigJamBoard
              ref={figjamRef}
              metrics={visible}
              selectedIds={selectedIdSet}
              onSelect={handleCanvasSelect}
              onClearSelection={clearSelection}
              onBoxSelect={handleBoxSelect}
              dataTableOpen={dataTableOpen}
              onCloseDataTable={() => setDataTableOpen(false)}
            />
          </div>
        </div>

        {/* Right insight panel */}
        <MetricInsightPanel
          metric={primary}
          onClose={clearSelection}
          onOpenFullCard={(m) => {
            setDocsMetric(m);
            setDocsOpen(true);
          }}
          className={cn(!primary && "max-md:hidden")}
        />
      </div>

      <AudienceModal
        open={audienceModalOpen}
        onClose={() => setAudienceModalOpen(false)}
        audiences={metricContext.audiences}
        applied={audiences}
        onToggle={toggleAudience}
      />

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

      {trayGhost ? (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2"
          style={{ left: trayGhost.x, top: trayGhost.y }}
        >
          {trayGhost.overCanvas ? (
            <MetricCanvasCard
              metric={trayGhost.metric}
              colorByCategory={colorCardsByCategory}
              className="shadow-[0_14px_34px_rgba(0,0,0,0.2)]"
            />
          ) : (
            <span className="rounded-lg border border-[#0d99ff]/40 bg-white/95 px-3 py-2 text-[12px] font-medium text-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              {trayGhost.metric.shortName ?? trayGhost.metric.name}
            </span>
          )}
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
