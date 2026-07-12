export type MetricLayer =
  | "system-health"
  | "adoption-operations"
  | "real-impact"
  | "ai-automation"
  | "experimental-anti-slop";

export type ImpactZone =
  | "system"
  | "operations"
  | "product"
  | "business"
  | "ai-automation";

export type MeasurementType =
  | "qualitative"
  | "quantitative"
  | "hybrid"
  | "experimental";

export type SourceType =
  | "figma"
  | "code"
  | "support"
  | "product-analytics"
  | "research"
  | "ai-logs";

export type FigmaAvailability = "yes" | "partial" | "no";

export type Maturity = "classical" | "advanced" | "experimental";

export type SignalQuality = "strong" | "medium" | "weak" | "speculative";

export interface Metric {
  id: string;
  name: string;
  shortName?: string;
  layer: MetricLayer;
  subgroup?: string;
  impactZone: ImpactZone;
  measurementType: MeasurementType;
  sourcePrimary: SourceType;
  sourceSecondary?: SourceType[];
  figmaAvailability: FigmaAvailability;
  maturity: Maturity;
  signalQuality: SignalQuality;
  experimental: boolean;
  aiRelated: boolean;
  realtimePossible: boolean;
  description: string;
  whyItMatters: string;
  howToMeasure: string[];
  tags: string[];
  relatedMetricIds: string[];
  dashboardIdeas?: string[];
  automationIdeas?: string[];
  risksBiases?: string[];
  priority?: number;
  /** Métricas archivadas siguen apareciendo en boards que ya las usan
   *  con un badge "Obsoleta", pero quedan ocultas de la documentación
   *  y de los nuevos boards. */
  archived?: boolean;

  // ── Capa genérica (modelo de contexto escalable) ──
  // Las poblan las métricas del pack activo. El motor de matrices lee SOLO de
  // aquí; los campos clásicos de arriba son la vista DS-específica.
  /** Id del contexto/dominio al que pertenece la métrica. */
  contextId?: string;
  /** Valores por dimensión (clave = dimension.id). Alimenta el motor 2×2. */
  attributes?: Record<string, string | boolean>;
  /** Ficha descriptiva rica (superset de la ficha de Figma). */
  ficha?: import("./context/types").MetricFicha;
  /** Nombre de icono lucide (opcional). */
  icon?: string;
}

export interface AtlasFilters {
  layers: MetricLayer[];
  sources: SourceType[];
  measurementTypes: MeasurementType[];
  experimentalOnly: boolean;
  aiRelatedOnly: boolean;
  figmaAvailability: FigmaAvailability[];
}

/** Variables disponibles como eje del mapa 2×2.
 *  Ahora es el `id` de una dimensión del contexto activo (ver `lib/context/types.ts`).
 *  - dimensiones "categorical"/"ordinal": la posición sale del atributo de la métrica.
 *  - dimensiones "judgment": valoraciones del usuario (impacto, esfuerzo, …); sin valor
 *    de catálogo, arrancan en el centro y se asignan arrastrando, por matriz.
 *  Se mantiene como `string` para que un contexto nuevo aporte sus propias dimensiones
 *  sin tocar este tipo. */
export type MatrixAxisId = string;

/** Valoraciones por métrica y dimensión, 0–1 (posición en el eje). */
export type MetricScoresMap = Record<
  string,
  Partial<Record<MatrixAxisId, number>>
>;

export interface MatrixAxesState {
  axisX: MatrixAxisId;
  axisY: MatrixAxisId;
}
