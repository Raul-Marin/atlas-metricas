import type { MatrixAxisId, MatrixAxesState, Metric } from "./types";
import { dimensionById, getActiveContext } from "./context/registry";

/** Por defecto, una matriz nueva usa los ejes por defecto del contexto activo. */
export const defaultMatrixAxes: MatrixAxesState = getActiveContext().defaultAxes;

function hashJitter(id: string, salt: string): number {
  const s = id + salt;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

function positionInOrder(
  value: string,
  order: readonly string[],
  id: string,
  salt: "x" | "y",
): number {
  let idx = order.indexOf(value);
  if (idx < 0) idx = Math.floor(order.length / 2);
  const n = Math.max(1, order.length - 1);
  const base = 0.1 + (idx / n) * 0.8;
  /** Jitter suave: la separación posterior evita solapes. */
  const jitter = (hashJitter(id, salt + value) - 0.5) * 0.034;
  return Math.min(0.93, Math.max(0.07, base + jitter));
}

function boolPos(v: boolean, id: string, salt: "x" | "y"): number {
  const base = v ? 0.75 : 0.25;
  const jitter = (hashJitter(id, salt + "bool") - 0.5) * 0.04;
  return Math.min(0.9, Math.max(0.1, base + jitter));
}

/**
 * Posición 0–1 de una métrica en una dimensión (eje). Genérico sobre el contexto:
 * - dimensión "judgment": sin valor de catálogo → centro (0.5); se coloca arrastrando.
 * - dimensión categorical/ordinal: se lee `metric.attributes[dim.id]` y se proyecta
 *   según el orden de `dim.values` (o boolPos si el atributo es booleano).
 */
export function axisScalar(
  m: Metric,
  axis: MatrixAxisId,
  salt: "x" | "y",
): number {
  const dim = dimensionById(axis);
  if (!dim || dim.kind === "judgment") return 0.5;
  const raw = m.attributes?.[dim.id];
  if (typeof raw === "boolean") return boolPos(raw, m.id, salt);
  const order = (dim.values ?? []).map((v) => v.id);
  return positionInOrder(raw != null ? String(raw) : "", order, m.id, salt);
}

export function metricMapPosition(
  m: Metric,
  axes: MatrixAxesState,
): { x: number; y: number } {
  return {
    x: axisScalar(m, axes.axisX, "x"),
    y: axisScalar(m, axes.axisY, "y"),
  };
}

/** Metadatos para UI: etiqueta del eje y textos en los extremos (del contexto activo). */
export const MATRIX_AXIS_OPTIONS: {
  id: MatrixAxisId;
  label: string;
  endLow: string;
  endHigh: string;
}[] = getActiveContext().dimensions.map((d) => ({
  id: d.id,
  label: d.label,
  endLow: d.endLow ?? "Bajo",
  endHigh: d.endHigh ?? "Alto",
}));

export function axisEndLabels(axis: MatrixAxisId): { low: string; high: string } {
  const dim = dimensionById(axis);
  return dim
    ? { low: dim.endLow ?? "Bajo", high: dim.endHigh ?? "Alto" }
    : { low: "Bajo", high: "Alto" };
}

/** Ajusta ejes si X e Y son iguales */
export function normalizeAxes(axes: MatrixAxesState): MatrixAxesState {
  if (axes.axisX !== axes.axisY) return axes;
  const def = getActiveContext().defaultAxes;
  const fallbackY = axes.axisX === def.axisY ? def.axisX : def.axisY;
  return { ...axes, axisY: fallbackY };
}
