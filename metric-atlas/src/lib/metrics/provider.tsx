"use client";

import * as React from "react";
import type { Metric } from "@/lib/types";
import { getActiveContext } from "@/lib/context/registry";
import { definitionToMetric } from "@/lib/context/adapter";

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
  // El catálogo es el pack del contexto activo (código), no Firestore. Esto
  // permite iterar el contenido real rápido y hace que cada métrica en runtime
  // lleve `attributes`/`ficha` (lo que consume el motor de matrices).
  const [metrics] = React.useState<Metric[]>(() =>
    getActiveContext().metrics.map(definitionToMetric),
  );
  const loading = false;
  const error: Error | null = null;

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
