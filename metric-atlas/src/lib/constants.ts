import type {
  FigmaAvailability,
  MeasurementType,
  MetricLayer,
  SourceType,
} from "./types";

export const MEASUREMENT_TYPES: MeasurementType[] = [
  "qualitative",
  "quantitative",
  "hybrid",
  "experimental",
];

export const METRIC_LAYERS: MetricLayer[] = [
  "system-health",
  "adoption-operations",
  "real-impact",
  "ai-automation",
  "experimental-anti-slop",
];

export const SOURCE_TYPES: SourceType[] = [
  "figma",
  "code",
  "support",
  "product-analytics",
  "research",
  "ai-logs",
];

export const FIGMA_AVAILABILITY: FigmaAvailability[] = [
  "yes",
  "partial",
  "no",
];
