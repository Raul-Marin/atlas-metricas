import type { MatrixAxisId, Metric, MetricScoresMap } from "@/lib/types";
import { axisScalar } from "@/lib/matrix-axes";
import { metricVizCategory, VIZ_LEGEND } from "@/lib/quadrant-viz";

/** Valor 0–100 de una métrica en una dimensión: score asignado, o el del catálogo. */
export function metricDimValue(
  metric: Metric,
  axis: MatrixAxisId,
  scores: MetricScoresMap,
): number {
  return Math.round(
    (scores[metric.id]?.[axis] ?? axisScalar(metric, axis, "x")) * 100,
  );
}

/** Color de la categoría/tipo de la métrica. */
export function metricColor(metric: Metric): string {
  return (
    VIZ_LEGEND.find((r) => r.key === metricVizCategory(metric))?.color ?? "#0d99ff"
  );
}
