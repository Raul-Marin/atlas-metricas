import type {
  FigmaAvailability,
  ImpactZone,
  MatrixAxisId,
  MatrixAxesState,
  MeasurementType,
  Metric,
  MetricLayer,
  Maturity,
  SignalQuality,
} from "./types";
import { SOURCE_TYPES } from "./constants";
import { metricVizCategory, type VizCategory, VIZ_LEGEND } from "./quadrant-viz";

export const defaultMatrixAxes: MatrixAxesState = {
  axisX: "measurementType",
  axisY: "layer",
};

/** Orden eje X: de izquierda a derecha */
const MEASUREMENT_AXIS_ORDER: MeasurementType[] = [
  "qualitative",
  "hybrid",
  "experimental",
  "quantitative",
];

/** Orden eje Y: de arriba a abajo (arriba = adopción / impacto operativo) */
const LAYER_AXIS_ORDER: MetricLayer[] = [
  "adoption-operations",
  "real-impact",
  "ai-automation",
  "system-health",
  "experimental-anti-slop",
];

const IMPACT_AXIS_ORDER: ImpactZone[] = [
  "system",
  "operations",
  "product",
  "business",
  "ai-automation",
];

const FIGMA_AXIS_ORDER: FigmaAvailability[] = ["no", "partial", "yes"];

const MATURITY_AXIS_ORDER: Maturity[] = ["classical", "advanced", "experimental"];

const SIGNAL_AXIS_ORDER: SignalQuality[] = [
  "speculative",
  "weak",
  "medium",
  "strong",
];

const VIZ_AXIS_ORDER: VizCategory[] = VIZ_LEGEND.map((v) => v.key);

function hashJitter(id: string, salt: string): number {
  const s = id + salt;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

function positionInOrder<T extends string>(
  value: T,
  order: readonly T[],
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

export function axisScalar(
  m: Metric,
  axis: MatrixAxisId,
  salt: "x" | "y",
): number {
  switch (axis) {
    case "measurementType":
      return positionInOrder(m.measurementType, MEASUREMENT_AXIS_ORDER, m.id, salt);
    case "layer":
      return positionInOrder(m.layer, LAYER_AXIS_ORDER, m.id, salt);
    case "sourcePrimary":
      return positionInOrder(m.sourcePrimary, SOURCE_TYPES, m.id, salt);
    case "impactZone":
      return positionInOrder(m.impactZone, IMPACT_AXIS_ORDER, m.id, salt);
    case "maturity":
      return positionInOrder(m.maturity, MATURITY_AXIS_ORDER, m.id, salt);
    case "figmaAvailability":
      return positionInOrder(m.figmaAvailability, FIGMA_AXIS_ORDER, m.id, salt);
    case "signalQuality":
      return positionInOrder(m.signalQuality, SIGNAL_AXIS_ORDER, m.id, salt);
    case "vizCategory":
      return positionInOrder(metricVizCategory(m), VIZ_AXIS_ORDER, m.id, salt);
    case "experimental":
      return boolPos(m.experimental, m.id, salt);
    case "aiRelated":
      return boolPos(m.aiRelated, m.id, salt);
    default:
      return 0.5;
  }
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

/** Metadatos para UI: etiqueta del eje y textos en los extremos */
export const MATRIX_AXIS_OPTIONS: {
  id: MatrixAxisId;
  label: string;
  endLow: string;
  endHigh: string;
}[] = [
  {
    id: "measurementType",
    label: "Tipo de medición",
    endLow: "Cualitativo",
    endHigh: "Cuantitativo",
  },
  {
    id: "layer",
    label: "Capa",
    endLow: "Adopción / ops",
    endHigh: "Sistema / anti-slop",
  },
  {
    id: "sourcePrimary",
    label: "Fuente principal",
    endLow: "Primera (orden lista)",
    endHigh: "Última",
  },
  {
    id: "impactZone",
    label: "Zona de impacto",
    endLow: "Sistema",
    endHigh: "IA / auto",
  },
  {
    id: "maturity",
    label: "Madurez",
    endLow: "Clásica",
    endHigh: "Experimental",
  },
  {
    id: "figmaAvailability",
    label: "Figma",
    endLow: "No",
    endHigh: "Sí",
  },
  {
    id: "signalQuality",
    label: "Calidad de señal",
    endLow: "Especulativa",
    endHigh: "Fuerte",
  },
  {
    id: "vizCategory",
    label: "Categoría visual",
    endLow: "Components",
    endHigh: "Other",
  },
  {
    id: "experimental",
    label: "Experimental",
    endLow: "No",
    endHigh: "Sí",
  },
  {
    id: "aiRelated",
    label: "IA-related",
    endLow: "No",
    endHigh: "Sí",
  },
];

export function axisEndLabels(axis: MatrixAxisId): { low: string; high: string } {
  const meta = MATRIX_AXIS_OPTIONS.find((o) => o.id === axis);
  return meta
    ? { low: meta.endLow, high: meta.endHigh }
    : { low: "Bajo", high: "Alto" };
}

/** Ajusta ejes si X e Y son iguales */
export function normalizeAxes(axes: MatrixAxesState): MatrixAxesState {
  if (axes.axisX !== axes.axisY) return axes;
  const fallbackY: MatrixAxisId =
    axes.axisY === "layer" ? "measurementType" : "layer";
  return { ...axes, axisY: fallbackY };
}
