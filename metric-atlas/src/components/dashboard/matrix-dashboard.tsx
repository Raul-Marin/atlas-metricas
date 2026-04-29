"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  FileText,
  Folder,
  Home,
  LayoutGrid,
  List,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  type MatrixBoard,
} from "@/lib/matrix-boards";
import {
  MetricsFiltersCard,
  MetricsNavCard,
  MetricsResultsGrid,
  useMetricsFilters,
} from "@/components/metric/metrics-library";
import { MetricDetail } from "@/components/metric/metric-detail";
import { useMetrics } from "@/lib/metrics/provider";
import { useTemplates } from "@/lib/templates/provider";
import type { MatrixTemplate } from "@/lib/templates/firestore";
import type { Metric } from "@/lib/types";
import {
  createBoard,
  createSpace,
  deleteBoard,
  renameBoard,
  setBoardSpace,
  toggleStarBoard,
} from "@/lib/boards/firestore";
import { useBoards } from "@/lib/boards/use-boards";
import { useAuth } from "@/lib/auth/auth-provider";

/** Paleta de colores sólidos vivos para los thumbnails de boards. */
const THUMB_PALETTE = [
  "#FBBF24", // amber
  "#FB923C", // orange
  "#F87171", // red-light
  "#EC4899", // pink
  "#C084FC", // purple
  "#818CF8", // indigo
  "#60A5FA", // blue
  "#22D3EE", // cyan
  "#2DD4BF", // teal
  "#34D399", // emerald
  "#A3E635", // lime
  "#FACC15", // yellow
] as const;

/** Color estable derivado del id; con UUID v4 e ≥10 colores la repetición visible es rara. */
function thumbColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return THUMB_PALETTE[Math.abs(h) % THUMB_PALETTE.length]!;
}

function userInitials(user: User | null): string {
  const name = user?.displayName || user?.email || "";
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function userShortName(user: User | null): string {
  if (user?.displayName) {
    const parts = user.displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts[0] ?? "Usuario";
    const first = parts[0]!;
    const rest = parts.slice(1).map((p) => `${p[0]!.toUpperCase()}.`).join("");
    return `${first} ${rest}`;
  }
  if (user?.email) return user.email.split("@")[0]!;
  return "Usuario";
}

function UserAvatar({ user, size = 28 }: { user: User | null; size?: number }) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-semibold text-amber-900"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {userInitials(user)}
    </span>
  );
}

function BoardThumbnail({
  board,
  color,
  className,
}: {
  board?: Pick<MatrixBoard, "id">;
  color?: string;
  className?: string;
}) {
  const bg = color ?? (board?.id ? thumbColor(board.id) : "#e5e7eb");
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: bg }}
      aria-hidden
    />
  );
}

