import type { SourceType } from "@/lib/types";

export const sourceLegend: { value: SourceType; label: string; hint: string }[] =
  [
    { value: "figma", label: "Figma", hint: "Librerías, variables, uso en archivos" },
    { value: "code", label: "Código", hint: "Repos, bundles, telemetría de componentes" },
    { value: "support", label: "Soporte", hint: "Tickets, Slack, DesignOps" },
    {
      value: "product-analytics",
      label: "Product analytics",
      hint: "Eventos, embudos, experimentos",
    },
    { value: "research", label: "Research", hint: "Entrevistas, estudios, encuestas" },
    { value: "ai-logs", label: "IA / logs", hint: "Traces, prompts, herramientas MCP" },
  ];
