"use client";

import * as React from "react";
import Link from "next/link";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";
import { AtlasFiltersProvider } from "@/context/atlas-filters-context";
import { sanitizeBoard, type MatrixBoard } from "@/lib/matrix-boards";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useMetrics } from "@/lib/metrics/provider";
import { AtlasWorkspace } from "./atlas-workspace";
import { BoardPersistence } from "./board-persistence";

type BoardState = MatrixBoard | "missing" | "loading" | "no-user";

export function BoardPageClient({ boardId }: { boardId: string }) {
  const { metrics, loading: metricsLoading } = useMetrics();
  const { user, loading: authLoading } = useAuth();
  const [board, setBoard] = React.useState<BoardState>("loading");

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBoard("no-user");
      return;
    }
    setBoard("loading");
    const ref = doc(getDb(), "users", user.uid, "boards", boardId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setBoard("missing");
          return;
        }
        setBoard(sanitizeBoard({ ...(snap.data() as MatrixBoard), id: snap.id }));
      },
      (err) => {
        console.error("[board-page] snapshot", err);
        setBoard("missing");
      },
    );
    return unsub;
  }, [user, authLoading, boardId]);

  if (board === "loading" || authLoading || metricsLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Cargando matrix…
      </div>
    );
  }

  if (board === "no-user") {
    return null;
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
