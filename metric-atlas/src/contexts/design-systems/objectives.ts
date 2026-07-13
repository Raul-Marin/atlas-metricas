import type { Objective } from "@/lib/context/types";

/**
 * Los objetivos "¿Qué quieres demostrar?" del contexto Design Systems
 * (Figma usage flow, node 5:214). Cada objetivo propone una matriz y acota las
 * categorías de métricas usables.
 */
export const OBJECTIVES: Objective[] = [
  {
    id: "adopcion-sistema",
    label: "Adopción del sistema",
    description: "Demostrar que el Design System se usa de verdad.",
    categoryIds: ["adopcion", "gobernanza", "documentacion"],
    matrixTemplateId: "adopcion-gobernanza",
  },
  {
    id: "salud-deuda",
    label: "Salud y deuda",
    description: "Mostrar el estado y la deuda del sistema.",
    categoryIds: ["gobernanza", "calidad", "codigo"],
    matrixTemplateId: "salud-sistema",
  },
  {
    id: "impacto-delivery",
    label: "Impacto en delivery",
    description: "Conectar el DS con velocidad y eficiencia de producto.",
    categoryIds: ["delivery", "calidad"],
    matrixTemplateId: "impacto-delivery",
  },
  {
    id: "brecha-figma-codigo",
    label: "Brecha Figma / código",
    description: "Ver si el sistema vive solo en Figma o llega a producción.",
    categoryIds: ["codigo", "calidad", "adopcion"],
    matrixTemplateId: "figma-codigo",
  },
  {
    id: "impacto-ia",
    label: "Impacto de IA",
    description: "Entender si la IA ayuda o genera deuda.",
    categoryIds: ["ia"],
    matrixTemplateId: "ia-anti-slop",
  },
  {
    id: "roi-inversion",
    label: "ROI o inversión",
    description: "Justificar la inversión en el sistema.",
    categoryIds: ["delivery", "satisfaccion", "adopcion"],
    matrixTemplateId: "valor-facilidad",
  },
  {
    id: "comunicar-leadership",
    label: "Comunicación a leadership",
    description: "Adaptar las métricas a la audiencia adecuada.",
    categoryIds: ["adopcion", "delivery", "satisfaccion", "gobernanza"],
    matrixTemplateId: "por-audiencia",
  },
  {
    id: "priorizacion-roadmap",
    label: "Priorización de roadmap",
    description: "Decidir qué construir, escalar o mantener.",
    categoryIds: ["gobernanza", "calidad", "adopcion", "delivery"],
    matrixTemplateId: "madurez-sistema",
  },
];
