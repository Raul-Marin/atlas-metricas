import type { MetricContext } from "@/lib/context/types";
import { DIMENSIONS } from "./dimensions";
import { CATEGORIES } from "./categories";
import { DS_METRICS } from "./metrics";
import { DS_TEMPLATES } from "./templates";

/** Contexto Design Systems: el primer (y por ahora único) pack de dominio. */
export const designSystemsContext: MetricContext = {
  id: "design-systems",
  name: "Design Systems",
  dimensions: DIMENSIONS,
  categories: CATEGORIES,
  metrics: DS_METRICS,
  templates: DS_TEMPLATES,
  defaultAxes: { axisX: "esfuerzo", axisY: "impacto" },
};

export { DIMENSIONS, DIMENSIONS_BY_ID } from "./dimensions";
export { CATEGORIES, CATEGORY_BY_ID } from "./categories";
export { DS_METRICS, DS_METRICS_BY_ID } from "./metrics";
export { DS_TEMPLATES } from "./templates";
