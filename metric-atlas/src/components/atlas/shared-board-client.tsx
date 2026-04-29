"use client";

import * as React from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Metric } from "@/lib/types";
import { AtlasFiltersProvider } from "@/context/atlas-filters-context";
import { filterMetrics } from "@/lib/filters";
import { sanitizeBoard, type MatrixBoard } from "@/lib/matrix-boards";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { getSharedBoard } from "@/lib/boards/firestore";
import { useMetrics } from "@/lib/metrics/provider";
import { FigJamBoard } from "./figjam-board";

type ViewState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; board: MatrixBoard };

export function SharedBoardClient({ boardId }: { boardId: string }) {
  const { metrics, loading: metricsLoading } = useMetrics();
  const [state, setState] = React.useState<ViewState>({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    getSharedBoard(boardId)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setState({ kind: "missing" });
          return;
        }
        setState({
          kind: "ready",
          board: sanitizeBoard({ ...res.board, id: boardId }),
        });
      })
      .catch((err) => {
        console.error("[shared-board-client] load", err);
        if (!cancelled) setState({ kind: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  if (state.kind === "loading" || metricsLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Cargando matriz compartida…
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#f5f5f5] px-4 text-center">
        <p className="text-sm text-[#626262]">
          Esta matriz no está disponible o el enlace dejó de compartirse.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-[#0d99ff] hover:underline"
        >
          Ir a Metric Atlas
        </Link>
      </div>
    );
  }

  return (
    <AtlasFiltersProvider key={state.board.id} initialCanvas={state.board.canvas}>
      <SharedBoardCanvas metrics={metrics} board={state.board} />
    </AtlasFiltersProvider>
  );
}

function SharedBoardCanvas({
  metrics,
  board,
}: {
  metrics: Metric[];
  board: MatrixBoard;
}) {
  const { filters, excludedMetricIds } = useAtlasFilters();
  const visible = React.useMemo(
    () => filterMetrics(metrics, filters),
    [metrics, filters],
  );
  const canvasMetrics = React.useMemo(
    () => visible.filter((m) => !excludedMetricIds.includes(m.id)),
    [visible, excludedMetricIds],
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f5f5f5]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#e6e6e6] bg-white px-4">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f0f7ff] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#0d99ff]">
          <Eye className="h-3 w-3" />
          Vista pública
        </span>
        <span className="truncate text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
          {board.name}
        </span>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-[#757575]">
          {canvasMetrics.length}/{metrics.length}
        </span>
      </header>
      <div
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f3f3f3] p-3 md:p-4"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 24%)",
        }}
      >
        <FigJamBoard
          metrics={visible}
          selectedId={null}
          onSelect={() => {}}
        />
      </div>
    </div>
  );
}
