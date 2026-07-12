import type { MatrixTemplateDef, TemplateQuadrant } from "@/lib/context/types";
import type { MetricScoresMap } from "@/lib/types";

/**
 * Las 8 matrices-plantilla del contexto Design Systems (Figma node 4:920).
 * Cada plantilla = UNA matriz pre-montada: ejes + significado por cuadrante +
 * audiencia + decisiones + fichas ya aplicadas (placedScores).
 */

interface TemplateSpec {
  id: string;
  name: string;
  purpose: string;
  axisX: string;
  axisY: string;
  quadrants: TemplateQuadrant[];
  audience: string[];
  decisions: string[];
  accentColor?: string;
  /** [metricId, x, y] en 0–1 sobre (axisX, axisY). */
  placements: [string, number, number][];
}

function build(spec: TemplateSpec): MatrixTemplateDef {
  const placedScores: MetricScoresMap = {};
  const includedMetricIds: string[] = [];
  for (const [id, x, y] of spec.placements) {
    placedScores[id] = { [spec.axisX]: x, [spec.axisY]: y };
    includedMetricIds.push(id);
  }
  return {
    id: spec.id,
    name: spec.name,
    purpose: spec.purpose,
    axisX: spec.axisX,
    axisY: spec.axisY,
    quadrants: spec.quadrants,
    audience: spec.audience,
    decisions: spec.decisions,
    recommendedMetricIds: includedMetricIds,
    placedScores,
    includedMetricIds,
    accentColor: spec.accentColor,
  };
}

