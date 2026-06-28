import {
  Accessibility,
  Archive,
  Bot,
  BookOpen,
  Briefcase,
  CircleDot,
  Code2,
  Component,
  Eye,
  FlaskConical,
  HeartPulse,
  Inbox,
  MessageSquareWarning,
  PackagePlus,
  Palette,
  PenTool,
  Recycle,
  Rocket,
  Scale,
  SprayCan,
  Timer,
  Wand2,
  Waves,
  Webhook,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Icono representativo por métrica (id → icono). Distinto para cada una.
 * Para nuevas métricas, añade aquí su entrada (id del catálogo → icono lucide).
 */
const METRIC_ICONS: Record<string, LucideIcon> = {
  "design-token-usage": Palette,
  "design-code-parity": Scale,
  "component-health": HeartPulse,
  "accessibility-score": Accessibility,
  "documentation-coverage": BookOpen,
  "api-stability-index": Webhook,
  "component-usage": Component,
  "adoption-rate": Rocket,
  "deprecated-component-usage": Archive,
  "design-productivity": PenTool,
  "designops-ticket-load": Inbox,
  "time-to-market": Timer,
  "developer-productivity": Code2,
  "experiment-win-rate": FlaskConical,
  "user-perceived-consistency": Eye,
  "business-outcome-proxy": Briefcase,
  "ai-assisted-reuse-rate": Recycle,
  "post-ai-correction-ratio": Wrench,
  "generative-consistency": Wand2,
  "automation-success-rate": Bot,
  "visual-slop-ratio": SprayCan,
  "ai-invented-components-rate": PackagePlus,
  "generative-drift": Waves,
  "prompt-debt": MessageSquareWarning,
};

/** Icono de una métrica; usa un fallback genérico si no está registrada. */
export function getMetricIcon(metricId: string): LucideIcon {
  return METRIC_ICONS[metricId] ?? CircleDot;
}
