"use client";

import { getActiveContext } from "./registry";
import type { MetricContext } from "./types";

/**
 * Acceso al contexto (pack de dominio) activo. Hoy resuelve siempre Design
 * Systems; cuando exista multi-contexto por workspace se resolverá por id.
 * El pack es estático (código), así que no hace falta un Provider React.
 */
export function useMetricContext(): MetricContext {
  return getActiveContext();
}
