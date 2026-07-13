import type { AxisDimension, MetricContext } from "./types";
import { designSystemsContext } from "@/contexts/design-systems";

/**
 * Registro de contextos (packs de dominio). Hoy solo Design Systems.
 * Añadir un contexto = registrar aquí su pack; el motor no cambia.
 *
 * El "contexto activo" es de momento un singleton a nivel de módulo (DS).
 * Cuando exista multi-contexto por workspace, se resolverá por `contextId`.
 */
export const CONTEXTS: Record<string, MetricContext> = {
  [designSystemsContext.id]: designSystemsContext,
};

export const DEFAULT_CONTEXT_ID = designSystemsContext.id;

let activeContextId = DEFAULT_CONTEXT_ID;

export function getContext(id?: string | null): MetricContext {
  return (id && CONTEXTS[id]) || CONTEXTS[DEFAULT_CONTEXT_ID];
}

export function getActiveContext(): MetricContext {
  return getContext(activeContextId);
}

export function setActiveContextId(id: string): void {
  if (CONTEXTS[id]) activeContextId = id;
}

/** Dimensión por id dentro de un contexto (fallback: contexto activo). */
export function dimensionById(
  id: string,
  context: MetricContext = getActiveContext(),
): AxisDimension | undefined {
  return context.dimensions.find((d) => d.id === id);
}
