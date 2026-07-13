import type { MetricDefinition } from "@/lib/context/types";

export const ADOPCION_METRICS: MetricDefinition[] = [
  {
    id: "component-usage",
    name: "Uso de componentes",
    shortName: "Uso comp.",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de pantallas que usan componentes oficiales del sistema frente a elementos sueltos.",
      whyItMatters:
        "Es la señal más directa de que la librería se está adoptando de verdad en producto.",
      howToMeasure: [
        "Instancias de componentes oficiales vs capas totales por pantalla",
        "Auditoría vía Figma API o plugin de analytics",
        "Muestreo manual de flujos clave si no hay automatización",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Alta si está automatizada",
      cruzarCon: [
        "Uso de variables / tokens",
        "Dependencia de librerías locales",
        "Adopción por equipo",
      ],
      risksBiases: [
        "Puede haber mucho uso con overrides que rompen el diseño original",
      ],
      audience: ["DS Team", "Diseño", "Leadership"],
      decision:
        "Saber si la librería está siendo adoptada por producto y dónde reforzar.",
    },
    tags: ["adopcion", "figma-native"],
    relatedMetricIds: ["token-variable-usage", "local-library-dependency"],
    icon: "Component",
    priority: 5,
  },
  {
    id: "figma-component-inserts",
    name: "Inserts de componentes en Figma",
    shortName: "Inserts",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Número de veces que los diseñadores insertan componentes de la librería desde el panel de assets.",
      whyItMatters:
        "Mide la intención de uso real en el momento de diseñar, antes de cualquier detach.",
      howToMeasure: [
        "Datos de inserts del panel de librería de Figma (Enterprise analytics)",
        "Agregado por semana y por componente",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si tienes Figma analytics",
      cruzarCon: [
        "Uso de componentes",
        "Componentes más usados",
        "Evolución mensual de adopción",
      ],
      risksBiases: [
        "Un insert no garantiza que el componente permanezca en el diseño final",
      ],
      audience: ["DS Team", "Diseño"],
      decision:
        "Detectar qué componentes generan demanda real y cuáles nadie inserta.",
    },
    tags: ["adopcion", "figma-native"],
    relatedMetricIds: ["most-used-components", "component-usage"],
    icon: "Blocks",
    priority: 4,
  },
  {
    id: "screens-with-active-libraries",
    name: "Pantallas con librerías activas",
    shortName: "Pantallas activas",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de pantallas o archivos que tienen habilitada y conectada la librería del sistema.",
      whyItMatters:
        "Sin la librería activada, la adopción es imposible; mide la cobertura de base.",
      howToMeasure: [
        "Archivos con la librería publicada como dependencia vs total de archivos activos",
        "Auditoría de bibliotecas enlazadas vía Figma API",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Uso de componentes",
        "Adopción por producto",
        "Dependencia de librerías locales",
      ],
      risksBiases: [
        "Una librería activa no implica que se esté usando de forma efectiva",
      ],
      audience: ["DS Team", "Diseño", "Leadership"],
      decision:
        "Identificar equipos o archivos que aún no han conectado el sistema.",
    },
    tags: ["adopcion", "cobertura"],
    relatedMetricIds: ["adoption-by-product", "local-library-dependency"],
    icon: "PanelsTopLeft",
    priority: 4,
  },
  {
    id: "token-variable-usage",
    name: "Uso de variables / tokens",
    shortName: "Uso tokens",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "advanced",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de propiedades (color, espaciado, tipografía) resueltas con variables/tokens en lugar de valores fijos.",
      whyItMatters:
        "Es la base del theming y la consistencia; sin tokens la escalabilidad se rompe.",
      howToMeasure: [
        "Propiedades enlazadas a variables vs valores hardcodeados por archivo",
        "Auditoría vía Figma Variables API o plugin",
        "Revisión paralela en código de tokens consumidos",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Alta si está automatizada",
      cruzarCon: [
        "Uso de componentes",
        "Bugs UI en QA",
        "Adopción por equipo",
      ],
      risksBiases: [
        "Tokens mal nombrados o duplicados inflan el uso sin mejorar consistencia",
      ],
      audience: ["DS Team", "Diseño", "Engineering"],
      decision:
        "Priorizar la migración a tokens en las áreas con más valores fijos.",
    },
    tags: ["adopcion", "tokens"],
    relatedMetricIds: ["component-usage"],
    icon: "Boxes",
    priority: 5,
  },
  {
    id: "most-used-components",
    name: "Componentes más usados",
    shortName: "Top comp.",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "yes",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Ranking de componentes por número de instancias activas en los productos.",
      whyItMatters:
        "Revela dónde concentrar mantenimiento, documentación y calidad por impacto.",
      howToMeasure: [
        "Conteo de instancias por componente vía Figma API o analytics",
        "Ordenar por volumen y ver cola larga de poco uso",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si tienes Figma analytics",
      cruzarCon: [
        "Inserts de componentes en Figma",
        "Issues abiertos por componente",
        "Componentes sin documentación",
      ],
      risksBiases: [
        "El volumen alto puede ocultar componentes críticos pero poco frecuentes",
      ],
      audience: ["DS Team", "Diseño"],
      decision:
        "Enfocar esfuerzo de calidad en los componentes de mayor impacto.",
    },
    tags: ["adopcion", "figma-native"],
    relatedMetricIds: ["figma-component-inserts", "component-usage"],
    icon: "BarChart3",
    priority: 4,
  },
  {
    id: "adoption-by-team",
    name: "Adopción por equipo",
    shortName: "Por equipo",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Nivel de uso del sistema desglosado por equipo de producto o squad.",
      whyItMatters:
        "Permite localizar campeones y equipos rezagados para actuar con precisión.",
      howToMeasure: [
        "Uso de componentes agregado por proyecto/equipo en Figma",
        "Cruce con estructura organizativa de squads",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Uso de componentes",
        "Adopción por producto",
        "Pantallas con librerías activas",
      ],
      risksBiases: [
        "Equipos pequeños pueden distorsionar porcentajes con pocos archivos",
      ],
      audience: ["DS Team", "Leadership", "Diseño"],
      decision:
        "Decidir dónde invertir onboarding y soporte de adopción.",
    },
    tags: ["adopcion", "segmentacion"],
    relatedMetricIds: ["adoption-by-product", "component-usage"],
    icon: "Users",
    priority: 4,
  },
  {
    id: "adoption-by-product",
    name: "Adopción por producto",
    shortName: "Por producto",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Nivel de uso del sistema desglosado por producto, app o superficie.",
      whyItMatters:
        "Muestra qué productos están alineados con el sistema y cuáles divergen.",
      howToMeasure: [
        "Uso de componentes y tokens agregado por producto",
        "Cruce con inventario de productos de la organización",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Adopción por equipo",
        "Pantallas con librerías activas",
        "Uso de componentes",
      ],
      risksBiases: [
        "Productos legacy con roadmap propio bajan la media sin ser un problema real",
      ],
      audience: ["DS Team", "Leadership", "Producto"],
      decision:
        "Priorizar qué productos migrar al sistema en el roadmap.",
    },
    tags: ["adopcion", "segmentacion"],
    relatedMetricIds: ["adoption-by-team", "screens-with-active-libraries"],
    icon: "PieChart",
    priority: 4,
  },
  {
    id: "monthly-adoption-trend",
    name: "Evolución mensual de adopción",
    shortName: "Tendencia",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Tendencia temporal del uso agregado de componentes y tokens mes a mes.",
      whyItMatters:
        "Convierte una foto puntual en una historia de progreso o estancamiento.",
      howToMeasure: [
        "Serie temporal del porcentaje de uso de componentes por mes",
        "Comparar contra hitos de releases y campañas de adopción",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta si está automatizada",
      cruzarCon: [
        "Uso de componentes",
        "Releases del sistema",
        "Inserts de componentes en Figma",
      ],
      risksBiases: [
        "Estacionalidad de proyectos puede confundirse con cambios de adopción",
      ],
      audience: ["DS Team", "Leadership"],
      decision:
        "Evaluar si las iniciativas de adopción están funcionando.",
    },
    tags: ["adopcion", "tendencia"],
    relatedMetricIds: ["component-usage", "system-releases"],
    icon: "TrendingUp",
    priority: 5,
  },
  {
    id: "pattern-reuse",
    name: "Reutilización de patrones",
    shortName: "Reuso patrones",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "hybrid",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Grado en que patrones compuestos (formularios, cabeceras, cards) se reutilizan en lugar de rehacerse.",
      whyItMatters:
        "La reutilización de patrones ahorra más tiempo que la de componentes atómicos sueltos.",
      howToMeasure: [
        "Uso de componentes de patrón o plantillas vs construcciones ad-hoc",
        "Auditoría cualitativa de flujos repetidos entre productos",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Alto",
      confianza: "Media",
      cruzarCon: [
        "Uso de componentes",
        "Componentes más usados",
        "Reglas de contribución cumplidas",
      ],
      risksBiases: [
        "Difícil de medir de forma automática; depende de criterio del auditor",
      ],
      audience: ["DS Team", "Diseño"],
      decision:
        "Decidir qué patrones vale la pena estandarizar y publicar.",
    },
    tags: ["adopcion", "patrones"],
    relatedMetricIds: ["component-usage", "most-used-components"],
    icon: "Puzzle",
    priority: 3,
  },
  {
    id: "local-library-dependency",
    name: "Dependencia de librerías locales",
    shortName: "Librerías locales",
    contextId: "design-systems",
    attributes: {
      categoria: "adopcion",
      measurementType: "quantitative",
      sourcePrimary: "figma",
      figmaAvailability: "partial",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Cuánto dependen los productos de librerías locales o forks en vez de la librería central.",
      whyItMatters:
        "Las librerías paralelas fragmentan el sistema y multiplican el mantenimiento.",
      howToMeasure: [
        "Componentes provenientes de librerías locales vs la central por archivo",
        "Inventario de bibliotecas enlazadas por equipo",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: [
        "Uso de componentes",
        "Pantallas con librerías activas",
        "Adopción por equipo",
      ],
      risksBiases: [
        "Algunas librerías locales son legítimas (dominio específico) y no un problema",
      ],
      audience: ["DS Team", "Diseño", "Engineering"],
      decision:
        "Detectar fragmentación y decidir qué forks consolidar en el sistema.",
    },
    tags: ["adopcion", "fragmentacion"],
    relatedMetricIds: ["component-usage", "screens-with-active-libraries"],
    icon: "GitBranch",
    priority: 4,
  },
];
