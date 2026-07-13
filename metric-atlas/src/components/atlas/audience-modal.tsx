"use client";

import { X } from "lucide-react";
import type { DimensionValue } from "@/lib/context/types";
import { cn } from "@/lib/utils";

/**
 * Modal pequeña sobre el canvas para ver/editar las audiencias aplicadas a la
 * matriz. Misma UI en plantilla (trae unas marcadas) y en board vacío (ninguna).
 */
export function AudienceModal({
  open,
  onClose,
  audiences,
  applied,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  audiences: DimensionValue[];
  applied: string[];
  onToggle: (id: string) => void;
}) {
  if (!open) return null;
  const appliedSet = new Set(applied);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Audiencia de la matriz"
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} role="presentation" />
      <div className="relative z-10 w-[320px] max-w-[92vw] rounded-xl border border-[#e6e6e6] bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1e1e1e]">
            Audiencia
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
        <p className="mb-3 text-[11px] leading-[1.5] text-[#757575]">
          A quién va dirigida esta matriz. Marca o desmarca para añadir o quitar.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {audiences.map((a) => {
            const on = appliedSet.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onToggle(a.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-[background-color,border-color,color] duration-150",
                  on
                    ? "border-[#0d99ff] bg-[#0d99ff]/10 text-[#0d99ff]"
                    : "border-[#e6e6e6] bg-white text-[#626262] hover:border-[#d4d4d4]",
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: a.color ?? "#9ca3af" }}
                  aria-hidden
                />
                {a.label}
              </button>
            );
          })}
        </div>
        {applied.length === 0 ? (
          <p className="mt-3 text-[10px] italic text-[#949494]">
            Sin audiencia aplicada.
          </p>
        ) : null}
      </div>
    </div>
  );
}
