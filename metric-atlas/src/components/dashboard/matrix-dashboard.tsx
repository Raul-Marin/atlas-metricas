"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpenText,
  Check,
  Copy,
  FileText,
  Folder,
  FolderInput,
  Home,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  List,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
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
import { useMetricContext } from "@/lib/context/provider";
import { templateDefToCanvas } from "@/lib/context/adapter";
import { USER_CREATED_COVER } from "@/contexts/design-systems";
import type { MatrixTemplateDef } from "@/lib/context/types";
import type { Metric } from "@/lib/types";
import {
  createBoard,
  createSpace,
  deleteBoard,
  duplicateBoard,
  renameBoard,
  renameSpace,
  setBoardSpace,
  toggleStarBoard,
  updateBoardCover,
} from "@/lib/boards/firestore";
import { useBoards } from "@/lib/boards/use-boards";
import { useAuth } from "@/lib/auth/auth-provider";
import { BoardCover } from "./board-cover";
import { CoverPickerModal } from "./cover-picker-modal";

type SortMode = "recent" | "name" | "starred";

const SORT_LABELS: Record<SortMode, string> = {
  recent: "Más recientes",
  name: "Nombre (A–Z)",
  starred: "Destacadas primero",
};

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
  const [activeSpaceId, setActiveSpaceId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = React.useState<SortMode>("recent");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = React.useState(false);
  const [editingSpaceId, setEditingSpaceId] = React.useState<string | null>(null);
  const [spaceNameDraft, setSpaceNameDraft] = React.useState("");
  const spaceNameInputRef = React.useRef<HTMLInputElement>(null);
  const [menuId, setMenuId] = React.useState<string | null>(null);
  const [moveBoardId, setMoveBoardId] = React.useState<string | null>(null);
  const [coverBoardId, setCoverBoardId] = React.useState<string | null>(null);
  const [infoTplId, setInfoTplId] = React.useState<string | null>(null);

  // Cierra el tooltip de descripción de plantilla al hacer clic fuera.
  React.useEffect(() => {
    if (!infoTplId) return;
    const onDocClick = (e: MouseEvent) => {
      const path = e.composedPath?.() ?? [];
      const inside = path.some(
        (n) => n instanceof HTMLElement && n.dataset?.tplInfo !== undefined,
      );
      if (!inside) setInfoTplId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [infoTplId]);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [spaceDraft, setSpaceDraft] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const [tab, setTab] = React.useState<"home" | "docs">("home");
  const [docsMetric, setDocsMetric] = React.useState<Metric | null>(null);
  const { activeMetrics: allMetrics } = useMetrics();
  const metricContext = useMetricContext();
  const docsFilters = useMetricsFilters(allMetrics);

  React.useEffect(() => {
    if (tab !== "docs") setDocsMetric(null);
  }, [tab]);

  // Espacio activo: siempre un workspace real. Si el actual deja de existir
  // (o aún no hay), selecciona el por defecto ("Mi espacio") o el primero.
  React.useEffect(() => {
    if (spaces.length === 0) return;
    if (activeSpaceId && spaces.some((s) => s.id === activeSpaceId)) return;
    const fallback =
      spaces.find((s) => s.name === "Mi espacio") ?? spaces[0];
    setActiveSpaceId(fallback.id);
  }, [spaces, activeSpaceId]);

  React.useEffect(() => {
    const close = (ev: MouseEvent) => {
      // Usamos composedPath() (ruta fijada al inicio del dispatch) en vez de
      // target.closest(): si un botón —p.ej. el lápiz— se desmonta durante el
      // re-render del click, su nodo queda desconectado y closest() devolvería
      // null, cerrando el menú por error. La ruta del evento sí conserva los
      // ancestros originales.
      const path = ev.composedPath();
      const inPath = (selector: string) =>
        path.some((n) => n instanceof Element && n.matches(selector));
      if (!inPath("[data-board-actions]")) setMenuId(null);
      if (!inPath("[data-user-menu]")) setUserMenuOpen(false);
      if (!inPath("[data-sort-menu]")) setSortOpen(false);
      if (!inPath("[data-space-menu]")) setSpaceMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let b = boards.filter((x) => x.spaceId === activeSpaceId);
    if (q) b = b.filter((x) => x.name.toLowerCase().includes(q));
    // `boards` ya llega ordenado por updatedAt desc (más recientes primero).
    if (sortMode === "name") {
      b.sort((x, y) => x.name.localeCompare(y.name, "es", { sensitivity: "base" }));
    } else if (sortMode === "starred") {
      b.sort((x, y) => Number(y.starred) - Number(x.starred));
    }
    return b;
  }, [activeSpaceId, boards, query, sortMode]);

  const starred = React.useMemo(
    () =>
      boards
        .filter((b) => b.starred && b.spaceId === activeSpaceId)
        .slice(0, 8),
    [activeSpaceId, boards],
  );

  const recent = React.useMemo(
    () => boards.filter((b) => b.spaceId === activeSpaceId).slice(0, 6),
    [activeSpaceId, boards],
  );

  const goBoard = (id: string) => router.push(`/board/${id}`);

  /** Espacio donde se crean las nuevas matrices: el activo, o el primero como respaldo. */
  const targetSpaceId = activeSpaceId ?? spaces[0]?.id ?? null;

  const onCreateBlank = async () => {
    if (!user) return;
    const b = await createBoard(
      user.uid,
      "Matrix sin título",
      { excludedMetricIds: allMetrics.map((m) => m.id) },
      USER_CREATED_COVER,
    );
    if (targetSpaceId) {
      await setBoardSpace(user.uid, b.id, targetSpaceId);
    }
    goBoard(b.id);
  };

  const onTemplate = async (template: MatrixTemplateDef) => {
    if (!user) return;
    const canvas = templateDefToCanvas(
      template,
      allMetrics.map((m) => m.id),
    );
    const board = await createBoard(
      user.uid,
      template.name,
      canvas,
      template.cover,
    );
    if (targetSpaceId) {
      await setBoardSpace(user.uid, board.id, targetSpaceId);
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

  const startEditSpace = (space: { id: string; name: string }) => {
    setEditingSpaceId(space.id);
    setSpaceNameDraft(space.name);
    requestAnimationFrame(() => {
      spaceNameInputRef.current?.focus();
      spaceNameInputRef.current?.select();
    });
  };

  const commitSpaceName = async () => {
    if (!user || !editingSpaceId) return;
    const id = editingSpaceId;
    const next = spaceNameDraft.trim();
    setEditingSpaceId(null);
    setSpaceNameDraft("");
    const current = spaces.find((s) => s.id === id);
    if (!current || !next || next === current.name) return;
    try {
      await renameSpace(user.uid, id, next);
    } catch (err) {
      console.error("[matrix-dashboard] renameSpace", err);
    }
  };

  const cancelEditSpace = () => {
    setEditingSpaceId(null);
    setSpaceNameDraft("");
  };

  const moveBoardToSpace = async (boardId: string, spaceId: string | null) => {
    if (!user) return;
    await setBoardSpace(user.uid, boardId, spaceId);
    setMenuId(null);
    setMoveBoardId(null);
  };

  const moveBoard = boards.find((b) => b.id === moveBoardId) ?? null;
  const coverBoard = boards.find((b) => b.id === coverBoardId) ?? null;

  const onSelectCover = async (cover: string) => {
    if (!user || !coverBoardId) return;
    await updateBoardCover(user.uid, coverBoardId, cover);
    setCoverBoardId(null);
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

  const onDuplicateBoard = async (board: MatrixBoard) => {
    if (!user) return;
    setMenuId(null);
    try {
      const copy = await duplicateBoard(user.uid, board);
      goBoard(copy.id);
    } catch (err) {
      console.error("[matrix-dashboard] duplicateBoard", err);
    }
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
        <div className="border-t border-[#f0f0f0] px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#949494]">
              Espacio de trabajo
            </span>
          </div>
          <div className="relative" data-space-menu>
            <button
              type="button"
              onClick={() => setSpaceMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={spaceMenuOpen}
              className="flex w-full items-center gap-2 rounded-md border border-[#e6e6e6] bg-white px-2 py-1.5 text-[11px] text-[#1e1e1e] transition-colors hover:bg-[#fafafa] focus:border-[#0d99ff] focus:outline-none focus:ring-2 focus:ring-[#0d99ff]/15"
            >
              <Folder className="h-3.5 w-3.5 shrink-0 text-[#949494]" />
              <span className="flex-1 truncate text-left">
                {spaces.find((s) => s.id === activeSpaceId)?.name ?? "Mi espacio"}
              </span>
              <span className="ml-auto text-[10px] text-[#949494]">{spaceMenuOpen ? "▴" : "▾"}</span>
            </button>
            {spaceMenuOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-lg border border-[#e6e6e6] bg-white p-1.5 shadow-lg">
                <div className="mb-1.5 flex gap-1">
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
                <ul className="max-h-[200px] space-y-0.5 overflow-y-auto">
                  {spaces.map((s) => (
                    <li key={s.id}>
                      {editingSpaceId === s.id ? (
                        // Aísla la fila en edición: interactuar con el input
                        // (clic, seleccionar texto) no debe cerrar el selector.
                        // El cierre real (clic fuera) confirma vía onBlur.
                        <div
                          className="flex items-center gap-2 rounded px-1.5 py-1"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Folder className="h-3.5 w-3.5 shrink-0 text-[#0d99ff]" />
                          <input
                            ref={spaceNameInputRef}
                            type="text"
                            value={spaceNameDraft}
                            onChange={(e) => setSpaceNameDraft(e.target.value)}
                            onBlur={() => {
                              void commitSpaceName();
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditSpace();
                              }
                            }}
                            className="min-w-0 flex-1 rounded border border-[#0d99ff] bg-white px-1 py-0.5 text-[11px] text-[#1e1e1e] outline-none focus:ring-2 focus:ring-[#0d99ff]/20"
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "group/space flex items-center gap-2 rounded px-1.5 py-1 text-[11px] transition-colors",
                            activeSpaceId === s.id
                              ? "bg-[#f0f7ff] text-[#0d99ff]"
                              : "text-[#626262] hover:bg-[#f7f7f7]",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSpaceId(s.id);
                              setSpaceMenuOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 truncate text-left"
                          >
                            <Folder className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{s.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              // El re-render desmonta este botón; si el clic llega al
                              // listener global, `closest` corre sobre un nodo ya
                              // desconectado y cerraría el selector. Lo cortamos aquí.
                              e.stopPropagation();
                              startEditSpace(s);
                            }}
                            aria-label={`Editar nombre de ${s.name}`}
                            className="shrink-0 rounded p-0.5 text-[#949494] opacity-0 transition-opacity hover:bg-[#e9eef5] hover:text-[#0d99ff] group-hover/space:opacity-100"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <span className="shrink-0 text-[10px] opacity-70">{boardsInSpace(s.id)}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
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
                    className="w-full truncate rounded px-1.5 py-1 text-left text-[11px] text-[#626262] hover:bg-[#f7f7f7]"
                  >
                    {b.name}
                  </button>
                </li>
              ))
            )}
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
            <div className="flex flex-wrap justify-center gap-3">
              {metricContext.objectives.map((obj) => {
                const template = metricContext.templates.find(
                  (t) => t.id === obj.matrixTemplateId,
                );
                if (!template) return null;
                const src = metricContext.covers.find(
                  (c) => c.id === template.cover,
                )?.src;
                const infoOpen = infoTplId === obj.id;
                return (
                  <div key={obj.id} className="relative h-[140px] w-[160px]">
                    <button
                      type="button"
                      onClick={() => onTemplate(template)}
                      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-left shadow-sm transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:translate-y-0"
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt=""
                          className="aspect-[16/10] w-full bg-[#f3f3f3] object-cover"
                        />
                      ) : (
                        <BoardThumbnail
                          color={template.accentColor ?? thumbColor(template.id)}
                          className="aspect-[16/10] w-full"
                        />
                      )}
                      <div className="flex flex-1 items-center px-3">
                        <span className="line-clamp-2 text-[12px] font-semibold leading-tight tracking-[-0.01em] text-[#1e1e1e]">
                          {obj.label}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      data-tpl-info
                      aria-label="Descripción de la plantilla"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoTplId((prev) => (prev === obj.id ? null : obj.id));
                      }}
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[#626262] shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-[#1e1e1e]"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {infoOpen ? (
                      <div
                        data-tpl-info
                        className="absolute right-1.5 top-8 z-20 w-[184px] rounded-lg border border-[#e6e6e6] bg-white p-2.5 text-[11px] leading-[1.45] text-[#444] shadow-lg"
                      >
                        {obj.description}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#1e1e1e]">
                {spaces.find((s) => s.id === activeSpaceId)?.name ?? "Tus matrices"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#757575]">
                  {filtered.length} {filtered.length === 1 ? "tablero" : "tableros"}
                </span>
                <div className="relative" data-sort-menu>
                  <button
                    type="button"
                    onClick={() => setSortOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={sortOpen}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs font-medium text-[#444] transition-colors hover:bg-[#f7f7f7]"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-[#949494]" />
                    <span className="hidden sm:inline">{SORT_LABELS[sortMode]}</span>
                  </button>
                  {sortOpen ? (
                    <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[170px] rounded-lg border border-[#e6e6e6] bg-white py-1 shadow-lg">
                      {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setSortMode(mode);
                            setSortOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]",
                            sortMode === mode ? "text-[#0d99ff]" : "text-[#1e1e1e]",
                          )}
                        >
                          {SORT_LABELS[mode]}
                          {sortMode === mode ? <span className="text-[#0d99ff]">✓</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
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
                        <BoardCover
                          board={b}
                          metrics={allMetrics}
                          fallbackColor={thumbColor(b.id)}
                          className="aspect-[16/10] w-full"
                        />
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
                        <BoardCover
                          board={b}
                          metrics={allMetrics}
                          fallbackColor={thumbColor(b.id)}
                          className="aspect-[16/10] w-full"
                        />
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
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                          onClick={() => onDuplicateBoard(b)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                          onClick={() => {
                            setMoveBoardId(b.id);
                            setMenuId(null);
                          }}
                        >
                          <FolderInput className="h-3.5 w-3.5" />
                          Mover a…
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                          onClick={() => {
                            setCoverBoardId(b.id);
                            setMenuId(null);
                          }}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Cover
                        </button>
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
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                                onClick={() => {
                                  setMoveBoardId(b.id);
                                  setMenuId(null);
                                }}
                              >
                                <FolderInput className="h-3.5 w-3.5" />
                                Mover a…
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]"
                                onClick={() => {
                                  setCoverBoardId(b.id);
                                  setMenuId(null);
                                }}
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                Cover
                              </button>
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

      {moveBoard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mover matriz a un espacio"
          onClick={() => setMoveBoardId(null)}
        >
          <div
            className="w-full max-w-[320px] overflow-hidden rounded-xl border border-[#e6e6e6] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#f0f0f0] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#1e1e1e]">
                  Mover a espacio
                </p>
                <p className="truncate text-[11px] text-[#949494]">{moveBoard.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoveBoardId(null)}
                aria-label="Cerrar"
                className="shrink-0 rounded-md p-1 text-[#757575] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[300px] overflow-y-auto p-1.5">
              {spaces.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => moveBoardToSpace(moveBoard.id, s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-[#f7f7f7]",
                      moveBoard.spaceId === s.id ? "text-[#0d99ff]" : "text-[#1e1e1e]",
                    )}
                  >
                    <Folder className="h-3.5 w-3.5 shrink-0 text-[#949494]" />
                    <span className="flex-1 truncate">{s.name}</span>
                    {moveBoard.spaceId === s.id ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                </li>
              ))}
              {spaces.length === 0 ? (
                <li className="px-2.5 py-2 text-[11px] text-[#949494]">
                  No hay espacios creados. Crea uno desde el panel lateral.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      <CoverPickerModal
        board={coverBoard}
        metrics={allMetrics}
        fallbackColor={coverBoard ? thumbColor(coverBoard.id) : "#e5e7eb"}
        onSelect={onSelectCover}
        onClose={() => setCoverBoardId(null)}
      />
    </div>
  );
}
