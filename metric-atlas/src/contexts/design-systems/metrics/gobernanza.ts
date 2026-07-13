import type { MetricDefinition } from "@/lib/context/types";

export const GOBERNANZA_METRICS: MetricDefinition[] = [
  {
    id: "deprecated-component-usage",
    name: "Componentes deprecated en uso",
    shortName: "Deprecated en uso",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Número de instancias de componentes marcados como deprecated que siguen vivas en producto.",
      whyItMatters:
        "La deuda de deprecados bloquea limpiezas y perpetúa patrones que ya decidiste retirar.",
      howToMeasure: [
        "Instancias de componentes con flag deprecated vía Figma API",
        "Cruce del listado de deprecados con el conteo de uso real",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si está automatizada",
      cruzarCon: [
        "Uso de componentes",
        "Componentes más usados",
        "Releases del sistema",
      ],
      risksBiases: [
        "Marcar como deprecated sin alternativa clara mantiene el uso alto de forma inevitable",
      ],
      audience: ["DS Team", "Diseño", "Engineering"],
      decision:
        "Planificar migraciones y campañas para retirar componentes obsoletos.",
    },
    tags: ["gobernanza", "deuda-tecnica"],
    relatedMetricIds: ["time-since-last-update", "system-releases"],
    icon: "FileWarning",
    priority: 5,
  },
  {
    id: "components-without-owner",
    name: "Componentes sin owner",
    shortName: "Sin owner",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de componentes sin persona o equipo responsable asignado.",
      whyItMatters:
        "Un componente sin owner no se mantiene, no se revisa y acumula issues sin resolver.",
      howToMeasure: [
        "Componentes sin campo owner en el inventario o CODEOWNERS",
        "Auditoría de metadatos de la librería y del repo",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Bajo",
      confianza: "Alta si el inventario está estructurado",
      cruzarCon: [
        "Issues abiertos por componente",
        "Tiempo desde última actualización",
        "Componentes sin documentación",
      ],
      risksBiases: [
        "Un owner nominal asignado por defecto oculta el problema sin resolverlo",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Reasignar responsables antes de que los componentes queden huérfanos.",
    },
    tags: ["gobernanza", "ownership"],
    relatedMetricIds: ["open-issues-per-component", "time-since-last-update"],
    icon: "UserCheck",
    priority: 4,
  },
  {
    id: "components-without-docs",
    name: "Componentes sin documentación",
    shortName: "Sin docs",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de componentes que no tienen página de documentación de uso publicada.",
      whyItMatters:
        "Sin docs, cada equipo interpreta el componente a su manera y se dispara el mal uso.",
      howToMeasure: [
        "Componentes con página de docs vs total del inventario",
        "Auditoría de Storybook, Zeroheight o wiki del sistema",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Bajo",
      confianza: "Alta si el inventario está estructurado",
      cruzarCon: [
        "Componentes sin ejemplos",
        "Componentes más usados",
        "Issues abiertos por componente",
      ],
      risksBiases: [
        "Docs existentes pero desactualizadas cuentan como cubiertas y engañan",
      ],
      audience: ["DS Team", "Diseño", "Engineering"],
      decision:
        "Priorizar la documentación de los componentes más usados sin cobertura.",
    },
    tags: ["gobernanza", "documentacion"],
    relatedMetricIds: ["components-without-examples", "most-used-components"],
    icon: "BookMarked",
    priority: 4,
  },
  {
    id: "components-without-examples",
    name: "Componentes sin ejemplos",
    shortName: "Sin ejemplos",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de componentes documentados que carecen de ejemplos de uso o casos reales.",
      whyItMatters:
        "Un ejemplo vale más que la descripción: reduce dudas y tickets de soporte.",
      howToMeasure: [
        "Componentes con al menos un ejemplo o story vs total documentado",
        "Auditoría de stories en Storybook o snippets en docs",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Componentes sin documentación",
        "Issues abiertos por componente",
        "Componentes más usados",
      ],
      risksBiases: [
        "Ejemplos triviales cuentan igual que casos completos y sobrestiman la cobertura",
      ],
      audience: ["DS Team", "Engineering"],
      decision:
        "Decidir dónde añadir ejemplos para reducir el mal uso y las dudas.",
    },
    tags: ["gobernanza", "documentacion"],
    relatedMetricIds: ["components-without-docs", "open-issues-per-component"],
    icon: "ListChecks",
    priority: 3,
  },
  {
    id: "time-since-last-update",
    name: "Tiempo desde última actualización",
    shortName: "Última update",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Antigüedad media desde el último cambio de cada componente del sistema.",
      whyItMatters:
        "Componentes que llevan mucho sin tocarse pueden estar obsoletos o abandonados.",
      howToMeasure: [
        "Fecha del último commit o publicación por componente",
        "Distribución de antigüedad y cola de componentes estancados",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Bajo",
      confianza: "Alta si tienes historial de versiones",
      cruzarCon: [
        "Componentes deprecated en uso",
        "Componentes sin owner",
        "Issues abiertos por componente",
      ],
      risksBiases: [
        "Un componente estable y correcto también lleva mucho sin cambios: no siempre es malo",
      ],
      audience: ["DS Team", "Engineering"],
      decision:
        "Revisar componentes estancados para actualizarlos o deprecarlos.",
    },
    tags: ["gobernanza", "mantenimiento"],
    relatedMetricIds: ["deprecated-component-usage", "components-without-owner"],
    icon: "FileClock",
    priority: 3,
  },
  {
    id: "open-issues-per-component",
    name: "Issues abiertos por componente",
    shortName: "Issues/comp.",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "support",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Número de issues o tickets abiertos asociados a cada componente del sistema.",
      whyItMatters:
        "Concentra la señal de dolor: dónde el sistema falla o confunde a quien lo usa.",
      howToMeasure: [
        "Conteo de issues abiertos por etiqueta de componente en el tracker",
        "Normalizar por volumen de uso para comparar de forma justa",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si el tracker está bien etiquetado",
      cruzarCon: [
        "Tiempo medio de resolución",
        "Componentes más usados",
        "Componentes sin documentación",
      ],
      risksBiases: [
        "Pocos issues pueden significar buena calidad o simplemente falta de reporte",
      ],
      audience: ["DS Team", "Engineering"],
      decision:
        "Priorizar qué componentes arreglar o rediseñar por volumen de dolor.",
    },
    tags: ["gobernanza", "calidad"],
    relatedMetricIds: ["mean-resolution-time", "most-used-components"],
    icon: "Bug",
    priority: 4,
  },
  {
    id: "mean-resolution-time",
    name: "Tiempo medio de resolución",
    shortName: "Tiempo resol.",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "support",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Tiempo medio que tarda el equipo en cerrar issues o solicitudes del sistema.",
      whyItMatters:
        "Un sistema que responde rápido genera confianza; uno lento empuja a la gente a hacerse su propia solución.",
      howToMeasure: [
        "Media o mediana de tiempo entre apertura y cierre de issues",
        "Segmentar por tipo (bug, petición, pregunta) y prioridad",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si el tracker registra fechas",
      cruzarCon: [
        "Issues abiertos por componente",
        "Reglas de contribución cumplidas",
        "Releases del sistema",
      ],
      risksBiases: [
        "Cerrar issues rápido sin resolverlos de verdad mejora la métrica falsamente",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Ajustar capacidad y SLAs de soporte del sistema.",
    },
    tags: ["gobernanza", "soporte"],
    relatedMetricIds: ["open-issues-per-component", "contribution-rules-met"],
    icon: "Timer",
    priority: 4,
  },
  {
    id: "system-releases",
    name: "Releases del sistema",
    shortName: "Releases",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Frecuencia y volumen de versiones publicadas de la librería y los tokens.",
      whyItMatters:
        "Un ritmo sano de releases indica un sistema vivo y mantenido, no congelado.",
      howToMeasure: [
        "Número de versiones publicadas por trimestre en npm o el repo",
        "Cruce con changelog y tamaño de cada release",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Bajo",
      confianza: "Alta con versionado semántico",
      cruzarCon: [
        "Evolución mensual de adopción",
        "Tiempo medio de resolución",
        "Componentes deprecated en uso",
      ],
      risksBiases: [
        "Muchos releases pequeños pueden reflejar inestabilidad más que salud",
      ],
      audience: ["DS Team", "Engineering", "Leadership"],
      decision:
        "Evaluar el ritmo de entrega y la cadencia de versionado del sistema.",
    },
    tags: ["gobernanza", "releases"],
    relatedMetricIds: ["monthly-adoption-trend", "deprecated-component-usage"],
    icon: "Milestone",
    priority: 3,
  },
  {
    id: "orphan-variants",
    name: "Variants huérfanas",
    shortName: "Variants huérfanas",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Número de variantes de componentes que existen en la librería pero no se usan en ningún producto.",
      whyItMatters:
        "Las variantes muertas inflan la complejidad del set y confunden a la hora de elegir.",
      howToMeasure: [
        "Variantes con cero instancias en productos vía Figma API",
        "Cruce del set de variantes definido con el uso real",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Componentes más usados",
        "Tiempo desde última actualización",
        "Uso de componentes",
      ],
      risksBiases: [
        "Variantes nuevas aún sin adopción parecen huérfanas sin serlo",
      ],
      audience: ["DS Team", "Diseño"],
      decision:
        "Decidir qué variantes podar para simplificar la librería.",
    },
    tags: ["gobernanza", "simplificacion"],
    relatedMetricIds: ["time-since-last-update", "most-used-components"],
    icon: "Trash2",
    priority: 3,
  },
  {
    id: "contribution-rules-met",
    name: "Reglas de contribución cumplidas",
    shortName: "Reglas cumplidas",
    contextId: "design-systems",
    attributes: {
      categoria: "gobernanza",
      measurementType: "hybrid",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de contribuciones al sistema que cumplen el checklist de aportación (tests, docs, revisión, tokens).",
      whyItMatters:
        "Garantiza que lo que entra al sistema mantiene el listón de calidad y no genera deuda.",
      howToMeasure: [
        "PRs que pasan el checklist de contribución vs total de PRs al sistema",
        "Revisión de plantillas de PR y gates de CI cumplidos",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Tiempo medio de resolución",
        "Componentes sin documentación",
        "Reutilización de patrones",
      ],
      risksBiases: [
        "Un checklist marcado no garantiza calidad real de la contribución",
      ],
      audience: ["DS Team", "Engineering", "Leadership"],
      decision:
        "Reforzar o ajustar el proceso de contribución donde se incumple.",
    },
    tags: ["gobernanza", "contribucion"],
    relatedMetricIds: ["mean-resolution-time", "components-without-docs"],
    icon: "ClipboardCheck",
    priority: 3,
  },
];
