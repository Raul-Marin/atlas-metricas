"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTemplates } from "@/lib/templates/provider";
import {
  createTemplate,
  deleteTemplate,
  seedBuiltinTemplates,
  updateTemplate,
  type MatrixTemplate,
} from "@/lib/templates/firestore";
import {
  defaultBoardCanvas,
  sanitizeBoard,
  type MatrixBoard,
  type MatrixBoardCanvasSettings,
} from "@/lib/matrix-boards";
import { MATRIX_AXIS_OPTIONS, normalizeAxes } from "@/lib/matrix-axes";
import type { MatrixAxisId } from "@/lib/types";
import { cn } from "@/lib/utils";

const labelClass =
  "block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]";
const inputClass =
  "w-full rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const PALETTE = [
  "#A855F7",
  "#0EA5E9",
  "#F97316",
  "#10B981",
  "#F43F5E",
  "#FACC15",
  "#22D3EE",
  "#818CF8",
];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function emptyTemplate(): MatrixTemplate {
  return {
    id: newId(),
    name: "",
    description: "",
    accentColor: PALETTE[0],
    canvas: defaultBoardCanvas(),
  };
}

/** Lista los boards del admin para copiar su canvas como plantilla. */
function useOwnerBoards(uid: string | null): MatrixBoard[] {
  const [boards, setBoards] = React.useState<MatrixBoard[]>([]);

  React.useEffect(() => {
    if (!uid) {
      setBoards([]);
      return;
    }
    let unsub: Unsubscribe | null = null;
    try {
      const q = query(
        collection(getDb(), "users", uid, "boards"),
        orderBy("updatedAt", "desc"),
      );
      unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) =>
          sanitizeBoard({ ...(d.data() as MatrixBoard), id: d.id }),
        );
        setBoards(list);
      });
    } catch (err) {
      console.error("[admin-templates] boards", err);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [uid]);

  return boards;
}

function TemplateFormModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: MatrixTemplate;
  onClose: () => void;
  onSubmit: (
    payload: { template: MatrixTemplate; isCreate: boolean },
  ) => Promise<void> | void;
}) {
  const isCreate = !initial;
  const { user } = useAuth();
  const ownerBoards = useOwnerBoards(user?.uid ?? null);

  const [draft, setDraft] = React.useState<MatrixTemplate>(() =>
    initial ? { ...initial } : emptyTemplate(),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial } : emptyTemplate());
    setError(null);
    setBusy(false);
  }, [open, initial]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const setCanvas = (patch: Partial<MatrixBoardCanvasSettings>) => {
    setDraft((d) => ({
      ...d,
      canvas: {
        ...d.canvas,
        ...patch,
        matrixAxes: normalizeAxes({
          ...d.canvas.matrixAxes,
          ...(patch.matrixAxes ?? {}),
        }),
      },
    }));
  };

  const importFromBoard = (boardId: string) => {
    const board = ownerBoards.find((b) => b.id === boardId);
    if (!board) return;
    setDraft((d) => ({
      ...d,
      canvas: {
        ...board.canvas,
        matrixAxes: normalizeAxes(board.canvas.matrixAxes),
      },
      name: d.name || board.name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const id = isCreate ? slugify(draft.name) || draft.id : draft.id;
    const payload: MatrixTemplate = {
      ...draft,
      id,
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
      accentColor: draft.accentColor || undefined,
    };
    setBusy(true);
    try {
      await onSubmit({ template: payload, isCreate });
      onClose();
    } catch (err) {
      console.error("[template-form] submit", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const axes = draft.canvas.matrixAxes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex h-full w-full max-w-[520px] flex-col bg-white shadow-xl"
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e6e6e6] bg-white px-4">
          <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
            {isCreate ? "Nueva plantilla" : `Editar ${draft.name}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={labelClass}>Nombre</span>
              <input
                type="text"
                className={inputClass}
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                required
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Color portada</span>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() =>
                      setDraft((d) => ({ ...d, accentColor: c }))
                    }
                    className={cn(
                      "h-6 w-6 rounded-full ring-2 ring-offset-1",
                      draft.accentColor === c
                        ? "ring-[#0d99ff]"
                        : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </label>
          </div>
          <label className="block space-y-1">
            <span className={labelClass}>Descripción (opcional)</span>
            <textarea
              className={`${inputClass} font-mono text-[11px]`}
              rows={2}
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </label>

          <fieldset className="space-y-2 rounded-md border border-[#e6e6e6] bg-[#fafafa] p-3">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1e1e1e]">
              Canvas inicial
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Eje X</span>
                <select
                  className={inputClass}
                  value={axes.axisX}
                  onChange={(e) =>
                    setCanvas({
                      matrixAxes: {
                        ...axes,
                        axisX: e.target.value as MatrixAxisId,
                      },
                    })
                  }
                >
                  {MATRIX_AXIS_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Eje Y</span>
                <select
                  className={inputClass}
                  value={axes.axisY}
                  onChange={(e) =>
                    setCanvas({
                      matrixAxes: {
                        ...axes,
                        axisY: e.target.value as MatrixAxisId,
                      },
                    })
                  }
                >
                  {MATRIX_AXIS_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-[#444]">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.canvas.showMatrixQuadrantColors}
                  onChange={(e) =>
                    setCanvas({ showMatrixQuadrantColors: e.target.checked })
                  }
                />
                Cuadrantes con color
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.canvas.colorCardsByCategory}
                  onChange={(e) =>
                    setCanvas({ colorCardsByCategory: e.target.checked })
                  }
                />
                Tarjetas con color de categoría
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.canvas.mapClusterMode}
                  onChange={(e) =>
                    setCanvas({ mapClusterMode: e.target.checked })
                  }
                />
                Modo cluster
              </label>
            </div>
            <div>
              <span className={labelClass}>Importar canvas desde un board</span>
              <select
                className={inputClass}
                onChange={(e) => {
                  if (e.target.value) importFromBoard(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona un board…
                </option>
                {ownerBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[#949494]">
                Copia ejes, filtros, toggles, métricas excluidas y posiciones
                manuales del board seleccionado.
              </p>
            </div>
            <div className="grid gap-2 pt-1 text-[11px] text-[#626262] sm:grid-cols-2">
              <p>
                <span className="font-medium text-[#1e1e1e]">Excluidas:</span>{" "}
                {draft.canvas.excludedMetricIds.length}
              </p>
              <p>
                <span className="font-medium text-[#1e1e1e]">Posiciones manuales:</span>{" "}
                {Object.keys(draft.canvas.metricManualPositions).length}
              </p>
            </div>
          </fieldset>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e6e6e6] bg-white px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#626262] hover:bg-[#f5f5f5]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[#0d99ff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0b87e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Guardando…"
              : isCreate
                ? "Crear plantilla"
                : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function AdminTemplatesPage() {
  const { templates, loading } = useTemplates();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<MatrixTemplate | undefined>(undefined);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [seedBusy, setSeedBusy] = React.useState(false);

  const onSeedBuiltin = async () => {
    setFeedback(null);
    setSeedBusy(true);
    try {
      const res = await seedBuiltinTemplates();
      setFeedback(
        `Predefinidas · creadas ${res.created} · ya existían ${res.skipped} (total ${res.total}).`,
      );
    } catch (err) {
      console.error("[admin-templates] seed builtin", err);
      setFeedback(err instanceof Error ? err.message : String(err));
    } finally {
      setSeedBusy(false);
    }
  };

  const onSubmit = async (payload: { template: MatrixTemplate; isCreate: boolean }) => {
    if (payload.isCreate) {
      await createTemplate(payload.template);
    } else {
      const { id: _id, ...patch } = payload.template;
      void _id;
      await updateTemplate(payload.template.id, patch);
    }
  };

  const onDelete = async (t: MatrixTemplate) => {
    if (!window.confirm(`¿Eliminar "${t.name}"? No se puede deshacer.`)) return;
    setPendingId(t.id);
    try {
      await deleteTemplate(t.id);
    } catch (err) {
      console.error("[admin-templates] delete", err);
      setFeedback(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#1e1e1e]">
            Plantillas
          </h1>
          <p className="text-xs text-[#757575]">
            Las plantillas se ofrecen al usuario en el dashboard al crear una
            nueva matrix. Guardan el canvas completo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSeedBuiltin}
            disabled={seedBusy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#e6e6e6] bg-white px-3 text-xs font-medium text-[#444] hover:border-[#d9d9d9] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0d99ff]" />
            {seedBusy ? "Sembrando…" : "Sembrar predefinidas"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0d99ff] px-3 text-xs font-medium text-white hover:bg-[#0b87e0]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva plantilla
          </button>
        </div>
      </header>

      {feedback ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {feedback}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#f0f0f0] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
            <tr>
              <th className="px-4 py-2.5">Plantilla</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Ejes</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Excluidas / manuales</th>
              <th className="w-[180px] px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#757575]">
                  Cargando…
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#757575]">
                  Aún no hay plantillas. Crea una con el botón &quot;Nueva plantilla&quot;.
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 shrink-0 rounded-md"
                        style={{ backgroundColor: t.accentColor ?? "#e5e7eb" }}
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium text-[#1e1e1e]">
                          {t.name}
                        </span>
                        <span className="truncate text-[11px] text-[#757575]">
                          {t.description ?? "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-2.5 text-[11px] text-[#444] md:table-cell">
                    {t.canvas.matrixAxes.axisX} × {t.canvas.matrixAxes.axisY}
                  </td>
                  <td className="hidden px-4 py-2.5 text-[11px] text-[#444] md:table-cell">
                    {t.canvas.excludedMetricIds.length} ·{" "}
                    {Object.keys(t.canvas.metricManualPositions).length}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(t)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#444] hover:bg-[#f5f5f5]"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        disabled={pendingId === t.id}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-[#949494]">
        <Sparkles className="h-3 w-3 text-[#0d99ff]" />
        Sugerencia: crea un board en tu cuenta con la configuración deseada y
        usa &quot;Importar canvas desde un board&quot; para clonarlo como plantilla.
      </p>

      <TemplateFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={onSubmit}
      />
      <TemplateFormModal
        open={Boolean(editing)}
        initial={editing}
        onClose={() => setEditing(undefined)}
        onSubmit={onSubmit}
      />
    </div>
  );
}
