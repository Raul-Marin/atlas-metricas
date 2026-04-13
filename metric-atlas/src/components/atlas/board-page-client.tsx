"use client";

import * as React from "react";
import Link from "next/link";
import type { Metric } from "@/lib/types";
import { AtlasFiltersProvider } from "@/context/atlas-filters-context";
import { getBoardById, type MatrixBoard } from "@/lib/matrix-boards";
import { AtlasWorkspace } from "./atlas-workspace";
import { BoardPersistence } from "./board-persistence";

export function BoardPageClient({
  boardId,
  metrics,
}: {
  boardId: string;
  metrics: Metric[];
}) {
  const [board, setBoard] = React.useState<MatrixBoard | "missing" | "loading">(
    "loading",
  );

  React.useEffect(() => {
    const b = getBoardById(boardId);
    setBoard(b ?? "missing");
    const onStorage = () => {
      const next = getBoardById(boardId);
      setBoard(next ?? "missing");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("metric-atlas-boards-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("metric-atlas-boards-changed", onStorage);
    };
  }, [boardId]);

  if (board === "loading") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Cargando matrix…
      </div>
    );
  }

  if (board === "missing") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#f5f5f5] px-4">
        <p className="text-center text-sm text-[#626262]">
          No encontramos esta matrix. Puede haberse eliminado o el enlace es incorrecto.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-[#0d99ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b87e0]"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <AtlasFiltersProvider key={board.id} initialCanvas={board.canvas}>
      <BoardPersistence boardId={board.id} />
      <AtlasWorkspace metrics={metrics} boardId={board.id} initialTitle={board.name} />
    </AtlasFiltersProvider>
  );
}
