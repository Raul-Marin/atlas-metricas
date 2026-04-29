"use client";

import * as React from "react";
import type { MatrixBoard, MatrixSpace } from "@/lib/matrix-boards";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  ensureStarterBoard,
  subscribeToBoards,
  subscribeToSpaces,
} from "./firestore";

type BoardsState = {
  boards: MatrixBoard[];
  spaces: MatrixSpace[];
  loading: boolean;
  error: Error | null;
};

export function useBoards(): BoardsState {
  const { user } = useAuth();
  const [state, setState] = React.useState<BoardsState>({
    boards: [],
    spaces: [],
    loading: true,
    error: null,
  });
  const seededRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      setState({ boards: [], spaces: [], loading: false, error: null });
      return;
    }

    let boardsReady = false;
    let spacesReady = false;
    let cancelled = false;

    const finishIfReady = () => {
      if (cancelled) return;
      if (boardsReady && spacesReady) {
        setState((s) => ({ ...s, loading: false }));
      }
    };

    const unsubBoards = subscribeToBoards(
      user.uid,
      (boards) => {
        if (cancelled) return;
        if (seededRef.current !== user.uid && boards.length === 0) {
          seededRef.current = user.uid;
          ensureStarterBoard(user.uid).catch((err) => {
            console.error("[boards] ensureStarterBoard", err);
          });
          return;
        }
        boardsReady = true;
        setState((s) => ({ ...s, boards, error: null }));
        finishIfReady();
      },
      (error) => {
        if (cancelled) return;
        boardsReady = true;
        setState((s) => ({ ...s, error, loading: false }));
      },
    );
    const unsubSpaces = subscribeToSpaces(
      user.uid,
      (spaces) => {
        if (cancelled) return;
        spacesReady = true;
        setState((s) => ({ ...s, spaces }));
        finishIfReady();
      },
      (error) => {
        if (cancelled) return;
        spacesReady = true;
        setState((s) => ({ ...s, error, loading: false }));
      },
    );

    return () => {
      cancelled = true;
      unsubBoards();
      unsubSpaces();
    };
  }, [user]);

  return state;
}
