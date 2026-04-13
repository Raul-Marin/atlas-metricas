import type { SignalQuality } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<SignalQuality, string> = {
  strong: "Señal fuerte",
  medium: "Señal media",
  weak: "Señal débil",
  speculative: "Especulativa",
};

const styles: Record<SignalQuality, string> = {
  strong: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  weak: "border-orange-200 bg-orange-50 text-orange-700",
  speculative: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
};

export function SignalQualityBadge({ value }: { value: SignalQuality }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[value],
      )}
    >
      {labels[value]}
    </span>
  );
}
