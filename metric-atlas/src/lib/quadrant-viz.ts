import type { Metric } from "./types";
import { getActiveContext } from "./context/registry";

/** Categoría visual = id de categoría del contexto activo. */
export type VizCategory = string;

type VizShape = "diamond" | "pentagon" | "bag" | "circle" | "square" | "dot";
const SHAPES: VizShape[] = ["diamond", "circle", "square", "pentagon", "bag", "dot"];

/**
 * Leyenda de categorías (antes "TIPOS"): derivada de las categorías del contexto
 * activo. Cada categoría aporta color; la forma se asigna cíclicamente para las
 * vistas que dibujan un marcador por categoría.
 */
export const VIZ_LEGEND: {
  key: VizCategory;
  label: string;
  shape: VizShape;
  color: string;
}[] = getActiveContext().categories.map((c, i) => ({
  key: c.id,
  label: c.label,
  shape: SHAPES[i % SHAPES.length],
  color: c.color ?? "#737373",
}));

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Fondo y borde de ficha alineados con el color de la categoría en la leyenda */
export function vizCategoryCardAccent(
  cat: VizCategory,
  opts?: { selected?: boolean },
): { backgroundColor: string; borderColor: string } {
  const row = VIZ_LEGEND.find((l) => l.key === cat);
  const hex = row?.color ?? "#737373";
  const selected = opts?.selected ?? false;
  return {
    backgroundColor: hexToRgba(hex, selected ? 0.24 : 0.14),
    borderColor: hexToRgba(hex, selected ? 0.55 : 0.38),
  };
}

/** Categoría (una de las 8) de una métrica, leída de sus atributos genéricos. */
export function metricVizCategory(m: Metric): VizCategory {
  const cat = m.attributes?.categoria;
  if (typeof cat === "string" && cat) return cat;
  return getActiveContext().categories[0]?.id ?? "other";
}
