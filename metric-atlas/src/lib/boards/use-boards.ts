"use client";

import * as React from "react";
import type { MatrixBoard, MatrixSpace } from "@/lib/matrix-boards";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  ensureWorkspaceSetup,
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

    // Garantiza el modelo de workspaces (espacio por defecto + migración) una vez por usuario.
    if (seededRef.current !== user.uid) {
      seededRef.current = user.uid;
      ensureWorkspaceSetup(user.uid).catch((err) => {
        console.error("[boards] ensureWorkspaceSetup", err);
      });
    }

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
