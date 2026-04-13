"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpenText,
  FileText,
  Folder,
  Gauge,
  Home,
  ImageIcon,
  Layers3,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOARD_COVER_IDS,
  createBoard,
  createSpace,
  deleteBoard,
  defaultBoardCanvas,
  formatRelativeTime,
  loadBoardsStore,
  setBoardSpace,
  toggleStarBoard,
  updateBoardCover,
  type BoardCoverId,
  type MatrixBoard,
  type MatrixSpace,
} from "@/lib/matrix-boards";
import { normalizeAxes } from "@/lib/matrix-axes";

const BOARD_COVERS: Record<
  BoardCoverId,
  { label: string; kicker: string; Icon: typeof BarChart3 }
> = {
  summary: { label: "Metric overview", kicker: "Resumen", Icon: BarChart3 },
  signals: { label: "Signal map", kicker: "Señales", Icon: Activity },
  catalog: { label: "Metric catalog", kicker: "Catálogo", Icon: BookOpenText },
  quality: { label: "Quality checks", kicker: "Calidad", Icon: Gauge },
};

function nextBoardCover(current: BoardCoverId): BoardCoverId {
  const index = BOARD_COVER_IDS.indexOf(current);
  return BOARD_COVER_IDS[(index + 1) % BOARD_COVER_IDS.length]!;
}

