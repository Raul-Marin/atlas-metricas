import type { FigmaAvailability } from "./types";

export function figmaBadgeVariant(
  f: FigmaAvailability,
): "figmaYes" | "figmaPartial" | "figmaNo" {
  if (f === "yes") return "figmaYes";
  if (f === "partial") return "figmaPartial";
  return "figmaNo";
}
