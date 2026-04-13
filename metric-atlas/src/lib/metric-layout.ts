import type { MatrixAxesState, Metric } from "./types";
import { metricMapPosition } from "./matrix-axes";

/** Distancia mínima normalizada entre centros de fichas (~evita solapes con tarjetas ~220×48px en canvas 5600×4200). */
export const LAYOUT_MIN_DIST_NORM = 0.05;

export type ManualPositionsMap = Record<string, { x: number; y: number }>;

function clamp01(v: number, margin = 0.03): number {
  return Math.min(1 - margin, Math.max(margin, v));
}

type Pt = { id: string; x: number; y: number; fixed: boolean };

/**
 * Coloca cada métrica según los ejes; las que tienen posición manual se anclan y el resto se separa sin solapes.
 */
export function resolveMetricLayout(
  metrics: Metric[],
  axes: MatrixAxesState,
  manual: ManualPositionsMap,
): Map<string, { x: number; y: number }> {
  const pts: Pt[] = metrics.map((m) => {
    const base = metricMapPosition(m, axes);
    const o = manual[m.id];
    return {
      id: m.id,
      x: o?.x ?? base.x,
      y: o?.y ?? base.y,
      fixed: Boolean(o),
    };
  });

  const separated = separateOverlaps(pts, LAYOUT_MIN_DIST_NORM, 100);
  return new Map(separated.map((p) => [p.id, { x: p.x, y: p.y }]));
}

function separateOverlaps(
  points: Pt[],
  minDist: number,
  iterations: number,
): Pt[] {
  const out = points.map((p) => ({ ...p }));
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const dist = Math.hypot(dx, dy) || 1e-9;
        if (dist >= minDist) continue;
        const push = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        const fi = out[i].fixed;
        const fj = out[j].fixed;
        if (fi && fj) {
          out[i].x -= nx * (push / 2);
          out[i].y -= ny * (push / 2);
          out[j].x += nx * (push / 2);
          out[j].y += ny * (push / 2);
        } else if (fi && !fj) {
          out[j].x += nx * push;
          out[j].y += ny * push;
        } else if (!fi && fj) {
          out[i].x -= nx * push;
          out[i].y -= ny * push;
        } else {
          out[i].x -= nx * (push / 2);
          out[i].y -= ny * (push / 2);
          out[j].x += nx * (push / 2);
          out[j].y += ny * (push / 2);
        }
      }
    }
  }
  for (const p of out) {
    p.x = clamp01(p.x);
    p.y = clamp01(p.y);
  }
  return out;
}
