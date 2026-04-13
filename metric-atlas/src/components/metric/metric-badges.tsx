import type { Metric } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { figmaBadgeVariant } from "@/lib/visual-encoding";
import { layerLabels } from "@/data/filters";
import { SignalQualityBadge } from "./signal-quality-badge";

const figmaText: Record<string, string> = {
  yes: "Figma",
  partial: "Figma · parcial",
  no: "Sin Figma",
};

const maturityText: Record<string, string> = {
  classical: "Madurez · clásica",
  advanced: "Madurez · avanzada",
  experimental: "Madurez · experimental",
};

export function MetricBadges({ metric }: { metric: Metric }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="normal-case tracking-normal">
        {layerLabels[metric.layer]}
      </Badge>
      <Badge variant={figmaBadgeVariant(metric.figmaAvailability)}>
        {figmaText[metric.figmaAvailability]}
      </Badge>
      <Badge variant="outline" className="normal-case tracking-normal">
        {maturityText[metric.maturity]}
      </Badge>
      <SignalQualityBadge value={metric.signalQuality} />
      {metric.experimental ? (
        <Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700">
          Experimental
        </Badge>
      ) : null}
      {metric.aiRelated ? (
        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
          IA
        </Badge>
      ) : null}
      {metric.realtimePossible ? (
        <Badge variant="outline" className="normal-case tracking-normal">
          Tiempo real posible
        </Badge>
      ) : null}
    </div>
  );
}
