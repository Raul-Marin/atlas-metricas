import type { MatrixAxesState, Metric, MetricScoresMap } from "./types";
import { axisScalar } from "./matrix-axes";

/** Distancia mínima normalizada entre centros de fichas (~evita solapes con tarjetas ~220×48px en canvas 5600×4200). */
export const LAYOUT_MIN_DIST_NORM = 0.05;

function clamp01(v: number, margin = 0.03): number {
  return Math.min(1 - margin, Math.max(margin, v));
}

type Pt = { id: string; x: number; y: number; fixed: boolean };

/**
 * Posición de cada métrica en el 2×2. Por cada eje:
 *   1. valor asignado por el usuario en esa dimensión (arrastrado), si existe;
 *   2. si no, el valor del catálogo (dimensiones de hecho) — `axisScalar`;
 *   3. si no (dimensión de juicio sin valorar) → centro (0.5).
 * Las fichas con valor en AMBOS ejes quedan fijas (no se separan ni desplazan
 * a otras); el resto se separa para evitar solapes.
 */
export function resolveMetricLayout(
  metrics: Metric[],
  axes: MatrixAxesState,
  scores: MetricScoresMap,
): Map<string, { x: number; y: number }> {
  const pts: Pt[] = metrics.map((m) => {
    const sx = scores[m.id]?.[axes.axisX];
    const sy = scores[m.id]?.[axes.axisY];
    return {
      id: m.id,
      x: sx ?? axisScalar(m, axes.axisX, "x"),
      y: sy ?? axisScalar(m, axes.axisY, "y"),
      fixed: sx != null && sy != null,
    };
  });

  const separated = separateOverlaps(pts, LAYOUT_MIN_DIST_NORM, 100);
  return new Map<string, { x: number; y: number }>(
    separated.map((p) => [p.id, { x: clamp01(p.x), y: clamp01(p.y) }]),
  );
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