export function MatrixDashboard() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { boards, spaces, loading, error } = useBoards();
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [menuId, setMenuId] = React.useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [spaceDraft, setSpaceDraft] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const [tab, setTab] = React.useState<"home" | "docs">("home");
  const [docsMetric, setDocsMetric] = React.useState<Metric | null>(null);
  const { activeMetrics: allMetrics } = useMetrics();
  const { activeTemplates } = useTemplates();
  const docsFilters = useMetricsFilters(allMetrics);

  React.useEffect(() => {
    if (tab !== "docs") setDocsMetric(null);
  }, [tab]);

  React.useEffect(() => {
    const close = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      if (!t.closest("[data-board-actions]")) setMenuId(null);
      if (!t.closest("[data-user-menu]")) setUserMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let b = [...boards];
    if (activeSpaceId !== "all") {
      b = b.filter((x) => (activeSpaceId === "none" ? x.spaceId === null : x.spaceId === activeSpaceId));
    }
    if (q) b = b.filter((x) => x.name.toLowerCase().includes(q));
    return b;
  }, [activeSpaceId, boards, query]);

  const starred = React.useMemo(
    () =>
      boards
        .filter((b) => b.starred)
        .filter((b) =>
          activeSpaceId === "all"
            ? true
            : activeSpaceId === "none"
              ? b.spaceId === null
              : b.spaceId === activeSpaceId,
        )
        .slice(0, 8),
    [activeSpaceId, boards],
  );

  const recent = React.useMemo(() => {
    return [...boards]
      .filter((b) =>
        activeSpaceId === "all"
          ? true
          : activeSpaceId === "none"
            ? b.spaceId === null
            : b.spaceId === activeSpaceId,
      )
      .slice(0, 6);
  }, [activeSpaceId, boards]);

  const goBoard = (id: string) => router.push(`/board/${id}`);

  const onCreateBlank = async () => {
    if (!user) return;
    const b = await createBoard(user.uid, "Matrix sin título", {
      excludedMetricIds: allMetrics.map((m) => m.id),
    });
    if (activeSpaceId !== "all" && activeSpaceId !== "none") {
      await setBoardSpace(user.uid, b.id, activeSpaceId);
    }
    goBoard(b.id);
  };

  const onTemplate = async (template: MatrixTemplate) => {
    if (!user) return;
    const board = await createBoard(user.uid, template.name, template.canvas);
    if (activeSpaceId !== "all" && activeSpaceId !== "none") {
      await setBoardSpace(user.uid, board.id, activeSpaceId);
    }
    goBoard(board.id);
  };

  const addSpace = async () => {
    if (!user || !spaceDraft.trim()) return;
    const created = await createSpace(user.uid, spaceDraft.trim());
    setSpaceDraft("");
    setActiveSpaceId(created.id);
  };

  const spaceName = (id: string | null) =>
    spaces.find((s) => s.id === id)?.name ?? "—";

  const moveBoardToSpace = async (boardId: string, spaceId: string | null) => {
    if (!user) return;
    await setBoardSpace(user.uid, boardId, spaceId);
    setMenuId(null);
  };

  const onToggleStar = async (board: MatrixBoard) => {
    if (!user) return;
    await toggleStarBoard(user.uid, board.id, !board.starred);
  };

  const onDeleteBoard = async (board: MatrixBoard) => {
    if (!user) return;
    await deleteBoard(user.uid, board.id);
    setMenuId(null);
  };

  const startRename = (board: MatrixBoard) => {
    setMenuId(null);
    setRenamingId(board.id);
    setRenameDraft(board.name);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  };

  const commitRename = async () => {
    if (!user || !renamingId) return;
    const id = renamingId;
    const next = renameDraft.trim();
    setRenamingId(null);
    setRenameDraft("");
    const current = boards.find((b) => b.id === id);
    if (!current || !next || next === current.name) return;
    try {
      await renameBoard(user.uid, id, next);
    } catch (err) {
      console.error("[matrix-dashboard] renameBoard", err);
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft("");
  };

  const boardsInSpace = (spaceId: string | null) =>
    boards.filter((board) => board.spaceId === spaceId).length;

  const onSignOut = async () => {
    await signOutUser();
    router.replace("/");
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f5f5f5] text-[#1e1e1e]">
      <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#e6e6e6] bg-white">
        <div
          className="relative flex h-12 items-center gap-2 border-b border-[#e6e6e6] px-3"
          data-user-menu
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-2"
            title={user?.email ?? undefined}
          >
            <UserAvatar user={user} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1e1e1e]">
              {userShortName(user)}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label="Menú de usuario"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#757575] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {userMenuOpen ? (
            <div
              className="absolute left-3 right-3 top-[calc(100%-1px)] z-30 mt-1 rounded-lg border border-[#e6e6e6] bg-white py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[#f0f0f0] px-3 py-2">
                <p className="truncate text-[13px] font-medium text-[#1e1e1e]">
                  {userShortName(user)}
                </p>
                {user?.email ? (
                  <p className="truncate text-[11px] text-[#8a8a8a]">{user.email}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7]"
              >
                <LogOut className="h-4 w-4 text-[#757575]" />
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
        <div className="border-b border-[#f0f0f0] px-3 py-3">
          <div className="flex items-center gap-2 rounded-md border border-[#e6e6e6] bg-[#f7f7f7] px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#949494]" />
            <input
              type="search"
              placeholder="Buscar matrices…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-[#949494]"
            />
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 py-2">
          <button
            type="button"
            onClick={() => setTab("home")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-[-0.01em] transition-colors",
              tab === "home"
                ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
                : "text-[#626262] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]",
            )}
          >
            <Home className={cn("h-4 w-4", tab === "home" ? "text-[#0d99ff]" : "text-[#949494]")} />
            Inicio
          </button>
          <button
            type="button"
            onClick={() => setTab("docs")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-[-0.01em] transition-colors",
              tab === "docs"
                ? "bg-[#f0f7ff] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]"
                : "text-[#626262] hover:bg-[#f5f5f5] hover:text-[#1e1e1e]",
            )}
          >
            <BookOpenText className={cn("h-4 w-4", tab === "docs" ? "text-[#0d99ff]" : "text-[#949494]")} />
            Documentación
          </button>
        </nav>
        {tab === "docs" ? (
          <>
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#949494]">
                Biblioteca de métricas
              </p>
              <p className="mt-1.5 text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-[#1e1e1e]">
                Un índice vivo para consultar qué medir, cómo obtener la señal y en qué contexto usar cada métrica.
              </p>
            </div>
            <div className="space-y-2 px-3 py-2">
              <MetricsNavCard filters={docsFilters} />
              <MetricsFiltersCard filters={docsFilters} />
            </div>
          </>
        ) : (
          <>
        <div className="px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#949494]">
            Recientes
          </p>
          <ul className="space-y-0.5">
            {recent.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => goBoard(b.id)}
                  className="w-full truncate rounded px-1.5 py-1 text-left text-[11px] text-[#626262] hover:bg-[#f7f7f7]"
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#949494]">
            Destacadas
          </p>
          <ul className="space-y-0.5">
            {starred.length === 0 ? (
              <li className="text-[11px] text-[#949494]">Ninguna aún</li>
            ) : (
              starred.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => goBoard(b.id)}
                    className="flex w-full items-center gap-1 truncate rounded px-1.5 py-1 text-left text-[11px] text-[#626262] hover:bg-[#f7f7f7]"
                  >
                    <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                    {b.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-auto border-t border-[#f0f0f0] px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#949494]">
              Espacios
            </span>
          </div>
          <div className="mb-2 flex gap-1">
            <input
              value={spaceDraft}
              onChange={(e) => setSpaceDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSpace()}
              placeholder="Nuevo espacio"
              className="min-w-0 flex-1 rounded border border-[#e6e6e6] px-2 py-1 text-[11px] outline-none focus:border-[#0d99ff]"
            />
            <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={addSpace}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ul className="max-h-[160px] space-y-0.5 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => setActiveSpaceId("all")}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] transition-colors",
                  activeSpaceId === "all"
                    ? "bg-[#f0f7ff] text-[#0d99ff]"
                    : "text-[#626262] hover:bg-[#f7f7f7]",
                )}
              >
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Todos</span>
                <span className="ml-auto text-[10px] opacity-70">{boards.length}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setActiveSpaceId("none")}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] transition-colors",
                  activeSpaceId === "none"
                    ? "bg-[#f0f7ff] text-[#0d99ff]"
                    : "text-[#626262] hover:bg-[#f7f7f7]",
                )}
              >
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Sin espacio</span>
                <span className="ml-auto text-[10px] opacity-70">{boardsInSpace(null)}</span>
              </button>
            </li>
            {spaces.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveSpaceId(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 truncate rounded px-1.5 py-1 text-left text-[11px] transition-colors",
                    activeSpaceId === s.id
                      ? "bg-[#f0f7ff] text-[#0d99ff]"
                      : "text-[#626262] hover:bg-[#f7f7f7]",
                  )}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto text-[10px] opacity-70">{boardsInSpace(s.id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
          </>
        )}
      </aside>

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e6e6e6] bg-white px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.02em]">Metric Atlas</span>
            <span className="hidden truncate text-xs text-[#949494] sm:inline">
              {tab === "home"
                ? "Matrices del equipo"
                : docsMetric
                  ? docsMetric.name
                  : "Biblioteca de métricas"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-[#0d99ff] text-white hover:bg-[#0b87e0] hover:translate-y-[-1px]"
              onClick={onCreateBlank}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva matrix
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
        {tab === "docs" ? (
          <div className="px-6 py-6">
            {docsMetric ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#e6e6e6] bg-white px-4 py-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDocsMetric(null)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#626262] transition-colors hover:text-[#1e1e1e]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al catálogo
                  </button>
                </div>
                <MetricDetail
                  metric={docsMetric}
                  onOpenRelated={(m) => setDocsMetric(m)}
                />
              </div>
            ) : (
              <MetricsResultsGrid
                filters={docsFilters}
                onOpenMetric={(m) => setDocsMetric(m)}
              />
            )}
          </div>
        ) : (
        <div className="px-6 py-6">
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error.message}
            </div>
          ) : null}

          <section className="mb-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Plantillas de inicio
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={onCreateBlank}
                className="flex h-[140px] w-[160px] shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cfcfcf] bg-white text-[#757575] transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#0d99ff]/50 hover:bg-[#f7f7f7] hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)] active:translate-y-0"
              >
                <Plus className="mb-2 h-8 w-8" />
                <span className="text-xs font-medium">Matrix en blanco</span>
              </button>
              {activeTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplate(template)}
                  className="flex h-[140px] w-[160px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-left shadow-sm transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:translate-y-0"
                >
                  <BoardThumbnail
                    color={template.accentColor ?? thumbColor(template.id)}
                    className="aspect-[16/10] w-full"
                  />
                  <div className="flex flex-1 flex-col justify-center px-3.5">
                    <span className="line-clamp-1 text-[12px] font-semibold leading-tight tracking-[-0.01em]">
                      {template.name}
                    </span>
                    <span className="mt-1 line-clamp-2 flex items-center gap-1.5 text-[10px] leading-tight text-[#757575]">
                      <Sparkles className="h-3 w-3 shrink-0 text-violet-500" />
                      {template.description ?? "Plantilla guardada"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1e1e1e]">
                {activeSpaceId === "all"
                  ? "Tus matrices"
                  : activeSpaceId === "none"
                    ? "Matrices sin espacio"
                    : spaces.find((s) => s.id === activeSpaceId)?.name ?? "Tus matrices"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#757575]">
                  {filtered.length} {filtered.length === 1 ? "tablero" : "tableros"}
                </span>
                <div className="flex rounded-lg border border-[#e6e6e6] bg-white p-0.5">
                  <button
                    type="button"
                    aria-label="Vista cuadrícula"
                    onClick={() => setView("grid")}
                    className={cn(
                      "rounded transition-[background-color,color,transform] duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] p-1.5",
                      view === "grid"
                        ? "bg-[#f0f7ff] text-[#0d99ff]"
                        : "text-[#949494] hover:bg-[#f5f5f5]",
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Vista lista"
                    onClick={() => setView("list")}
                    className={cn(
                      "rounded transition-[background-color,color,transform] duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] p-1.5",
                      view === "list"
                        ? "bg-[#f0f7ff] text-[#0d99ff]"
                        : "text-[#949494] hover:bg-[#f5f5f5]",
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-[#757575]">Cargando matrices…</p>
            ) : view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    className="group relative overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#dadada] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
                  >
                    {renamingId === b.id ? (
                      <div className="block">
                        <BoardThumbnail board={b} className="aspect-[16/10] w-full" />
                        <div className="p-3">
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onBlur={() => {
                              void commitRename();
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-md border border-[#0d99ff] bg-white px-1.5 py-0.5 text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-[#1e1e1e] outline-none focus:ring-2 focus:ring-[#0d99ff]/20"
                          />
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#8a8a8a]">
                            <span className="rounded-[4px] bg-[#f3f3f3] p-1">
                              <FileText className="h-3 w-3 text-[#6f6f6f]" />
                            </span>
                            <span className="truncate">Drafts</span>
                            <span className="text-[#c2c2c2]">·</span>
                            <span className="truncate">Edited {formatRelativeTime(b.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/board/${b.id}`} className="block">
                        <BoardThumbnail board={b} className="aspect-[16/10] w-full" />
                        <div className="p-3">
                          <p className="line-clamp-1 text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-[#1e1e1e]">
                            {b.name}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#8a8a8a]">
                            <span className="rounded-[4px] bg-[#f3f3f3] p-1">
                              <FileText className="h-3 w-3 text-[#6f6f6f]" />
                            </span>
                            <span className="truncate">Drafts</span>
                            <span className="text-[#c2c2c2]">·</span>
                            <span className="truncate">Edited {formatRelativeTime(b.updatedAt)}</span>
                          </div>
                        </div>
                      </Link>
                    )}
                    <button
                      type="button"
                      className={cn(
                        "absolute left-2 top-2 rounded-md p-1 transition-[background-color,box-shadow,opacity,transform] duration-150 ease-out hover:scale-[1.04] active:scale-[0.97]",
                        b.starred
                          ? "bg-transparent opacity-100"
                          : cn(
                              "bg-white/90 shadow-sm hover:bg-white hover:shadow-md",
                              menuId === b.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                            ),
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        onToggleStar(b);
                      }}
                      data-board-actions
                      aria-pressed={b.starred}
                      aria-label={b.starred ? "Quitar de favoritos" : "Marcar como favorito"}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          b.starred ? "fill-amber-400 stroke-white" : "text-[#949494]",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "absolute right-2 top-2 transition-opacity",
                        menuId === b.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                      data-board-actions
                    >
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1 shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-white hover:shadow-md hover:scale-[1.04] active:scale-[0.97]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuId((id) => (id === b.id ? null : b.id));
                        }}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-[#757575]" />
                      </button>
                    </div>
                    {menuId === b.id ? (
                      <div
                        className="absolute right-2 top-11 z-20 min-w-[160px] rounded-lg border border-[#e6e6e6] bg-white py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                        data-board-actions
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                          onClick={() => startRename(b)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Renombrar
                        </button>
                        <div className="px-3 py-2">
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#949494]">
                            Mover a workspace
                          </label>
                          <select
                            value={b.spaceId ?? "none"}
                            onChange={(e) =>
                              moveBoardToSpace(
                                b.id,
                                e.target.value === "none" ? null : e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs text-[#444] outline-none focus:border-[#0d99ff]"
                          >
                            <option value="none">Sin espacio</option>
                            {spaces.map((space) => (
                              <option key={space.id} value={space.id}>
                                {space.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                          onClick={() => {
                            onToggleStar(b);
                            setMenuId(null);
                          }}
                        >
                          <Star className="h-3.5 w-3.5" />
                          {b.starred ? "Quitar destacada" : "Destacar"}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                          onClick={() => onDeleteBoard(b)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#f0f0f0] bg-[#fafafa] text-[11px] font-medium uppercase tracking-wide text-[#757575]">
                    <tr>
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Espacio</th>
                      <th className="px-4 py-2.5">Última edición</th>
                      <th className="px-4 py-2.5">Propietario</th>
                      <th className="w-10 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          {renamingId === b.id ? (
                            <input
                              ref={renameInputRef}
                              type="text"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onBlur={() => {
                                void commitRename();
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  (e.target as HTMLInputElement).blur();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelRename();
                                }
                              }}
                              className="w-full rounded-md border border-[#0d99ff] bg-white px-1.5 py-0.5 text-sm font-medium text-[#1e1e1e] outline-none focus:ring-2 focus:ring-[#0d99ff]/20"
                            />
                          ) : (
                            <Link href={`/board/${b.id}`} className="font-medium text-[#1e1e1e] hover:underline">
                              {b.name}
                            </Link>
                          )}
                          <p className="text-[11px] text-[#757575]">Team matrix · canvas infinito</p>
                        </td>
                        <td className="hidden px-4 py-3 text-[#626262] md:table-cell">
                          {spaceName(b.spaceId)}
                        </td>
                        <td className="px-4 py-3 text-[#626262]">{formatRelativeTime(b.updatedAt)}</td>
                        <td className="px-4 py-3 text-[#626262]">Tú</td>
                        <td className="relative px-2 py-3" data-board-actions>
                          <button
                            type="button"
                            className="rounded p-1 text-[#949494] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f0f0f0] hover:text-[#444] hover:scale-[1.03] active:scale-[0.97]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuId((id) => (id === b.id ? null : b.id));
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuId === b.id ? (
                            <div
                              className="absolute right-0 top-9 z-20 min-w-[140px] rounded-lg border border-[#e6e6e6] bg-white py-1 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                              data-board-actions
                            >
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                                onClick={() => startRename(b)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Renombrar
                              </button>
                              <div className="px-3 py-2">
                                <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[#949494]">
                                  Mover a workspace
                                </label>
                                <select
                                  value={b.spaceId ?? "none"}
                                  onChange={(e) =>
                                    moveBoardToSpace(
                                      b.id,
                                      e.target.value === "none" ? null : e.target.value,
                                    )
                                  }
                                  className="w-full rounded-md border border-[#e6e6e6] bg-white px-2 py-1 text-xs text-[#444] outline-none focus:border-[#0d99ff]"
                                >
                                  <option value="none">Sin espacio</option>
                                  {spaces.map((space) => (
                                    <option key={space.id} value={space.id}>
                                      {space.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                                onClick={() => {
                                  onToggleStar(b);
                                  setMenuId(null);
                                }}
                              >
                                <Star className="h-3.5 w-3.5" />
                                {b.starred ? "Quitar destacada" : "Destacar"}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                onClick={() => onDeleteBoard(b)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#757575]">
                No hay matrices que coincidan. Crea una nueva con el botón superior.
              </p>
            ) : null}
          </section>
        </div>
        )}
        </div>
      </main>
    </div>
  );
}
