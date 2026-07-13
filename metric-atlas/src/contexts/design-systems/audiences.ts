import type { DimensionValue } from "@/lib/context/types";

/**
 * Audiencias canónicas del contexto Design Systems (las que usan las 8 matrices
 * de Figma). Lista controlada para el selector de audiencia del board.
 */
export const AUDIENCES: DimensionValue[] = [
  { id: "ds-team", label: "DS Team", color: "#4f46e5" },
  { id: "leadership", label: "Leadership", color: "#0891b2" },
  { id: "diseno", label: "Diseño", color: "#db2777" },
  { id: "engineering", label: "Engineering", color: "#ca8a04" },
  { id: "producto", label: "Producto", color: "#16a34a" },
  { id: "ops", label: "Ops", color: "#ea580c" },
];
