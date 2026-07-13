"use client";

import type { Metric } from "@/lib/types";
import type { MatrixBoard } from "@/lib/matrix-boards";
import { CANVAS_COVER } from "@/lib/matrix-boards";
import { useMetricContext } from "@/lib/context/provider";
import { cn } from "@/lib/utils";
import { BoardThumbnailPreview } from "./board-thumbnail-preview";

/**
 * Portada de un board en el grid: imagen si `board.cover` es un id de portada,
 * o el mini-preview del lienzo si es "canvas" (o desconocido).
 */
export function BoardCover({
  board,
  metrics,
  fallbackColor,
  className,
}: {
  board: MatrixBoard;
  metrics: Metric[];
  fallbackColor: string;
  className?: string;
}) {
  const ctx = useMetricContext();
  const cover =
    board.cover && board.cover !== CANVAS_COVER
      ? ctx.covers.find((c) => c.id === board.cover)
      : null;

  if (cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={cover.src}
        alt=""
        className={cn("w-full bg-[#f3f3f3] object-cover", className)}
      />
    );
  }

  return (
    <BoardThumbnailPreview
      board={board}
      metrics={metrics}
      fallbackColor={fallbackColor}
      className={className}
    />
  );
}
