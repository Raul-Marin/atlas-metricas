"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeToMetrics } from "./firestore";

type MetricsContextValue = {
  metrics: Metric[];
  activeMetrics: Metric[];
  loading: boolean;
  error: Error | null;
  getMetricById: (id: string) => Metric | undefined;
};

const MetricsContext = React.createContext<MetricsContextValue | undefined>(
  undefined,
);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToMetrics(
      (list) => {
        setMetrics(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const activeMetrics = React.useMemo(
    () => metrics.filter((m) => !m.archived),
    [metrics],
  );

  const getMetricById = React.useCallback(
    (id: string) => metrics.find((m) => m.id === id),
    [metrics],
  );

  const value = React.useMemo<MetricsContextValue>(
    () => ({ metrics, activeMetrics, loading, error, getMetricById }),
    [metrics, activeMetrics, loading, error, getMetricById],
  );

  return (
    <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextValue {
  const ctx = React.useContext(MetricsContext);
  if (!ctx) throw new Error("useMetrics must be used within MetricsProvider");
  return ctx;
}
