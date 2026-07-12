import type { DimensionValue } from "@/lib/context/types";

/**
 * Las 8 categorías del contexto Design Systems (Figma node 4:966).
 * Agrupan la biblioteca de métricas y dan color a la ficha / al punto de categoría.
 */
export const CATEGORIES: DimensionValue[] = [
  { id: "adopcion", label: "Adopción", color: "#4f46e5" },
  { id: "gobernanza", label: "Gobernanza", color: "#0891b2" },
  { id: "calidad", label: "Calidad", color: "#16a34a" },
  { id: "delivery", label: "Delivery", color: "#ea580c" },
  { id: "codigo", label: "Código", color: "#ca8a04" },
  { id: "documentacion", label: "Documentación", color: "#7c3aed" },
  { id: "satisfaccion", label: "Satisfacción", color: "#db2777" },
  { id: "ia", label: "IA / anti-slop", color: "#0d99ff" },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const CATEGORY_BY_ID: Record<string, DimensionValue> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
