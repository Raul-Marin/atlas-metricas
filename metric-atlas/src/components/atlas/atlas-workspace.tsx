"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metric } from "@/lib/types";
import { filterMetrics } from "@/lib/filters";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { FiltersBar } from "@/components/layout/filters-bar";
import { FigJamBoard } from "./figjam-board";
import { MetricInsightPanel } from "./metric-insight-panel";
import { MetricsTray } from "./metrics-tray";
import { cn } from "@/lib/utils";
import { renameBoard } from "@/lib/matrix-boards";

export function AtlasWorkspace({
  metrics,
  boardId,
  initialTitle,
}: {
  metrics: Metric[];
  boardId?: string;
  initialTitle?: string;
}) {
  const { filters } = useAtlasFilters();
  const visible = React.useMemo(
    () => filterMetrics(metrics, filters),
    [metrics, filters],
  );
  const [selected, setSelected] = React.useState<Metric | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [title, setTitle] = React.useState(initialTitle ?? "Metric Atlas");

  React.useEffect(() => {
    if (initialTitle !== undefined) setTitle(initialTitle);
  }, [initialTitle]);

  const flushTitle = React.useCallback(() => {
    if (boardId) renameBoard(boardId, title);
  }, [boardId, title]);

  React.useEffect(() => {
    if (selected && !visible.some((m) => m.id === selected.id)) {
      setSelected(null);
    }
  }, [selected, visible]);

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f5f5f5]">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-[#e6e6e6] bg-white/94 px-3 shadow-sm backdrop-blur-sm sm:gap-3 sm:px-4">
        {boardId ? (
          <>
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium tracking-[-0.01em] text-[#626262] hover:bg-[#f0f0f0]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Matrices</span>
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={flushTitle}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="min-w-0 max-w-[min(100%,280px)] flex-1 border-b border-transparent bg-transparent text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e] outline-none focus:border-[#b3b3b3] sm:max-w-[320px]"
              aria-label="Nombre de la matrix"
            />
          </>
        ) : (
          <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">Metric Atlas</span>
        )}
        <span className="hidden shrink-0 text-xs text-[#757575] lg:inline">Canvas infinito</span>
        <Link
          href="/metrics"
          className="hidden shrink-0 rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1 text-xs font-medium text-[#444] transition-[background-color,border-color] hover:border-[#d9d9d9] hover:bg-[#f7f7f7] lg:inline-flex"
        >
          Documentación
        </Link>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-[#757575]">
          {visible.length}/{metrics.length}
        </span>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs font-medium text-[#444] shadow-sm hover:bg-[#f7f7f7] md:hidden"
        >
          Variables
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[272px] shrink-0 flex-col border-r border-[#e6e6e6] bg-white md:flex md:overflow-hidden">
          <div className="overflow-y-auto space-y-3 p-3.5">
            <FiltersBar variant="minimal" />
            <MetricsTray
              metrics={visible}
              selectedId={selected?.id ?? null}
              onSelect={(m) => setSelected(m)}
            />
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
              <div className="flex items-center justify-between border-b border-[#f0f0f0] px-3 py-2.5">
                <span className="text-sm font-medium text-[#1e1e1e]">Variables</span>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-md px-2 py-1 text-xs text-[#757575] hover:bg-[#f5f5f5]"
                >
                  Cerrar
                </button>
              </div>
              <div className="overflow-y-auto space-y-3 p-3.5">
                <FiltersBar variant="minimal" />
                <MetricsTray
                  metrics={visible}
                  selectedId={selected?.id ?? null}
                  onSelect={(m) => {
                    setSelected(m);
                    setFiltersOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f3f3f3] p-3 md:p-4"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 24%)",
          }}
        >
          <FigJamBoard
            metrics={visible}
            selectedId={selected?.id ?? null}
            onSelect={(m) => setSelected(m)}
          />
        </div>

        <MetricInsightPanel
          metric={selected}
          onClose={() => setSelected(null)}
          className={cn(!selected && "max-md:hidden")}
        />
      </div>
    </div>
  );
}
