import type { AxisDimension } from "@/lib/context/types";
import { CATEGORIES } from "./categories";

/**
 * Dimensiones del contexto Design Systems.
 *
 * Se conservan los 12 ids "clásicos" (measurementType, layer, sourcePrimary,
 * impactZone, maturity, figmaAvailability, signalQuality, vizCategory,
 * experimental, aiRelated, impacto, esfuerzo) para que los boards ya guardados
 * sigan resolviendo sus ejes. Se añaden `categoria` (agrupa la biblioteca) y las
 * dimensiones de juicio que usan las 8 matrices-plantilla de Figma.
 *
 * - categorical/ordinal: el ORDEN de `values` = posición en el eje (0→1).
 * - judgment: sin valor de catálogo; arranca en el centro y se coloca arrastrando
 *   (las plantillas traen posiciones ya aplicadas).
 */

function ord(ids: [string, string][]): { id: string; label: string }[] {
  return ids.map(([id, label]) => ({ id, label }));
}

export const DIMENSIONS: AxisDimension[] = [
  // ── Categoría (primaria: agrupa la biblioteca de métricas) ──
  {
    id: "categoria",
    label: "Categoría",
    kind: "categorical",
    values: CATEGORIES,
    endLow: "Adopción",
    endHigh: "IA",
  },

  // ── Dimensiones de hecho clásicas (ids preservados) ──
  {
    id: "measurementType",
    label: "Tipo de medición",
    kind: "ordinal",
    values: ord([
      ["qualitative", "Cualitativo"],
      ["hybrid", "Híbrido"],
      ["experimental", "Experimental"],
      ["quantitative", "Cuantitativo"],
    ]),
    endLow: "Cualitativo",
    endHigh: "Cuantitativo",
  },
  {
    id: "layer",
    label: "Capa",
    kind: "ordinal",
    values: ord([
      ["adoption-operations", "Adopción / ops"],
      ["real-impact", "Impacto real"],
      ["ai-automation", "IA / automatización"],
      ["system-health", "Salud del sistema"],
      ["experimental-anti-slop", "Experimental / anti-slop"],
    ]),
    endLow: "Adopción / ops",
    endHigh: "Sistema / anti-slop",
  },
  {
    id: "sourcePrimary",
    label: "Fuente principal",
    kind: "categorical",
    values: ord([
      ["figma", "Figma"],
      ["code", "Código"],
      ["support", "Soporte"],
      ["product-analytics", "Product analytics"],
      ["research", "Research"],
      ["ai-logs", "IA / logs"],
    ]),
    endLow: "Figma",
    endHigh: "IA / logs",
  },
  {
    id: "impactZone",
    label: "Zona de impacto",
    kind: "ordinal",
    values: ord([
      ["system", "Sistema"],
      ["operations", "Operaciones"],
      ["product", "Producto"],
      ["business", "Negocio"],
      ["ai-automation", "IA / auto"],
    ]),
    endLow: "Sistema",
    endHigh: "IA / auto",
  },
  {
    id: "maturity",
    label: "Madurez",
    kind: "ordinal",
    values: ord([
      ["classical", "Clásica"],
      ["advanced", "Avanzada"],
      ["experimental", "Experimental"],
    ]),
    endLow: "Clásica",
    endHigh: "Experimental",
  },
  {
    id: "figmaAvailability",
    label: "Figma",
    kind: "ordinal",
    values: ord([
      ["no", "No"],
      ["partial", "Parcial"],
      ["yes", "Sí"],
    ]),
    endLow: "No",
    endHigh: "Sí",
  },
  {
    id: "signalQuality",
    label: "Calidad de señal",
    kind: "ordinal",
    values: ord([
      ["speculative", "Especulativa"],
      ["weak", "Débil"],
      ["medium", "Media"],
      ["strong", "Fuerte"],
    ]),
    endLow: "Especulativa",
    endHigh: "Fuerte",
  },
  {
    id: "vizCategory",
    label: "Categoría visual",
    kind: "categorical",
    values: ord([
      ["components", "Components"],
      ["support", "Support"],
      ["business", "Business"],
      ["end-user", "End-user"],
      ["code", "Code platform"],
      ["other", "Other"],
    ]),
    endLow: "Components",
    endHigh: "Other",
  },
  {
    id: "experimental",
    label: "Experimental",
    kind: "ordinal",
    values: ord([
      ["no", "No"],
      ["yes", "Sí"],
    ]),
    endLow: "No",
    endHigh: "Sí",
  },
  {
    id: "aiRelated",
    label: "IA-related",
    kind: "ordinal",
    values: ord([
      ["no", "No"],
      ["yes", "Sí"],
    ]),
    endLow: "No",
    endHigh: "Sí",
  },

  // ── Dimensiones de juicio (0–1, se colocan arrastrando) ──
  { id: "impacto", label: "Impacto", kind: "judgment", endLow: "Alto impacto", endHigh: "Bajo impacto" },
  { id: "esfuerzo", label: "Esfuerzo", kind: "judgment", endLow: "Mucho esfuerzo", endHigh: "Poco esfuerzo" },
  { id: "urgencia", label: "Urgencia", kind: "judgment", endLow: "Baja urgencia", endHigh: "Alta urgencia" },
  { id: "valor", label: "Valor", kind: "judgment", endLow: "Alto valor", endHigh: "Bajo valor" },
  { id: "facilidad", label: "Facilidad de medición", kind: "judgment", endLow: "Difícil de medir", endHigh: "Fácil de medir" },
  { id: "evidenciaNivel", label: "Evidencia", kind: "judgment", endLow: "Evidencia débil", endHigh: "Evidencia fuerte" },
  { id: "adopcionNivel", label: "Adopción", kind: "judgment", endLow: "Baja adopción", endHigh: "Alta adopción" },
  { id: "madurezNivel", label: "Madurez del sistema", kind: "judgment", endLow: "Alta madurez", endHigh: "Baja madurez" },
  // Polos específicos de matrices de Figma
  { id: "foco", label: "Foco", kind: "judgment", endLow: "Adopción / uso", endHigh: "Gobernanza / salud" },
  { id: "entorno", label: "Entorno", kind: "judgment", endLow: "Figma / diseño", endHigh: "Código / producción" },
  { id: "ambitoSistema", label: "Ámbito", kind: "judgment", endLow: "Adopción / operación", endHigh: "Sistema / anti-slop" },
  { id: "focoIA", label: "Foco IA", kind: "judgment", endLow: "Adopción", endHigh: "Control" },
  { id: "modoIA", label: "Modo IA", kind: "judgment", endLow: "Generación", endHigh: "Corrección" },
  { id: "alcance", label: "Alcance", kind: "judgment", endLow: "Operativo", endHigh: "Estratégico" },
  { id: "ambito", label: "Ámbito DS", kind: "judgment", endLow: "Externo al DS", endHigh: "Interno del DS" },
];

export const DIMENSIONS_BY_ID: Record<string, AxisDimension> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d]),
);
