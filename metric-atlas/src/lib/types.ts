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
}

export interface AtlasFilters {
  layers: MetricLayer[];
  sources: SourceType[];
  measurementTypes: MeasurementType[];
  experimentalOnly: boolean;
  aiRelatedOnly: boolean;
  figmaAvailability: FigmaAvailability[];
}

/** Variables disponibles como eje del mapa 2×2 */
export type MatrixAxisId =
  | "measurementType"
  | "layer"
  | "sourcePrimary"
  | "impactZone"
  | "maturity"
  | "figmaAvailability"
  | "signalQuality"
  | "vizCategory"
  | "experimental"
  | "aiRelated";

export interface MatrixAxesState {
  axisX: MatrixAxisId;
  axisY: MatrixAxisId;
}
