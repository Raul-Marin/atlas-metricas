import type { Metric } from "./types";

export type MapPoint = {
  id: string;
  x: number;
  y: number;
  metric: Metric;
};

export type MetricCluster = {
  id: string;
  x: number;
  y: number;
  metrics: Metric[];
};

function dist2(a: MapPoint, b: MapPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Radio en espacio normalizado 0–1: más zoom ⇒ menos agrupación.
 */
export function clusterRadiusForZoom(zoom: number): number {
  const z = Math.min(Math.max(zoom, 0.35), 2.75);
  const base = 0.095;
  return Math.min(0.22, Math.max(0.026, base / z));
}

/**
 * Agrupa métricas cercanas (tipo mapa / clusters). Una sola métrica ⇒ cluster unitario.
 */
export function clusterMapPoints(points: MapPoint[], radius: number): MetricCluster[] {
  if (points.length === 0) return [];
  const r2 = radius * radius;
  const remaining = [...points];
  const clusters: MetricCluster[] = [];
  let idx = 0;

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const group: MapPoint[] = [seed];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = remaining.length - 1; i >= 0; i--) {
        const q = remaining[i]!;
        const near = group.some((p) => dist2(p, q) <= r2);
        if (near) {
          group.push(q);
          remaining.splice(i, 1);
          changed = true;
        }
      }
    }
    const sx = group.reduce((s, p) => s + p.x, 0) / group.length;
    const sy = group.reduce((s, p) => s + p.y, 0) / group.length;
    clusters.push({
      id: `c-${idx++}-${group.map((p) => p.id).sort().join("-")}`,
      x: sx,
      y: sy,
      metrics: group.map((p) => p.metric),
    });
  }

  return clusters;
}

/** Una ficha por métrica (sin agrupar). */
export function singletonClustersFromPoints(points: MapPoint[]): MetricCluster[] {
  return points.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    metrics: [p.metric],
  }));
}

export function clampZoom(z: number, min = 0.35, max = 2.75): number {
  return Math.min(max, Math.max(min, z));
}
