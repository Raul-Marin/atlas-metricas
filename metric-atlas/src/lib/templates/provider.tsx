"use client";

import * as React from "react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeToTemplates, type MatrixTemplate } from "./firestore";

type TemplatesContextValue = {
  templates: MatrixTemplate[];
  activeTemplates: MatrixTemplate[];
  loading: boolean;
  error: Error | null;
};

const TemplatesContext = React.createContext<TemplatesContextValue | undefined>(
  undefined,
);

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = React.useState<MatrixTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToTemplates(
      (list) => {
        setTemplates(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const activeTemplates = React.useMemo(
    () => templates.filter((t) => !t.archived),
    [templates],
  );

  const value = React.useMemo<TemplatesContextValue>(
    () => ({ templates, activeTemplates, loading, error }),
    [templates, activeTemplates, loading, error],
  );

  return (
    <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>
  );
}

export function useTemplates(): TemplatesContextValue {
  const ctx = React.useContext(TemplatesContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplatesProvider");
  return ctx;
}
