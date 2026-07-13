import type {
  FigmaAvailability,
  ImpactZone,
  Maturity,
  MeasurementType,
  Metric,
  MetricLayer,
  SignalQuality,
  SourceType,
} from "@/lib/types";
import type { MatrixBoardCanvasSettings } from "@/lib/matrix-boards";
import type { MatrixTemplateDef, MetricContext, MetricDefinition } from "./types";
import { getActiveContext } from "./registry";

/**
 * Mapea etiquetas de audiencia (p.ej. "DS Team", "Todas") a ids canónicos del
 * contexto. "Todas" expande a todas las audiencias; las no reconocidas se ignoran.
 */
export function audienceIdsFromLabels(
  labels: string[] | undefined,
  ctx: MetricContext = getActiveContext(),
): string[] {
  if (!labels?.length) return [];
  const byLabel = new Map(ctx.audiences.map((a) => [a.label.toLowerCase(), a.id]));
  const ids = new Set<string>();
  for (const label of labels) {
    const key = label.trim().toLowerCase();
    if (key === "todas" || key === "todos") {
      ctx.audiences.forEach((a) => ids.add(a.id));
      continue;
    }
    const id = byLabel.get(key);
    if (id) ids.add(id);
  }
  return [...ids];
}

/**
 * Convierte una MetricDefinition (genérica del pack) en el `Metric` de runtime.
 * El motor de matrices y la biblioteca leen `attributes`/`ficha`; las vistas
 * DS-específicas (documentación, filtros, badges) leen los campos clásicos, que
 * aquí se reconstruyen desde `attributes`/`ficha` (con fallback si el contexto
 * no aporta ese atributo).
 */
export function definitionToMetric(def: MetricDefinition): Metric {
  const a = def.attributes;
  const str = <T extends string>(key: string, fallback: T): T =>
    (typeof a[key] === "string" ? (a[key] as T) : fallback);
  const bool = (key: string): boolean => a[key] === true;

  return {
    id: def.id,
    name: def.name,
    shortName: def.shortName,
    layer: str<MetricLayer>("layer", "adoption-operations"),
    impactZone: str<ImpactZone>("impactZone", "system"),
    measurementType: str<MeasurementType>("measurementType", "quantitative"),
    sourcePrimary: str<SourceType>("sourcePrimary", "figma"),
    figmaAvailability: str<FigmaAvailability>("figmaAvailability", "no"),
    maturity: str<Maturity>("maturity", "classical"),
    signalQuality: str<SignalQuality>("signalQuality", "medium"),
    experimental: bool("experimental"),
    aiRelated: bool("aiRelated"),
    realtimePossible: false,
    description: def.ficha.description,
    whyItMatters: def.ficha.whyItMatters ?? "",
    howToMeasure: def.ficha.howToMeasure ?? [],
    tags: def.tags,
    relatedMetricIds: def.relatedMetricIds,
    automationIdeas: def.ficha.automationIdeas,
    risksBiases: def.ficha.risksBiases,
    priority: def.priority,
    archived: def.archived,
    // capa genérica (la que consume el motor)
    contextId: def.contextId,
    attributes: def.attributes,
    ficha: def.ficha,
    icon: def.icon,
  };
}

/**
 * Canvas de un board pre-montado desde una plantilla (una matriz): ejes fijados,
 * fichas ya aplicadas (placedScores) y el resto de métricas excluidas del canvas.
 */
export function templateDefToCanvas(
  def: MatrixTemplateDef,
  allMetricIds: string[],
): Partial<MatrixBoardCanvasSettings> {
  const included = new Set(def.includedMetricIds);
  return {
    matrixAxes: { axisX: def.axisX, axisY: def.axisY },
    metricScores: def.placedScores,
    excludedMetricIds: allMetricIds.filter((id) => !included.has(id)),
    ...(def.quadrantColors ? { quadrantColors: def.quadrantColors } : {}),
    audiences: audienceIdsFromLabels(def.audience),
    templateId: def.id,
  };
}
