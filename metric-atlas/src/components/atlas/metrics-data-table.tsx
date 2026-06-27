"use client";

import * as React from "react";
import { GripHorizontal, X } from "lucide-react";
import type { MatrixAxesState, Metric } from "@/lib/types";
import { MATRIX_AXIS_OPTIONS, axisEndLabels } from "@/lib/matrix-axes";
import { cn } from "@/lib/utils";

export type DataTableRow = { id: string; x: number; y: number; metric: Metric };

type SortKey = "name" | "x" | "y";

const MIN_W = 280;
const MIN_H = 180;

function axisLabel(id: MatrixAxesState["axisX"]): string {
  return MATRIX_AXIS_OPTIONS.find((o) => o.id === id)?.label ?? "Eje";
}

/** Celda con barra + número (0–100 = posición hacia el polo `endHigh`). */
function ValueCell({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f2]">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[#0d99ff]"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-[#1e1e1e]">
        {pct}
      </span>
    </div>
  );
}

/**
 * Tabla de datos del canvas: una fila por métrica visible, con su valor en los
 * dos ejes activos. Flotante dentro del canvas (no sobre cabecera ni paneles),
 * arrastrable por la cabecera y reescalable. Los valores son en vivo: vienen de
 * las posiciones reales de las fichas (se actualizan al arrastrar).
 */
export function MetricsDataTable({
  open,
  onClose,
  axes,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  axes: MatrixAxesState;
  rows: DataTableRow[];
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 16, y: 16 });
  const [size, setSize] = React.useState({ w: 380, h: 300 });
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "y",
    dir: 1,
  });

  const xLabel = axisLabel(axes.axisX);
  const yLabel = axisLabel(axes.axisY);
  const xEnds = axisEndLabels(axes.axisX);
  const yEnds = axisEndLabels(axes.axisY);

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let d: number;
      if (sort.key === "name") {
        const an = a.metric.shortName ?? a.metric.name;
        const bn = b.metric.shortName ?? b.metric.name;
        d = an.localeCompare(bn, "es", { sensitivity: "base" });
      } else {
        d = a[sort.key] - b[sort.key];
      }
      return d * sort.dir;
    });
    return arr;
  }, [rows, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  };

  const clampPos = React.useCallback(
    (next: { x: number; y: number }, w: number, h: number) => {
      const parent = panelRef.current?.parentElement;
      if (!parent) return next;
      const maxX = Math.max(0, parent.clientWidth - w);
      const maxY = Math.max(0, parent.clientHeight - h);
      return {
        x: Math.min(maxX, Math.max(0, next.x)),
        y: Math.min(maxY, Math.max(0, next.y)),
      };
    },
    [],
  );

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = { ...pos };
    const onMove = (ev: PointerEvent) => {
      setPos(clampPos({ x: orig.x + (ev.clientX - sx), y: orig.y + (ev.clientY - sy) }, size.w, size.h));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startResize = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = { ...size };
    const onMove = (ev: PointerEvent) => {
      const parent = panelRef.current?.parentElement;
      const maxW = parent ? parent.clientWidth - pos.x : Infinity;
      const maxH = parent ? parent.clientHeight - pos.y : Infinity;
      setSize({
        w: Math.min(maxW, Math.max(MIN_W, orig.w + (ev.clientX - sx))),
        h: Math.min(maxH, Math.max(MIN_H, orig.h + (ev.clientY - sy))),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Reajusta el panel si el canvas se encoge y queda fuera de límites.
  React.useEffect(() => {
    if (!open) return;
    setPos((p) => clampPos(p, size.w, size.h));
  }, [open, size.w, size.h, clampPos]);

  if (!open) return null;

  const SortHeader = ({ label, k, hint }: { label: string; k: SortKey; hint?: string }) => (
    <th className="sticky top-0 z-[1] bg-[#fafafa] px-2 py-1.5 text-left font-medium">
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="flex flex-col items-start gap-0.5 text-left"
      >
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#626262]">
          {label}
          {sort.key === k ? (
            <span className="text-[#0d99ff]">{sort.dir === 1 ? "▲" : "▼"}</span>
          ) : null}
        </span>
        {hint ? (
          <span className="text-[9px] font-normal normal-case text-[#a0a0a0]">{hint}</span>
        ) : null}
      </button>
    </th>
  );

  return (
    <div
      ref={panelRef}
      className="absolute z-20 flex flex-col overflow-hidden rounded-xl border border-[#dcdcdc] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      role="dialog"
      aria-label="Tabla de datos del canvas"
    >
      <header
        onPointerDown={startDrag}
        className="flex h-9 shrink-0 cursor-grab items-center gap-2 border-b border-[#eee] bg-[#fcfcfc] px-2.5 active:cursor-grabbing"
      >
        <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-[#bdbdbd]" />
        <span className="flex-1 truncate text-[11px] font-semibold tracking-[-0.01em] text-[#1e1e1e]">
          Datos · {rows.length} {rows.length === 1 ? "métrica" : "métricas"}
        </span>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Cerrar tabla"
          className="shrink-0 rounded p-1 text-[#757575] transition-colors hover:bg-[#f0f0f0] hover:text-[#1e1e1e]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-[#949494]">
            No hay métricas en el canvas. Añádelas desde la bandeja.
          </p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-[#eee]">
                <SortHeader label="Métrica" k="name" />
                <SortHeader label={xLabel} k="x" hint={`→ ${xEnds.high}`} />
                <SortHeader label={yLabel} k="y" hint={`→ ${yEnds.high}`} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-b border-[#f4f4f4] hover:bg-[#fafafa]">
                  <td className="max-w-[120px] truncate px-2 py-1.5 text-[#1e1e1e]">
                    {r.metric.shortName ?? r.metric.name}
                  </td>
                  <td className="px-2 py-1.5">
                    <ValueCell value={r.x} />
                  </td>
                  <td className="px-2 py-1.5">
                    <ValueCell value={r.y} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        aria-label="Redimensionar tabla"
        onPointerDown={startResize}
        className={cn(
          "absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize",
          "after:absolute after:bottom-1 after:right-1 after:h-2 after:w-2",
          "after:border-b-2 after:border-r-2 after:border-[#c4c4c4] after:content-['']",
        )}
      />
    </div>
  );
}
