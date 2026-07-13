import type { MetricDefinition } from "@/lib/context/types";

export const DOCUMENTACION_METRICS: MetricDefinition[] = [
  {
    id: "documentation-visits",
    name: "Visitas a documentación",
    shortName: "Visitas a docs",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "product-analytics",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Volumen de visitas y usuarios únicos que consulta el sitio de documentación del sistema.",
      whyItMatters:
        "Es la señal más directa de que los equipos usan la documentación para trabajar con el sistema.",
      howToMeasure: [
        "Visitas y usuarios únicos del sitio de docs por periodo",
        "Segmentación por equipo o rol cuando exista analítica",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Páginas más visitadas", "Tickets de soporte"],
      risksBiases: [
        "El tráfico total no distingue consultas útiles de rebotes rápidos",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Justificar la inversión en documentación y detectar caídas de uso.",
    },
    tags: ["docs", "analytics", "adoption"],
    relatedMetricIds: ["most-visited-pages", "support-tickets"],
    icon: "BookOpen",
    priority: 4,
  },
  {
    id: "most-visited-pages",
    name: "Páginas más visitadas",
    shortName: "Páginas top",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "product-analytics",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Ranking de páginas de documentación por tráfico y tiempo de permanencia.",
      whyItMatters:
        "Revela qué temas y componentes concentran el interés y dónde conviene invertir en calidad.",
      howToMeasure: [
        "Visitas y tiempo en página por URL de docs",
        "Ranking de páginas por tráfico y por permanencia",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Visitas a documentación", "Feedback en documentación"],
      risksBiases: [
        "Mucho tráfico puede indicar interés o una página confusa que hay que releer",
      ],
      audience: ["DS Team", "Design", "Engineering"],
      decision:
        "Priorizar mejoras y ejemplos en las páginas de mayor impacto.",
    },
    tags: ["docs", "analytics", "content"],
    relatedMetricIds: ["documentation-visits", "docs-feedback"],
    icon: "TrendingUp",
    priority: 3,
  },
  {
    id: "searches-without-results",
    name: "Búsquedas sin resultado",
    shortName: "Búsquedas sin match",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "product-analytics",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Búsquedas dentro de la documentación que no devuelven resultados o no llevan a ningún clic.",
      whyItMatters:
        "Cada búsqueda vacía es una necesidad explícita que la documentación no está cubriendo.",
      howToMeasure: [
        "Términos de búsqueda con cero resultados",
        "Búsquedas sin clic posterior (abandono)",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Cobertura de documentación", "Solicitudes repetidas"],
      risksBiases: [
        "Errores de tipeo y sinónimos inflan las búsquedas fallidas sin ser huecos reales",
      ],
      audience: ["DS Team", "Design"],
      decision:
        "Crear o renombrar contenido para los términos que más se buscan sin éxito.",
    },
    tags: ["docs", "search", "content-gaps"],
    relatedMetricIds: ["docs-coverage", "repeated-requests"],
    icon: "SearchX",
    priority: 4,
  },
  {
    id: "docs-feedback",
    name: "Feedback en documentación",
    shortName: "Feedback en docs",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "hybrid",
      sourcePrimary: "product-analytics",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Valoraciones y comentarios que dejan los usuarios en cada página de documentación.",
      whyItMatters:
        "Combina señal cuantitativa (útil/no útil) con contexto cualitativo página a página.",
      howToMeasure: [
        "Ratio útil/no útil por página",
        "Análisis temático de los comentarios abiertos",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Páginas más visitadas", "Satisfacción con documentación"],
      risksBiases: [
        "Solo responde una minoría, normalmente la más insatisfecha",
      ],
      audience: ["DS Team", "Design", "Engineering"],
      decision:
        "Reescribir las páginas con peor valoración y comentarios recurrentes.",
    },
    tags: ["docs", "feedback", "qualitative"],
    relatedMetricIds: ["most-visited-pages", "docs-satisfaction"],
    icon: "MessageSquare",
    priority: 3,
  },
  {
    id: "docs-coverage",
    name: "Cobertura de documentación",
    shortName: "Cobertura de docs",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "research",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de componentes y guidelines del sistema que tienen documentación completa.",
      whyItMatters:
        "Un componente sin documentar es difícil de adoptar bien y genera preguntas y usos incorrectos.",
      howToMeasure: [
        "Componentes con página de docs completa / total de componentes",
        "Cobertura de secciones clave (uso, anatomía, do/don't, accesibilidad)",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Búsquedas sin resultado", "Documentación desactualizada"],
      risksBiases: [
        "Tener página no equivale a que la documentación sea clara o correcta",
      ],
      audience: ["DS Team", "Design", "Engineering"],
      decision:
        "Cerrar los huecos de documentación de los componentes más usados.",
    },
    tags: ["docs", "coverage", "quality"],
    relatedMetricIds: ["searches-without-results", "outdated-documentation"],
    icon: "BookMarked",
    priority: 4,
  },
  {
    id: "outdated-documentation",
    name: "Documentación desactualizada",
    shortName: "Docs desactualizadas",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "research",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Volumen de páginas de documentación que llevan tiempo sin revisar o no reflejan la versión actual del componente.",
      whyItMatters:
        "La documentación obsoleta erosiona la confianza en el sistema y provoca implementaciones erróneas.",
      howToMeasure: [
        "Páginas sin actualizar desde hace más de N meses",
        "Páginas cuya versión referenciada no coincide con la última publicada",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Cobertura de documentación", "Feedback en documentación"],
      risksBiases: [
        "Contenido estable y correcto puede parecer viejo solo por su fecha",
      ],
      audience: ["DS Team", "Design"],
      decision:
        "Programar la revisión de las páginas más obsoletas y más visitadas.",
    },
    tags: ["docs", "maintenance", "quality"],
    relatedMetricIds: ["docs-coverage", "docs-feedback"],
    icon: "FileClock",
    priority: 3,
  },
  {
    id: "support-tickets",
    name: "Tickets de soporte",
    shortName: "Tickets",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "support",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Volumen y tipología de consultas y bugs que llegan al canal de soporte del sistema.",
      whyItMatters:
        "Mide la carga de soporte y señala dónde falla la documentación o los propios componentes.",
      howToMeasure: [
        "Nº de tickets por periodo y por categoría",
        "Distribución entre dudas de uso, bugs y peticiones",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Solicitudes repetidas", "Tiempo de primera respuesta"],
      risksBiases: [
        "Muchas dudas se resuelven fuera del canal oficial y no dejan ticket",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Documentar o corregir las causas de los tickets más frecuentes.",
    },
    tags: ["docs", "support", "operations"],
    relatedMetricIds: ["repeated-requests", "first-response-time"],
    icon: "LifeBuoy",
    priority: 4,
  },
  {
    id: "first-response-time",
    name: "Tiempo de primera respuesta",
    shortName: "Primera respuesta",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "quantitative",
      sourcePrimary: "support",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Tiempo que tarda el equipo del sistema en dar la primera respuesta a una consulta de soporte.",
      whyItMatters:
        "Una respuesta lenta empuja a los equipos a resolver por su cuenta y a desviarse del sistema.",
      howToMeasure: [
        "Mediana y p90 del tiempo hasta la primera respuesta",
        "Segmentación por canal y por prioridad del ticket",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Tickets de soporte", "Satisfacción con documentación"],
      risksBiases: [
        "Una respuesta automática rápida no equivale a resolución real",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Ajustar la capacidad de soporte o el triaje si los tiempos se disparan.",
    },
    tags: ["docs", "support", "operations"],
    relatedMetricIds: ["support-tickets", "docs-satisfaction"],
    icon: "Timer",
    priority: 3,
  },
  {
    id: "repeated-requests",
    name: "Solicitudes repetidas",
    shortName: "Solicitudes repetidas",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "hybrid",
      sourcePrimary: "support",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Preguntas y peticiones que se repiten una y otra vez en los canales de soporte del sistema.",
      whyItMatters:
        "Lo que se pregunta repetidamente señala un hueco de documentación o una funcionalidad que falta.",
      howToMeasure: [
        "Agrupación temática de tickets y mensajes recurrentes",
        "Frecuencia de cada tema repetido por periodo",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Tickets de soporte", "Búsquedas sin resultado"],
      risksBiases: [
        "Agrupar temas es subjetivo y depende de cómo se etiqueten los tickets",
      ],
      audience: ["DS Team", "Design", "Engineering"],
      decision:
        "Convertir las preguntas repetidas en documentación o mejoras del producto.",
    },
    tags: ["docs", "support", "content-gaps"],
    relatedMetricIds: ["support-tickets", "searches-without-results"],
    icon: "Repeat",
    priority: 3,
  },
  {
    id: "docs-satisfaction",
    name: "Satisfacción con documentación",
    shortName: "Satisfacción docs",
    contextId: "design-systems",
    attributes: {
      categoria: "documentacion",
      measurementType: "qualitative",
      sourcePrimary: "research",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Percepción de los equipos sobre la utilidad, claridad y completitud de la documentación del sistema.",
      whyItMatters:
        "Sintetiza en una señal la experiencia de quienes dependen de la documentación para trabajar.",
      howToMeasure: [
        "Encuesta periódica de satisfacción (CSAT) sobre la documentación",
        "Preguntas abiertas sobre qué falta o confunde",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Feedback en documentación", "Tiempo de primera respuesta"],
      risksBiases: [
        "Baja participación y sesgo de recencia hacia la última mala experiencia",
      ],
      audience: ["DS Team", "Leadership", "Design"],
      decision:
        "Orientar el roadmap de documentación según los puntos de mayor insatisfacción.",
    },
    tags: ["docs", "satisfaction", "qualitative"],
    relatedMetricIds: ["docs-feedback", "first-response-time"],
    icon: "ThumbsUp",
    priority: 3,
  },
];
