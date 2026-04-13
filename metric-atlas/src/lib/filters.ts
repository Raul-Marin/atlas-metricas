import type { AtlasFilters, Metric } from "./types";

export const defaultAtlasFilters: AtlasFilters = {
  layers: [],
  sources: [],
  measurementTypes: [],
  experimentalOnly: false,
  aiRelatedOnly: false,
  figmaAvailability: [],
};

export function metricMatchesFilters(
  metric: Metric,
  filters: AtlasFilters,
): boolean {
  if (filters.layers.length > 0 && !filters.layers.includes(metric.layer)) {
    return false;
  }
  if (filters.sources.length > 0) {
    const primaryOk = filters.sources.includes(metric.sourcePrimary);
    const secondaryOk =
      metric.sourceSecondary?.some((s) => filters.sources.includes(s)) ?? false;
    if (!primaryOk && !secondaryOk) return false;
  }
  if (
    filters.measurementTypes.length > 0 &&
    !filters.measurementTypes.includes(metric.measurementType)
  ) {
    return false;
  }
  if (filters.experimentalOnly && !metric.experimental) return false;
  if (filters.aiRelatedOnly && !metric.aiRelated) return false;
  if (
    filters.figmaAvailability.length > 0 &&
    !filters.figmaAvailability.includes(metric.figmaAvailability)
  ) {
    return false;
  }
  return true;
}

export function filterMetrics(metrics: Metric[], filters: AtlasFilters) {
  return metrics.filter((m) => metricMatchesFilters(m, filters));
}
