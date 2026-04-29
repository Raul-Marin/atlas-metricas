"use client";

import * as React from "react";
import { useAtlasFilters } from "@/context/atlas-filters-context";
import { MATRIX_AXIS_OPTIONS } from "@/lib/matrix-axes";
import type { MatrixAxisId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MatrixAxisControls({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const {
    matrixAxes,
    setMatrixAxes,
    resetMatrixAxes,
    colorCardsByCategory,
    setColorCardsByCategory,
    showMatrixQuadrantColors,
    setShowMatrixQuadrantColors,
    mapClusterMode,
    setMapClusterMode,
    metricManualPositions,
    clearMetricManualPositions,
  } = useAtlasFilters();

  const manualCount = Object.keys(metricManualPositions).length;

  const setX = (axisX: MatrixAxisId) => {
    setMatrixAxes((a) => ({ ...a, axisX }));
  };
  const setY = (axisY: MatrixAxisId) => {
    setMatrixAxes((a) => ({ ...a, axisY }));
  };

  const isDefault =
    matrixAxes.axisX === "measurementType" && matrixAxes.axisY === "layer";
  const activeCount =
    (matrixAxes.axisX !== "measurementType" ? 1 : 0) +
    (matrixAxes.axisY !== "layer" ? 1 : 0) +
    (colorCardsByCategory ? 1 : 0) +
    (showMatrixQuadrantColors ? 0 : 1) +
    (mapClusterMode ? 1 : 0);
  const [open, setOpen] = React.useState(!compact);

  return (
    <section
      className={cn(
        "rounded-md border border-[#ececec] bg-[#fcfcfc]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#757575]">
          Ejes del mapa
        </span>
        <span className="flex items-center gap-2">
          {activeCount > 0 ? (
            <span className="rounded-md bg-[#f0f7ff] px-1.5 py-0.5 text-[10px] font-medium text-[#0d99ff]">
              {activeCount}
            </span>
          ) : null}
          <span className="text-xs text-[#949494]">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-[#eeeeee] px-3 py-3">
          {!isDefault ? (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={resetMatrixAxes}
                className="text-[10px] text-[#757575] underline-offset-2 hover:text-[#1e1e1e] hover:underline"
              >
                Restablecer
              </button>
            </div>
          ) : null}
          <p
            className={cn(
              "mb-3 text-[#626262]",
              compact ? "text-[10px] leading-snug" : "text-xs",
            )}
          >
            Cambia las variables para redistribuir las fichas en el tablero 2×2.
          </p>
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-[#757575]">
                Horizontal (izq. → der.)
              </span>
              <select
                className="w-full rounded-md border border-[#e6e6e6] bg-white px-2 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15"
                value={matrixAxes.axisX}
                onChange={(e) => setX(e.target.value as MatrixAxisId)}
              >
                {MATRIX_AXIS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-[#757575]">
                Vertical (arriba → abajo)
              </span>
              <select
                className="w-full rounded-md border border-[#e6e6e6] bg-white px-2 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15"
                value={matrixAxes.axisY}
                onChange={(e) => setY(e.target.value as MatrixAxisId)}
              >
                {MATRIX_AXIS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 border-t border-[#eeeeee] pt-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#cfcfcf] text-[#0d99ff]"
                checked={showMatrixQuadrantColors}
                onChange={(e) => setShowMatrixQuadrantColors(e.target.checked)}
              />
              <span>
                <span
                  className={cn(
                    "block font-medium text-[#1e1e1e]",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  Colorear cuadrantes de la matriz
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[#757575]",
                    compact ? "text-[10px] leading-snug" : "text-[11px]",
                  )}
                >
                  Activado: cada cuadrante mantiene un tono suave. Desactivado: ves
                  solo el `dot grid` continuo del canvas.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-3 border-t border-[#eeeeee] pt-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#cfcfcf] text-[#0d99ff]"
                checked={colorCardsByCategory}
                onChange={(e) => setColorCardsByCategory(e.target.checked)}
              />
              <span>
                <span
                  className={cn(
                    "block font-medium text-[#1e1e1e]",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  Colorear fichas por categoría
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[#757575]",
                    compact ? "text-[10px] leading-snug" : "text-[11px]",
                  )}
                >
                  Desactivado: aspecto neutro (ámbar). Activado: cada métrica usa el
                  color de su tipo en la leyenda.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-3 border-t border-[#eeeeee] pt-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#cfcfcf] text-[#0d99ff]"
                checked={mapClusterMode}
                onChange={(e) => setMapClusterMode(e.target.checked)}
              />
              <span>
                <span
                  className={cn(
                    "block font-medium text-[#1e1e1e]",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  Modo cluster en el mapa
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[#757575]",
                    compact ? "text-[10px] leading-snug" : "text-[11px]",
                  )}
                >
                  Desactivado: siempre ves cada métrica como ficha. Activado: al
                  alejar el zoom se agrupan; clic en el círculo acerca al grupo.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-3 border-t border-[#eeeeee] pt-3">
            <p
              className={cn(
                "mb-2 text-[#626262]",
                compact ? "text-[10px] leading-snug" : "text-xs",
              )}
            >
              Las fichas se colocan solas sin solapes. Si las mueves, se guarda la
              posición en esta matrix.
            </p>
            {manualCount > 0 ? (
              <button
                type="button"
                onClick={clearMetricManualPositions}
                className="text-[10px] font-medium text-[#626262] underline-offset-2 hover:text-[#0d99ff] hover:underline"
              >
                Quitar posiciones manuales ({manualCount})
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
