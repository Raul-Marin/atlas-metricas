import { metrics } from "@/data/metrics";

export function getMetricById(id: string) {
  return metrics.find((m) => m.id === id);
}

export function getAllMetrics() {
  return metrics;
}