function BoardThumbnail({
  board,
  className,
  compact,
}: {
  board?: Pick<MatrixBoard, "coverId">;
  className?: string;
  compact?: boolean;
}) {
  const cover = BOARD_COVERS[board?.coverId ?? "summary"];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-t-xl border-b border-[#ececec] bg-[linear-gradient(180deg,#fbfbfb_0%,#f6f6f6_100%)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.88),transparent_72%)]" />
      <div className={cn("absolute inset-x-6 h-px bg-[#efefef]", compact ? "top-3" : "top-5")} />
      <div
        className={cn(
          "relative flex h-full items-center justify-center",
          compact ? "p-2.5" : "p-5",
        )}
      >
        <div
          className={cn(
            "flex h-full w-full items-center justify-center border border-dashed border-[#d8d8d8] bg-white/70",
            compact ? "rounded-md" : "rounded-lg",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center text-[#a1a1a1]",
              compact ? "gap-1" : "gap-2",
            )}
          >
            <div
              className={cn(
                "rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
                compact ? "p-1.5" : "p-2",
              )}
            >
              <ImageIcon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {compact ? (
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#9a9a9a]">
                {cover.kicker}
              </p>
            ) : (
              <div className="text-center">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em]">
                  {cover.kicker}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8a8a8a]">{cover.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatrixDashboard() {
  const router = useRouter();
  const [spaces, setSpaces] = React.useState<MatrixSpace[]>([]);
  const [boards, setBoards] = React.useState<MatrixBoard[]>([]);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [menuId, setMenuId] = React.useState<string | null>(null);
  const [spaceDraft, setSpaceDraft] = React.useState("");

  const refresh = React.useCallback(() => {
    const s = loadBoardsStore();
    setSpaces(s.spaces);
    setBoards(s.boards);
  }, []);

  React.useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("metric-atlas-boards-changed", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("metric-atlas-boards-changed", on);
      window.removeEventListener("storage", on);
    };
  }, [refresh]);

  React.useEffect(() => {
    const close = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      if (!t.closest("[data-board-actions]")) setMenuId(null);
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
    b.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [activeSpaceId, boards]);

  const goBoard = (id: string) => router.push(`/board/${id}`);

  const onCreateBlank = () => {
    const b = createBoard("Matrix sin título");
    if (activeSpaceId !== "all" && activeSpaceId !== "none") {
      setBoardSpace(b.id, activeSpaceId);
    }
    goBoard(b.id);
  };

  const onTemplate = (kind: "impact" | "figma") => {
    const canvas = defaultBoardCanvas();
    if (kind === "impact") {
      canvas.matrixAxes = normalizeAxes({
        axisX: "impactZone",
        axisY: "maturity",
      });
      const board = createBoard("Impacto × madurez", canvas);
      if (activeSpaceId !== "all" && activeSpaceId !== "none") {
        setBoardSpace(board.id, activeSpaceId);
      }
      goBoard(board.id);
    } else {
      canvas.matrixAxes = normalizeAxes({
        axisX: "figmaAvailability",
        axisY: "layer",
      });
      const board = createBoard("Figma × capa", canvas);
      if (activeSpaceId !== "all" && activeSpaceId !== "none") {
        setBoardSpace(board.id, activeSpaceId);
      }
      goBoard(board.id);
    }
  };

  const addSpace = () => {
    if (!spaceDraft.trim()) return;
    const created = createSpace(spaceDraft.trim());
    setSpaceDraft("");
    setActiveSpaceId(created.id);
    refresh();
  };

  const spaceName = (id: string | null) =>
    spaces.find((s) => s.id === id)?.name ?? "—";

  const changeCover = (board: MatrixBoard) => {
    updateBoardCover(board.id, nextBoardCover(board.coverId));
    refresh();
    setMenuId(null);
  };

  const moveBoardToSpace = (boardId: string, spaceId: string | null) => {
    setBoardSpace(boardId, spaceId);
    refresh();
    setMenuId(null);
  };

  const boardsInSpace = (spaceId: string | null) =>
    boards.filter((board) => board.spaceId === spaceId).length;

  return (
    <div className="flex min-h-[100dvh] bg-[#f5f5f5] text-[#1e1e1e]">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-[#e6e6e6] bg-white">
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
          <span className="flex items-center gap-2 rounded-md bg-[#f0f7ff] px-2 py-1.5 text-xs font-medium tracking-[-0.01em] text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)]">
            <Home className="h-4 w-4 text-[#0d99ff]" />
            Inicio
          </span>
          <Link
            href="/metrics"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-[-0.01em] text-[#626262] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
          >
            <Search className="h-4 w-4 text-[#949494]" />
            Documentación
          </Link>
        </nav>
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
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[#e6e6e6] bg-white/95 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.02em]">Metric Atlas</span>
            <span className="hidden text-xs text-[#949494] sm:inline">Matrices del equipo</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/metrics"
              className="inline-flex h-8 items-center rounded-md border border-[#e6e6e6] bg-white px-3 text-xs font-medium text-[#444] transition-[background-color,border-color] hover:bg-[#f7f7f7] hover:border-[#d9d9d9]"
            >
              Biblioteca de métricas
            </Link>
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

        <div className="px-6 py-6">
          <section className="mb-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Plantillas de inicio
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={onCreateBlank}
                className="flex h-[120px] w-[160px] shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cfcfcf] bg-white text-[#757575] transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#0d99ff]/50 hover:bg-[#f7f7f7] hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)] active:translate-y-0"
              >
                <Plus className="mb-2 h-8 w-8" />
                <span className="text-xs font-medium">Matrix en blanco</span>
              </button>
              <button
                type="button"
                onClick={() => onTemplate("impact")}
                className="flex h-[120px] w-[160px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-left shadow-sm transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:translate-y-0"
              >
                <BoardThumbnail compact className="h-14 w-full rounded-none border-0" />
                <div className="flex flex-1 flex-col justify-center px-3.5">
                  <Sparkles className="mb-1 h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[12px] font-semibold leading-tight tracking-[-0.01em]">
                    Impacto × madurez
                  </span>
                  <span className="mt-1 text-[10px] leading-tight text-[#757575]">
                    Ejes predefinidos
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onTemplate("figma")}
                className="flex h-[120px] w-[160px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-left shadow-sm transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:translate-y-0"
              >
                <BoardThumbnail compact className="h-14 w-full rounded-none border-0" />
                <div className="flex flex-1 flex-col justify-center px-3.5">
                  <span className="mb-1 text-[10px] font-medium text-sky-600">Figma</span>
                  <span className="text-[12px] font-semibold leading-tight tracking-[-0.01em]">
                    Figma × capa
                  </span>
                  <span className="mt-1 text-[10px] leading-tight text-[#757575]">DesignOps</span>
                </div>
              </button>
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

            {view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    className="group relative overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[box-shadow,transform,border-color] duration-150 ease-out hover:translate-y-[-1px] hover:border-[#dadada] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
                  >
                    <Link href={`/board/${b.id}`} className="block">
                      <BoardThumbnail board={b} className="aspect-[16/10] w-full rounded-none border-0" />
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
                    <div
                      className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                      data-board-actions
                    >
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1 shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-white hover:shadow-md hover:scale-[1.04] active:scale-[0.97]"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleStarBoard(b.id);
                          refresh();
                        }}
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            b.starred ? "fill-amber-400 text-amber-400" : "text-[#949494]",
                          )}
                        />
                      </button>
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
                          onClick={() => changeCover(b)}
                        >
                          <Layers3 className="h-3.5 w-3.5" />
                          Cambiar portada
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
                            toggleStarBoard(b.id);
                            refresh();
                            setMenuId(null);
                          }}
                        >
                          <Star className="h-3.5 w-3.5" />
                          {b.starred ? "Quitar destacada" : "Destacar"}
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                          onClick={() => {
                            deleteBoard(b.id);
                            refresh();
                            setMenuId(null);
                          }}
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
                          <Link href={`/board/${b.id}`} className="font-medium text-[#1e1e1e] hover:underline">
                            {b.name}
                          </Link>
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
                                onClick={() => changeCover(b)}
                              >
                                <Layers3 className="h-3.5 w-3.5" />
                                Cambiar portada
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
                                  toggleStarBoard(b.id);
                                  refresh();
                                  setMenuId(null);
                                }}
                              >
                                <Star className="h-3.5 w-3.5" />
                                {b.starred ? "Quitar destacada" : "Destacar"}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  deleteBoard(b.id);
                                  refresh();
                                  setMenuId(null);
                                }}
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

            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#757575]">
                No hay matrices que coincidan. Crea una nueva con el botón superior.
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
