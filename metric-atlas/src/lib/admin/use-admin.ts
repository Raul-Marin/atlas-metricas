"use client";

import * as React from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminState =
  | { kind: "loading" }
  | { kind: "no-user" }
  | { kind: "denied" }
  | { kind: "ok"; uid: string };

export function useAdminGuard(): AdminState {
  const { user, loading, configured } = useAuth();
  const [state, setState] = React.useState<AdminState>({ kind: "loading" });

  React.useEffect(() => {
    if (loading) {
      setState({ kind: "loading" });
      return;
    }
    if (!configured || !user) {
      setState({ kind: "no-user" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    getDoc(doc(getDb(), "admins", user.uid))
      .then((snap) => {
        if (cancelled) return;
        setState(
          snap.exists() ? { kind: "ok", uid: user.uid } : { kind: "denied" },
        );
      })
      .catch((err) => {
        console.error("[admin-guard]", err);
        if (!cancelled) setState({ kind: "denied" });
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading, configured]);

  return state;
}
