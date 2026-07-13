"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import type { Metric } from "@/lib/types";
import type { MatrixBoard } from "@/lib/matrix-boards";
import { CANVAS_COVER } from "@/lib/matrix-boards";
import { useMetricContext } from "@/lib/context/provider";
import { cn } from "@/lib/utils";
import { BoardThumbnailPreview } from "./board-thumbnail-preview";

/** Modal para elegir la portada de un board: el lienzo o una de las imágenes. */
export function CoverPickerModal({
  board,
  metrics,
  fallbackColor,
  onSelect,
  onClose,
}: {
  board: MatrixBoard | null;
  metrics: Metric[];
  fallbackColor: string;
  onSelect: (cover: string) => void;
  onClose: () => void;
}) {
  const ctx = useMetricContext();
  if (!board) return null;
  const current = board.cover || CANVAS_COVER;

  const Tile = ({
    selected,
    label,
    children,
    onClick,
  }: {
    selected: boolean;
    label: string;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow] duration-150",
        selected
          ? "border-[#0d99ff] ring-2 ring-[#0d99ff]/25"
          : "border-[#e6e6e6] hover:border-[#d4d4d4]",
      )}
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-[#f3f3f3]">
        {children}
      </div>
      <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-[#1e1e1e]">
        {label}
      </span>
      {selected ? (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d99ff] text-white shadow">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Portada del board"
    >
      <div className="absolute inset-0 bg-black/25" onClick={onClose} role="presentation" />
      <div className="relative z-10 flex max-h-[80vh] w-[520px] max-w-[94vw] flex-col rounded-xl border border-[#e6e6e6] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
          <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1e1e1e]">
            Portada
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto p-4 sm:grid-cols-3">
          <Tile
            selected={current === CANVAS_COVER}
            label="Canvas del archivo"
            onClick={() => onSelect(CANVAS_COVER)}
          >
            <BoardThumbnailPreview
              board={board}
              metrics={metrics}
              fallbackColor={fallbackColor}
              className="h-full w-full"
            />
          </Tile>
          {ctx.covers.map((c) => (
            <Tile
              key={c.id}
              selected={current === c.id}
              label={c.label}
              onClick={() => onSelect(c.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt="" className="h-full w-full object-cover" />
            </Tile>
          ))}
        </div>
      </div>
    </div>
  );
}
