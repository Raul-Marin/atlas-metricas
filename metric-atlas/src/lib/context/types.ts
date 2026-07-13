import type { MetricScoresMap } from "@/lib/types";

/**
 * Modelo de "Contexto" (dominio) escalable. Design Systems es el primer y único
 * pack (ver `src/contexts/design-systems/`). Un contexto nuevo = solo datos
 * (dimensiones + categorías + métricas + plantillas), sin tipos ni adaptadores.
 *
 * La métrica es genérica: sus atributos de dominio viven en `attributes`
 * (clave = id de dimensión) y su contenido descriptivo en `ficha`. El motor de
 * posicionamiento del 2×2 lee SOLO `attributes` + las dimensiones del contexto,
 * por lo que funciona con cualquier contexto sin tocar código del motor.
 */

/** Tipo de dimensión (eje / categoría). */
export type DimensionKind =
  // valor categórico de la métrica (p.ej. categoría, fuente)
  | "categorical"
  // valor ordinal de la métrica (orden = posición en el eje; p.ej. tipo, madurez)
  | "ordinal"
  // valoración del usuario 0–1 (arranca en el centro, se asigna arrastrando)
  | "judgment";

export interface DimensionValue {
  id: string;
  label: string;
  /** Color para punto de categoría / acento de ficha (hex). */
  color?: string;
}

export interface AxisDimension {
  id: string;
  label: string;
  kind: DimensionKind;
  /** categorical / ordinal: el ORDEN de este array = posición en el eje (0→1). */
  values?: DimensionValue[];
  /** Etiquetas de los extremos del eje en el 2×2 (bajo = 0, alto = 1). */
  endLow?: string;
  endHigh?: string;
}

/** Ficha descriptiva de una métrica (superset de la ficha de Figma). */
export interface MetricFicha {
  description: string;
  whyItMatters?: string;
  howToMeasure?: string[];
  frecuencia?: string;
  esfuerzo?: string;
  confianza?: string;
  /** "Mejor cruzarla con" — otras métricas complementarias. */
  cruzarCon?: string[];
  risksBiases?: string[];
  automationIdeas?: string[];
  /** Audiencia y decisión a nivel de métrica (opcional; la audiencia principal
   *  cuelga de la matriz, no de la métrica). */
  audience?: string[];
  decision?: string;
}

/** Métrica genérica: contrato que consume el motor y la experiencia de matriz. */
export interface MetricDefinition {
  id: string;
  name: string;
  shortName?: string;
  contextId: string;
  /** Valores por dimensión (categorical/ordinal/boolean). Clave = dimension.id. */
  attributes: Record<string, string | boolean>;
  ficha: MetricFicha;
  tags: string[];
  relatedMetricIds: string[];
  /** Nombre de icono lucide (opcional; fallback en getMetricIcon). */
  icon?: string;
  priority?: number;
  archived?: boolean;
}

export interface TemplateQuadrant {
  key: "tl" | "tr" | "bl" | "br";
  title: string;
  meaning: string;
}

/**
 * Plantilla = UNA matriz (un board) pre-montada, con las fichas ya aplicadas.
 * Al crear un board desde plantilla, el canvas se arma con:
 *   { matrixAxes:{axisX,axisY}, metricScores: placedScores,
 *     excludedMetricIds: (todas − includedMetricIds), quadrantColors }
 */
export interface MatrixTemplateDef {
  id: string;
  name: string;
  /** "Para qué sirve". */
  purpose: string;
  axisX: string;
  axisY: string;
  quadrants: TemplateQuadrant[];
  /** Audiencia ideal + decisiones que permite tomar (cuelgan de la matriz). */
  audience?: string[];
  decisions?: string[];
  /** 5-6 métricas destacadas; el resto queda en "ver más". */
  recommendedMetricIds: string[];
  /** Fichas ya aplicadas: posiciones 0–1 por métrica/dimensión. */
  placedScores: MetricScoresMap;
  /** Las que arrancan colocadas en el canvas (el resto → excludedMetricIds). */
  includedMetricIds: string[];
  quadrantColors?: [string, string, string, string];
  accentColor?: string;
}

/**
 * Objetivo ("¿Qué quieres demostrar?"): filtra las fichas usables y (a futuro)
 * propone una matriz. Define el subconjunto de categorías relevantes; opcional-
 * mente una lista explícita de métricas y la plantilla que propone.
 */
export interface Objective {
  id: string;
  label: string;
  description?: string;
  /** Categorías cuyas métricas son usables para este objetivo. */
  categoryIds: string[];
  /** Métricas concretas destacadas (opcional; se muestran primero / se permiten). */
  metricIds?: string[];
  /** Plantilla que propone este objetivo (para el futuro "propone una matriz"). */
  matrixTemplateId?: string;
}

export interface MetricContext {
  id: string;
  name: string;
  dimensions: AxisDimension[];
  /** Atajo a la dimensión "categoria" (agrupa la biblioteca de métricas). */
  categories: DimensionValue[];
  metrics: MetricDefinition[];
  templates: MatrixTemplateDef[];
  /** Objetivos ("¿Qué quieres demostrar?") que filtran las fichas usables. */
  objectives: Objective[];
  /** Audiencias canónicas (lista controlada para el selector de audiencia). */
  audiences: DimensionValue[];
  defaultAxes: { axisX: string; axisY: string };
}
