import type { MetricDefinition } from "@/lib/context/types";

export const CODIGO_METRICS: MetricDefinition[] = [
  {
    id: "npm-package-usage",
    name: "NPM package usage",
    shortName: "NPM usage",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Cuánto se instala y usa el paquete del sistema en los repos de producto.",
      whyItMatters:
        "Demuestra que el sistema llega a código real, no solo a Figma.",
      howToMeasure: [
        "Descargas/instalaciones del paquete",
        "Imports del paquete por repositorio",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Uso de componentes codificados", "Versiones del paquete en uso"],
      risksBiases: ["Instalado no siempre significa usado en pantallas reales"],
      audience: ["Engineering", "DS Team", "Leadership"],
      decision: "Confirmar la adopción del sistema en producción.",
    },
    tags: ["code", "adoption"],
    relatedMetricIds: ["package-versions-in-use", "coded-component-usage"],
    icon: "Package",
    priority: 5,
  },
  {
    id: "package-versions-in-use",
    name: "Versiones del paquete en uso",
    shortName: "Versiones en uso",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Qué versiones del paquete tienen instaladas los repos de producto y cuánto se alejan de la última.",
      whyItMatters:
        "La fragmentación de versiones bloquea mejoras, fixes y tokens nuevos que no llegan a todos.",
      howToMeasure: [
        "Versión declarada en package.json por repo",
        "Distancia (major/minor) respecto a la última publicada",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["NPM package usage", "Deprecated package usage"],
      risksBiases: [
        "Un repo puede fijar versión por una razón válida, no por abandono",
      ],
      audience: ["Engineering", "DS Team"],
      decision: "Priorizar campañas de actualización en los repos más rezagados.",
    },
    tags: ["code", "versioning", "maintenance"],
    relatedMetricIds: ["npm-package-usage", "deprecated-package-usage"],
    icon: "GitBranch",
    priority: 4,
  },
  {
    id: "coded-component-usage",
    name: "Uso de componentes codificados",
    shortName: "Uso en código",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Cuántas veces se usa cada componente del sistema en el código de producto y en cuántos repos.",
      whyItMatters:
        "Distingue componentes vivos de los que nadie usa y revela dónde falta cobertura.",
      howToMeasure: [
        "Conteo de imports/usos por componente vía análisis estático",
        "Nº de repos distintos que consumen cada componente",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Alta",
      cruzarCon: ["NPM package usage", "Cobertura de Storybook"],
      risksBiases: [
        "Un import no garantiza render; componentes muy genéricos inflan el conteo",
      ],
      audience: ["Engineering", "DS Team", "Design"],
      decision:
        "Decidir qué componentes potenciar, documentar mejor o deprecar por desuso.",
    },
    tags: ["code", "adoption", "components"],
    relatedMetricIds: ["npm-package-usage", "storybook-coverage"],
    icon: "Boxes",
    priority: 5,
  },
  {
    id: "tokens-in-code",
    name: "Tokens en código",
    shortName: "Tokens en código",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Proporción de valores de diseño que usan design tokens frente a valores hardcodeados en el código.",
      whyItMatters:
        "Los tokens hacen consistente y themeable el producto; los valores sueltos rompen la coherencia visual.",
      howToMeasure: [
        "Ratio de referencias a tokens vs. literales (colores, espaciados, tipografía)",
        "Nº de valores hardcodeados detectados por lint de tokens",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Media",
      cruzarCon: ["Uso de componentes codificados", "Linter warnings"],
      risksBiases: [
        "Difícil detectar tokens usados vía capas de abstracción o CSS-in-JS dinámico",
      ],
      audience: ["Engineering", "DS Team", "Design"],
      decision:
        "Priorizar la tokenización de las áreas con más valores hardcodeados.",
    },
    tags: ["code", "tokens", "consistency"],
    relatedMetricIds: ["coded-component-usage", "linter-warnings"],
    icon: "Binary",
    priority: 4,
  },
  {
    id: "storybook-coverage",
    name: "Cobertura de Storybook",
    shortName: "Cobertura Storybook",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Porcentaje de componentes del sistema que tienen historias en Storybook y con qué variantes.",
      whyItMatters:
        "Sin historias, un componente no se puede probar, documentar ni descubrir con facilidad.",
      howToMeasure: [
        "Componentes con al menos una story / total de componentes",
        "Cobertura de variantes y estados por componente",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Bajo",
      confianza: "Alta",
      cruzarCon: ["Uso de componentes codificados", "Paridad Storybook-Figma"],
      risksBiases: [
        "Tener story no implica que esté actualizada o cubra casos reales",
      ],
      audience: ["Engineering", "DS Team"],
      decision:
        "Cerrar huecos de historias en los componentes más usados y sin cobertura.",
    },
    tags: ["code", "storybook", "documentation"],
    relatedMetricIds: ["coded-component-usage", "storybook-figma-parity"],
    icon: "TestTube2",
    priority: 4,
  },
  {
    id: "storybook-figma-parity",
    name: "Paridad Storybook-Figma",
    shortName: "Paridad SB-Figma",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "hybrid",
      sourcePrimary: "code",
      figmaAvailability: "partial",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Grado en que las variantes y props de un componente en código coinciden con las de su componente en Figma.",
      whyItMatters:
        "El desalineamiento diseño-código genera reelaboración y componentes que no se corresponden entre equipos.",
      howToMeasure: [
        "Comparar variantes/props del componente vs. propiedades del componente en Figma",
        "Nº de variantes presentes solo en uno de los dos lados",
      ],
      frecuencia: "Trimestral",
      esfuerzo: "Alto",
      confianza: "Media",
      cruzarCon: ["Cobertura de Storybook", "Visual regression issues"],
      risksBiases: [
        "Mapear nombres entre Figma y código es ambiguo y propenso a falsos desajustes",
      ],
      audience: ["Design", "Engineering", "DS Team"],
      decision:
        "Alinear las variantes divergentes entre el componente de Figma y el de código.",
    },
    tags: ["code", "figma", "parity"],
    relatedMetricIds: ["storybook-coverage", "visual-regression-issues"],
    icon: "GitCompare",
    priority: 3,
  },
  {
    id: "deprecated-package-usage",
    name: "Deprecated package usage",
    shortName: "Uso de deprecados",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Cuánto se siguen usando componentes, props o APIs marcados como deprecados en el código de producto.",
      whyItMatters:
        "El uso residual de deprecados bloquea la retirada de código y multiplica el coste de mantenimiento.",
      howToMeasure: [
        "Usos de símbolos marcados @deprecated por repo",
        "Tendencia de uso tras anunciar la deprecación",
      ],
      frecuencia: "Mensual",
      esfuerzo: "Medio",
      confianza: "Alta",
      cruzarCon: ["Versiones del paquete en uso", "Uso de componentes codificados"],
      risksBiases: [
        "Depende de que las deprecaciones estén bien anotadas en el código",
      ],
      audience: ["Engineering", "DS Team"],
      decision:
        "Planificar la migración de los equipos que aún dependen de APIs deprecadas.",
    },
    tags: ["code", "deprecation", "maintenance"],
    relatedMetricIds: ["package-versions-in-use", "coded-component-usage"],
    icon: "PackageX",
    priority: 4,
  },
  {
    id: "linter-warnings",
    name: "Linter warnings",
    shortName: "Warnings de lint",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "classical",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Número de avisos que emiten las reglas de lint del sistema (uso indebido, valores fuera de tokens, patrones prohibidos).",
      whyItMatters:
        "Convierte las buenas prácticas del sistema en señales accionables directamente en el flujo de desarrollo.",
      howToMeasure: [
        "Warnings por regla de lint del sistema y por repo",
        "Tendencia de warnings tras publicar nuevas reglas",
      ],
      frecuencia: "Semanal",
      esfuerzo: "Bajo",
      confianza: "Media",
      cruzarCon: ["Tokens en código", "Deprecated package usage"],
      risksBiases: [
        "Muchos equipos silencian reglas; el conteo depende de la adopción del linter",
      ],
      audience: ["Engineering", "DS Team"],
      decision:
        "Endurecer o comunicar las reglas con más incumplimientos recurrentes.",
    },
    tags: ["code", "linting", "quality"],
    relatedMetricIds: ["tokens-in-code", "deprecated-package-usage"],
    icon: "AlertTriangle",
    priority: 3,
  },
  {
    id: "visual-regression-issues",
    name: "Visual regression issues",
    shortName: "Regresiones visuales",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "advanced",
      signalQuality: "strong",
      aiRelated: false,
    },
    ficha: {
      description:
        "Cambios visuales inesperados que detectan los tests de regresión en los componentes del sistema.",
      whyItMatters:
        "Un cambio en un componente base puede romper cientos de pantallas; la regresión visual lo detecta antes de release.",
      howToMeasure: [
        "Nº de diffs visuales por release y por componente",
        "Falsos positivos vs. regresiones reales confirmadas",
      ],
      frecuencia: "Por release",
      esfuerzo: "Medio",
      confianza: "Alta",
      cruzarCon: ["Paridad Storybook-Figma", "Cobertura de Storybook"],
      risksBiases: [
        "Alta tasa de falsos positivos por cambios de fuentes o antialiasing",
      ],
      audience: ["Engineering", "DS Team", "QA"],
      decision:
        "Bloquear o revisar los releases con regresiones visuales no aprobadas.",
    },
    tags: ["code", "testing", "quality"],
    relatedMetricIds: ["storybook-figma-parity", "storybook-coverage"],
    icon: "ScanEye",
    priority: 3,
  },
  {
    id: "component-performance",
    name: "Performance de componentes",
    shortName: "Performance",
    contextId: "design-systems",
    attributes: {
      categoria: "codigo",
      measurementType: "quantitative",
      sourcePrimary: "code",
      figmaAvailability: "no",
      maturity: "advanced",
      signalQuality: "medium",
      aiRelated: false,
    },
    ficha: {
      description:
        "Coste de rendimiento de los componentes del sistema: tamaño de bundle, tiempo de render y re-renders.",
      whyItMatters:
        "Componentes base lentos o pesados degradan todos los productos que los consumen.",
      howToMeasure: [
        "Peso (KB) que aporta cada componente al bundle",
        "Tiempo de render y nº de re-renders en benchmarks",
      ],
      frecuencia: "Por release",
      esfuerzo: "Alto",
      confianza: "Media",
      cruzarCon: ["Uso de componentes codificados", "Visual regression issues"],
      risksBiases: [
        "Los benchmarks aislados no reflejan el rendimiento en pantallas reales",
      ],
      audience: ["Engineering", "DS Team"],
      decision:
        "Optimizar los componentes más usados con peor relación coste/beneficio.",
    },
    tags: ["code", "performance", "quality"],
    relatedMetricIds: ["coded-component-usage", "visual-regression-issues"],
    icon: "Gauge",
    priority: 3,
  },
];
