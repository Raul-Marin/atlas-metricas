import { metrics as LEGACY_METRICS } from "@/data/metrics";
import type { Metric } from "@/lib/types";
import type { MetricDefinition } from "@/lib/context/types";

export const CONTEXT_ID = "design-systems";

/** Categoría (una de las 8) inferida de la métrica clásica. */
function categoriaOf(m: Metric): string {
  const sub = (m.subgroup ?? "").toLowerCase();
  const t = m.tags.join(" ").toLowerCase();
  const id = m.id.toLowerCase();
  if (m.aiRelated || m.layer === "ai-automation" || m.layer === "experimental-anti-slop")
    return "ia";
  if (sub.includes("doc") || id.includes("documentation")) return "documentacion";
  if (m.sourcePrimary === "code" || sub.includes("engineering")) return "codigo";
  if (
    sub.includes("governance") ||
    sub.includes("hygiene") ||
    sub.includes("support") ||
    sub.includes("operations") ||
    id.includes("deprecated") ||
    id.includes("api-stability")
  )
    return "gobernanza";
  if (m.sourcePrimary === "research" || sub.includes("experience") || t.includes("perceived"))
    return "satisfaccion";
  if (m.layer === "real-impact") return "delivery";
  if (m.layer === "adoption-operations") return "adopcion";
  return "calidad";
}

/** vizCategory (leyenda TIPOS) derivada de la métrica clásica. */
function vizCategoriaOf(m: Metric): string {
  const t = m.tags.join(" ").toLowerCase();
  const id = m.id.toLowerCase();
  if (m.sourcePrimary === "support" || t.includes("designops") || id.includes("ticket"))
    return "support";
  if (m.sourcePrimary === "product-analytics" || m.impactZone === "business" || t.includes("business"))
    return "business";
  if (m.sourcePrimary === "research" || t.includes("a11y") || t.includes("ux") || t.includes("user"))
    return "end-user";
  if (m.sourcePrimary === "code") return "code";
  if (m.sourcePrimary === "figma" || t.includes("components") || t.includes("tokens") || t.includes("figma"))
    return "components";
  return "other";
}

/** Deriva una MetricDefinition genérica desde una métrica clásica (Fase 1). */
function toDefinition(m: Metric): MetricDefinition {
  return {
    id: m.id,
    name: m.name,
    shortName: m.shortName,
    contextId: CONTEXT_ID,
    attributes: {
      categoria: categoriaOf(m),
      measurementType: m.measurementType,
      layer: m.layer,
      sourcePrimary: m.sourcePrimary,
      impactZone: m.impactZone,
      maturity: m.maturity,
      figmaAvailability: m.figmaAvailability,
      signalQuality: m.signalQuality,
      vizCategory: vizCategoriaOf(m),
      experimental: m.experimental,
      aiRelated: m.aiRelated,
    },
    ficha: {
      description: m.description,
      whyItMatters: m.whyItMatters,
      howToMeasure: m.howToMeasure,
      risksBiases: m.risksBiases,
      automationIdeas: m.automationIdeas,
    },
    tags: m.tags,
    relatedMetricIds: m.relatedMetricIds,
    priority: m.priority,
    archived: m.archived,
  };
}

/**
 * Catálogo del contexto Design Systems.
 * Fase 1: derivado del catálogo clásico (24 métricas) para no romper nada.
 * Fase 2 (en curso): sustituir por las ~80 métricas reales de Figma (node 4:966).
 */
export const DS_METRICS: MetricDefinition[] = LEGACY_METRICS.map(toDefinition);

export const DS_METRICS_BY_ID: Record<string, MetricDefinition> = Object.fromEntries(
  DS_METRICS.map((m) => [m.id, m]),
);