const SPECS: TemplateSpec[] = [
  {
    id: "adopcion-gobernanza",
    name: "Adopción y gobernanza",
    purpose:
      "Explicar si el Design System se está usando de verdad y si ese crecimiento es sano.",
    axisX: "measurementType",
    axisY: "foco",
    quadrants: [
      { key: "tl", title: "Adopción + cualitativo", meaning: "El sistema se percibe útil o problemático." },
      { key: "tr", title: "Adopción + cuantitativo", meaning: "El sistema se usa y podemos demostrarlo con datos." },
      { key: "bl", title: "Gobernanza + cualitativo", meaning: "Hay deuda o fragilidad que aún no aparece en datos." },
      { key: "br", title: "Gobernanza + cuantitativo", meaning: "El sistema está sano o se degrada de forma medible." },
    ],
    audience: ["DS Team", "Diseño", "Engineering", "Leadership"],
    decisions: [
      "Priorizar refactor frente a nuevos componentes",
      "Detectar adopción falsa: mucho uso pero mal uso",
      "Separar “uso del sistema” de “salud del sistema”",
    ],
    accentColor: "#4f46e5",
    placements: [
      ["component-usage", 0.8, 0.2],
      ["adoption-rate", 0.7, 0.28],
      ["user-perceived-consistency", 0.25, 0.3],
      ["component-health", 0.75, 0.75],
      ["deprecated-component-usage", 0.7, 0.8],
      ["design-code-parity", 0.3, 0.72],
    ],
  },
  {
    id: "salud-sistema",
    name: "Salud del sistema",
    purpose: "Decidir qué deuda del sistema merece atención primero.",
    axisX: "urgencia",
    axisY: "impacto",
    quadrants: [
      { key: "tl", title: "Alto impacto + baja urgencia", meaning: "Importante, pero no necesariamente inmediato." },
      { key: "tr", title: "Alto impacto + alta urgencia", meaning: "Prioridad máxima." },
      { key: "bl", title: "Bajo impacto + baja urgencia", meaning: "Candidatos a archivar o limpiar cuando haya tiempo." },
      { key: "br", title: "Bajo impacto + alta urgencia", meaning: "Ruido operativo que molesta pero no cambia la estrategia." },
    ],
    audience: ["DS Team", "Engineering", "Diseño"],
    decisions: [
      "Crear un backlog de mantenimiento",
      "Priorizar componentes críticos",
      "Decidir qué archivar",
      "Separar deuda real de ruido",
    ],
    accentColor: "#0891b2",
    placements: [
      ["component-health", 0.75, 0.2],
      ["accessibility-score", 0.3, 0.25],
      ["design-code-parity", 0.35, 0.3],
      ["deprecated-component-usage", 0.75, 0.75],
      ["documentation-coverage", 0.7, 0.8],
      ["api-stability-index", 0.3, 0.8],
    ],
  },
  {
    id: "impacto-delivery",
    name: "Impacto en delivery",
    purpose:
      "Demostrar que el DS no es solo consistencia visual, sino velocidad, eficiencia y menos retrabajo.",
    axisX: "evidenciaNivel",
    axisY: "impacto",
    quadrants: [
      { key: "tl", title: "Alto impacto + evidencia débil", meaning: "Señales interesantes, pero necesitan validarse." },
      { key: "tr", title: "Alto impacto + evidencia fuerte", meaning: "Métricas perfectas para leadership." },
      { key: "bl", title: "Bajo impacto + evidencia débil", meaning: "Métricas de actividad o vanity metrics." },
      { key: "br", title: "Bajo impacto + evidencia fuerte", meaning: "Datos medibles pero quizá poco estratégicos." },
    ],
    audience: ["Leadership", "Producto", "Engineering"],
    decisions: [
      "Justificar el DS como acelerador de producto",
      "Elegir qué patrones codificar primero",
      "Medir reducción de QA visual",
      "Evitar métricas vanity como “número de componentes creados”",
    ],
    accentColor: "#16a34a",
    placements: [
      ["time-to-market", 0.8, 0.2],
      ["developer-productivity", 0.75, 0.28],
      ["business-outcome-proxy", 0.3, 0.25],
      ["experiment-win-rate", 0.32, 0.35],
      ["design-productivity", 0.75, 0.75],
    ],
  },
  {
    id: "figma-codigo",
    name: "Figma vs código",
    purpose:
      "Detectar si el Design System vive solo en Figma o si realmente llega a producción.",
    axisX: "entorno",
    axisY: "ambitoSistema",
    quadrants: [
      { key: "tl", title: "Figma + adopción", meaning: "El sistema se usa en diseño." },
      { key: "tr", title: "Código + adopción", meaning: "El sistema llega a producto." },
      { key: "bl", title: "Figma + sistema", meaning: "Riesgo de deuda dentro del diseño." },
      { key: "br", title: "Código + sistema", meaning: "Salud técnica del sistema." },
    ],
    audience: ["Leadership", "Producto", "Engineering"],
    decisions: [
      "Elegir qué patrones codificar primero",
      "Conectar sistema de diseño con delivery",
      "Detectar dónde se rompe la paridad diseño-código",
    ],
    accentColor: "#ea580c",
    placements: [
      ["component-usage", 0.2, 0.25],
      ["adoption-rate", 0.75, 0.25],
      ["design-token-usage", 0.3, 0.75],
      ["design-code-parity", 0.75, 0.72],
      ["component-health", 0.72, 0.8],
    ],
  },
  {
    id: "ia-anti-slop",
    name: "IA y anti-slop",
    purpose:
      "Entender si la IA está ayudando al sistema o generando más deuda, retrabajo y ruido.",
    axisX: "focoIA",
    axisY: "modoIA",
    quadrants: [
      { key: "tl", title: "Generación + adopción", meaning: "La IA se usa para producir más opciones." },
      { key: "tr", title: "Generación + control", meaning: "La IA produce con calidad y reglas." },
      { key: "bl", title: "Corrección + adopción", meaning: "La IA se usa, pero genera retrabajo." },
      { key: "br", title: "Corrección + control", meaning: "Se corrige y mejora el sistema de generación." },
    ],
    audience: ["Leadership", "Diseño", "Ops", "DS Team"],
    decisions: [
      "Decidir dónde usar IA en el sistema",
      "Medir si la IA reduce o aumenta retrabajo",
      "Crear guardrails y versionar prompts",
      "Pasar de “generar mucho” a “generar consistente”",
    ],
    accentColor: "#0d99ff",
    placements: [
      ["ai-assisted-reuse-rate", 0.25, 0.2],
      ["generative-consistency", 0.75, 0.25],
      ["automation-success-rate", 0.78, 0.3],
      ["visual-slop-ratio", 0.25, 0.75],
      ["generative-drift", 0.3, 0.72],
      ["post-ai-correction-ratio", 0.75, 0.78],
    ],
  },
  {
    id: "valor-facilidad",
    name: "Valor vs facilidad de medición",
    purpose: "Decidir qué métricas merece la pena medir primero.",
    axisX: "facilidad",
    axisY: "valor",
    quadrants: [
      { key: "tl", title: "Alto valor + difícil de medir", meaning: "Necesita narrativa o investigación." },
      { key: "tr", title: "Alto valor + fácil de medir", meaning: "Empezar aquí." },
      { key: "bl", title: "Bajo valor + difícil de medir", meaning: "No merece la pena ahora." },
      { key: "br", title: "Bajo valor + fácil de medir", meaning: "Riesgo de vanity metric." },
    ],
    audience: ["DS Team", "Leadership"],
    decisions: [
      "Elegir el primer set de métricas",
      "Evitar dashboards imposibles de mantener",
      "Diferenciar métricas accionables de vanity metrics",
      "Priorizar instrumentación",
    ],
    accentColor: "#ca8a04",
    placements: [
      ["component-usage", 0.8, 0.2],
      ["deprecated-component-usage", 0.75, 0.26],
      ["time-to-market", 0.72, 0.32],
      ["user-perceived-consistency", 0.25, 0.25],
      ["accessibility-score", 0.3, 0.32],
      ["documentation-coverage", 0.8, 0.75],
    ],
  },
  {
    id: "por-audiencia",
    name: "Por audiencia",
    purpose: "Adaptar la misma información según quién la va a recibir.",
    axisX: "alcance",
    axisY: "ambito",
    quadrants: [
      { key: "tl", title: "Operativo + externo", meaning: "Para squads de diseño y desarrollo." },
      { key: "tr", title: "Estratégico + externo", meaning: "Para leadership y negocio." },
      { key: "bl", title: "Operativo + interno", meaning: "Para gestión diaria del equipo DS." },
      { key: "br", title: "Estratégico + interno", meaning: "Para roadmap del DS." },
    ],
    audience: ["Todas"],
    decisions: [
      "Preparar reportes por stakeholder",
      "Evitar enseñar métricas internas a audiencias equivocadas",
      "Traducir el trabajo del DS a lenguaje de negocio",
      "Crear vistas personalizadas por rol",
    ],
    accentColor: "#7c3aed",
    placements: [
      ["business-outcome-proxy", 0.8, 0.2],
      ["time-to-market", 0.75, 0.28],
      ["component-usage", 0.25, 0.25],
      ["documentation-coverage", 0.3, 0.3],
      ["api-stability-index", 0.75, 0.78],
      ["designops-ticket-load", 0.25, 0.8],
    ],
  },
  {
    id: "madurez-sistema",
    name: "Madurez del sistema",
    purpose: "Explicar en qué fase está el Design System y qué debería venir después.",
    axisX: "adopcionNivel",
    axisY: "madurezNivel",
    quadrants: [
      { key: "tl", title: "Alta madurez + baja adopción", meaning: "Buen sistema, mala distribución." },
      { key: "tr", title: "Alta madurez + alta adopción", meaning: "Sistema consolidado." },
      { key: "bl", title: "Baja madurez + baja adopción", meaning: "Fase inicial o sistema irrelevante." },
      { key: "br", title: "Baja madurez + alta adopción", meaning: "Riesgo de caos." },
    ],
    audience: ["Leadership", "DS Team", "Diseño"],
    decisions: [
      "Saber si toca construir, escalar o mantener",
      "Justificar enablement",
      "Decidir si el problema es producto, adopción o gobernanza",
      "Planificar la siguiente etapa del sistema",
    ],
    accentColor: "#db2777",
    placements: [
      ["component-usage", 0.8, 0.2],
      ["adoption-rate", 0.75, 0.28],
      ["design-token-usage", 0.25, 0.25],
      ["documentation-coverage", 0.3, 0.32],
      ["deprecated-component-usage", 0.75, 0.75],
      ["prompt-debt", 0.25, 0.8],
    ],
  },
];

export const DS_TEMPLATES: MatrixTemplateDef[] = SPECS.map(build);
