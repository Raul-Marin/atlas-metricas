import type { Metric, MetricLayer, MeasurementType } from "./types";

export type VizCategory =
  | "components"
  | "support"
  | "business"
  | "end-user"
  | "code"
  | "other";

export const VIZ_LEGEND: {
  key: VizCategory;
  label: string;
  shape: "diamond" | "pentagon" | "bag" | "circle" | "square" | "dot";
  color: string;
}[] = [
  { key: "components", label: "Components", shape: "diamond", color: "#7c3aed" },
  { key: "support", label: "Support", shape: "pentagon", color: "#dc2626" },
  { key: "business", label: "Business", shape: "bag", color: "#92400e" },
  { key: "end-user", label: "End-user", shape: "circle", color: "#16a34a" },
  { key: "code", label: "Code platform", shape: "square", color: "#ca8a04" },
  { key: "other", label: "Other", shape: "dot", color: "#0ea5e9" },
];

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

function hashJitter(id: string, salt: string): number {
  const s = id + salt;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

/** Eje X: cualitativo (izq) → cuantitativo (der) */
function baseX(measurementType: MeasurementType): number {
  switch (measurementType) {
    case "qualitative":
      return 0.22;
    case "quantitative":
      return 0.78;
    case "hybrid":
      return 0.5;
    case "experimental":
      return 0.55;
    default:
      return 0.5;
  }
}

/** Eje Y: adopción (arriba) → gobernanza (abajo) — en % CSS top, arriba = menor valor */
function baseY(layer: MetricLayer): number {
  switch (layer) {
    case "adoption-operations":
      return 0.22;
    case "system-health":
      return 0.8;
    case "real-impact":
      return 0.4;
    case "ai-automation":
      return 0.48;
    case "experimental-anti-slop":
      return 0.58;
    default:
      return 0.5;
  }
}

export function metricVizCategory(m: Metric): VizCategory {
  const t = m.tags.join(" ").toLowerCase();
  const id = m.id.toLowerCase();
  if (m.sourcePrimary === "support" || t.includes("designops") || id.includes("ticket")) {
    return "support";
  }
  if (
    m.sourcePrimary === "product-analytics" ||
    m.impactZone === "business" ||
    t.includes("business") ||
    t.includes("outcomes")
  ) {
    return "business";
  }
  if (
    m.sourcePrimary === "research" ||
    t.includes("a11y") ||
    t.includes("ux") ||
    t.includes("user")
  ) {
    return "end-user";
  }
  if (m.sourcePrimary === "code") {
    return "code";
  }
  if (
    m.sourcePrimary === "figma" ||
    t.includes("components") ||
    t.includes("tokens") ||
    t.includes("figma")
  ) {
    return "components";
  }
  return "other";
}

export function metricQuadrantPosition(m: Metric): { x: number; y: number } {
  const jx = (hashJitter(m.id, "x") - 0.5) * 0.14;
  const jy = (hashJitter(m.id, "y") - 0.5) * 0.12;
  let x = baseX(m.measurementType) + jx;
  let y = baseY(m.layer) + jy;
  x = Math.min(0.9, Math.max(0.1, x));
  y = Math.min(0.9, Math.max(0.1, y));
  return { x, y };
}
