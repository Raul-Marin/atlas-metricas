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
 * Coloca cada métrica según los ejes con separación auto-auto. Después aplica
 * las posiciones manuales encima sin alterar al resto: mover una ficha manual
 * no debe afectar a la posición de las demás.
 */
export function resolveMetricLayout(
  metrics: Metric[],
  axes: MatrixAxesState,
  manual: ManualPositionsMap,
): Map<string, { x: number; y: number }> {
  const autoPts: Pt[] = metrics.map((m) => {
    const base = metricMapPosition(m, axes);
    return { id: m.id, x: base.x, y: base.y, fixed: false };
  });

  const separated = separateOverlaps(autoPts, LAYOUT_MIN_DIST_NORM, 100);
  const map = new Map<string, { x: number; y: number }>(
    separated.map((p) => [p.id, { x: p.x, y: p.y }]),
  );

  for (const m of metrics) {
    const o = manual[m.id];
    if (!o) continue;
    map.set(m.id, { x: clamp01(o.x), y: clamp01(o.y) });
  }

  return map;
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
        // Las posiciones manuales no se mueven ni desplazan a otras: respetan
        // exactamente lo que el usuario fijó. Solo separamos pares auto-auto.
        if (out[i].fixed || out[j].fixed) continue;
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const dist = Math.hypot(dx, dy) || 1e-9;
        if (dist >= minDist) continue;
        const push = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        out[i].x -= nx * (push / 2);
        out[i].y -= ny * (push / 2);
        out[j].x += nx * (push / 2);
        out[j].y += ny * (push / 2);
      }
    }
  }
  for (const p of out) {
    if (p.fixed) continue;
    p.x = clamp01(p.x);
    p.y = clamp01(p.y);
  }
  return out;
}
