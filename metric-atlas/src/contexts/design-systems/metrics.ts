import type { MetricDefinition } from "@/lib/context/types";
import { ADOPCION_METRICS } from "./metrics/adopcion";
import { GOBERNANZA_METRICS } from "./metrics/gobernanza";
import { CALIDAD_METRICS } from "./metrics/calidad";
import { DELIVERY_METRICS } from "./metrics/delivery";
import { CODIGO_METRICS } from "./metrics/codigo";
import { DOCUMENTACION_METRICS } from "./metrics/documentacion";
import { SATISFACCION_METRICS } from "./metrics/satisfaccion";
import { IA_METRICS } from "./metrics/ia";

export const CONTEXT_ID = "design-systems";

/** Capa (dimensión clásica) inferida de la categoría, para vistas DS-específicas. */
function layerForCategoria(cat: string): string {
  switch (cat) {
    case "adopcion":
    case "documentacion":
      return "adoption-operations";
    case "delivery":
    case "satisfaccion":
      return "real-impact";
    case "ia":
      return "ai-automation";
    default:
      return "system-health"; // gobernanza, calidad, codigo
  }
}

/** Zona de impacto inferida de la categoría. */
function impactZoneForCategoria(cat: string): string {
  switch (cat) {
    case "adopcion":
    case "documentacion":
      return "operations";
    case "calidad":
    case "delivery":
    case "satisfaccion":
      return "product";
    case "ia":
      return "ai-automation";
    default:
      return "system"; // gobernanza, codigo
  }
}

/** Categoría visual (leyenda TIPOS) inferida de la fuente. */
function vizForSource(source: string): string {
  switch (source) {
    case "figma":
      return "components";
    case "code":
      return "code";
    case "support":
      return "support";
    case "product-analytics":
      return "business";
    case "research":
      return "end-user";
    default:
      return "other";
  }
}

/**
 * Rellena atributos derivados que las plantillas no piden pero las vistas
 * DS-específicas (documentación, filtros, badges) necesitan: layer, impactZone,
 * vizCategory, experimental, aiRelated.
 */
function normalize(m: MetricDefinition): MetricDefinition {
  const a: Record<string, string | boolean> = { ...m.attributes };
  const cat = typeof a.categoria === "string" ? a.categoria : "adopcion";
  const source = typeof a.sourcePrimary === "string" ? a.sourcePrimary : "figma";
  if (a.layer == null) a.layer = layerForCategoria(cat);
  if (a.impactZone == null) a.impactZone = impactZoneForCategoria(cat);
  if (a.vizCategory == null) a.vizCategory = vizForSource(source);
  if (a.experimental == null) a.experimental = a.maturity === "experimental";
  if (a.aiRelated == null) a.aiRelated = cat === "ia";
  return { ...m, contextId: CONTEXT_ID, attributes: a };
}

/**
 * Catálogo real del contexto Design Systems: las ~80 métricas de Figma
 * (node 4:966), agrupadas en 8 categorías.
 */
export const DS_METRICS: MetricDefinition[] = [
  ...ADOPCION_METRICS,
  ...GOBERNANZA_METRICS,
  ...CALIDAD_METRICS,
  ...DELIVERY_METRICS,
  ...CODIGO_METRICS,
  ...DOCUMENTACION_METRICS,
  ...SATISFACCION_METRICS,
  ...IA_METRICS,
].map(normalize);

export const DS_METRICS_BY_ID: Record<string, MetricDefinition> = Object.fromEntries(
  DS_METRICS.map((m) => [m.id, m]),
);
