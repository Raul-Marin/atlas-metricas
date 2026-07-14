import type { MatrixAxesState, Metric, MetricScoresMap } from "@/lib/types";
import type { MetricContext } from "@/lib/context/types";
import { MATRIX_AXIS_OPTIONS, axisEndLabels } from "@/lib/matrix-axes";
import { resolveMetricLayout } from "@/lib/metric-layout";

type QuadKey = "tl" | "tr" | "bl" | "br";

/** Cuadrante a partir de la posición normalizada (x: izq→der, y: arriba→abajo). */
function quadrantKey(x: number, y: number): QuadKey {
  const left = x < 0.5;
  const top = y < 0.5;
  return top ? (left ? "tl" : "tr") : left ? "bl" : "br";
}

const QUAD_POS: Record<QuadKey, string> = {
  tl: "arriba-izquierda",
  tr: "arriba-derecha",
  bl: "abajo-izquierda",
  br: "abajo-derecha",
};

function axisLabel(id: string): string {
  return MATRIX_AXIS_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function list(items?: string[]): string {
  return items && items.length ? items.join("; ") : "—";
}

/**
 * Construye el "paquete semántico" de una matriz en Markdown, pensado para
 * pegarlo a un agente IA: matriz + objetivo + audiencia + significado de
 * cuadrantes + fichas colocadas (posición, cuadrante y ficha). Es el valor a
 * extraer al exportar.
 */
export function buildAiBundle(input: {
  title: string;
  axes: MatrixAxesState;
  /** Métricas colocadas en el canvas (incluidas). */
  metrics: Metric[];
  scores: MetricScoresMap;
  objective: string;
  audiences: string[];
  templateId: string;
  context: MetricContext;
}): string {
  const { title, axes, metrics, scores, objective, audiences, templateId, context } =
    input;

  const obj = context.objectives.find((o) => o.id === objective);
  const audLabels = audiences
    .map((id) => context.audiences.find((a) => a.id === id)?.label ?? id)
    .filter(Boolean);
  const catLabel = (id?: string) =>
    context.categories.find((c) => c.id === id)?.label ?? id ?? "—";

  // Cuadrantes: solo si la plantilla de origen coincide con los ejes actuales.
  const tpl = context.templates.find((t) => t.id === templateId);
  const quadrantsMatch =
    tpl && tpl.axisX === axes.axisX && tpl.axisY === axes.axisY ? tpl : null;
  const quadTitle: Partial<Record<QuadKey, string>> = {};
  const quadMeaning: Partial<Record<QuadKey, string>> = {};
  if (quadrantsMatch) {
    for (const q of quadrantsMatch.quadrants) {
      quadTitle[q.key] = q.title;
      quadMeaning[q.key] = q.meaning;
    }
  }

  const xEnds = axisEndLabels(axes.axisX);
  const yEnds = axisEndLabels(axes.axisY);
  const layout = resolveMetricLayout(metrics, axes, scores);

  const L: string[] = [];
  L.push(`# Matriz: ${title}`);
  L.push("");
  L.push(`Contexto/dominio: ${context.name}`);
  L.push("");
  L.push("## Objetivo y audiencia");
  L.push(
    `- Objetivo: ${obj ? `${obj.label}${obj.description ? ` — ${obj.description}` : ""}` : "ninguno"}`,
  );
  L.push(`- Audiencia: ${audLabels.length ? audLabels.join(", ") : "sin audiencia definida"}`);
  L.push("");
  L.push("## Ejes del 2×2");
  L.push(`- Eje X — ${axisLabel(axes.axisX)}: "${xEnds.low}" (0) ↔ "${xEnds.high}" (100)`);
  L.push(`- Eje Y — ${axisLabel(axes.axisY)}: "${yEnds.low}" (0, arriba) ↔ "${yEnds.high}" (100, abajo)`);
  L.push("");

  if (quadrantsMatch) {
    L.push("## Significado de los cuadrantes");
    (["tl", "tr", "bl", "br"] as QuadKey[]).forEach((k) => {
      L.push(`- ${QUAD_POS[k]} — ${quadTitle[k]}: ${quadMeaning[k]}`);
    });
    L.push("");
  } else {
    L.push("## Significado de los cuadrantes");
    L.push("- (Ejes personalizados: sin significado de plantilla asociado.)");
    L.push("");
  }

  L.push(`## Fichas en la matriz (${metrics.length})`);
  L.push("");
  for (const m of metrics) {
    const pos = layout.get(m.id) ?? { x: 0.5, y: 0.5 };
    const qk = quadrantKey(pos.x, pos.y);
    const quadDesc = quadTitle[qk] ? `${QUAD_POS[qk]} (${quadTitle[qk]})` : QUAD_POS[qk];
    const cat = catLabel(
      typeof m.attributes?.categoria === "string" ? m.attributes.categoria : undefined,
    );
    L.push(`### ${m.name} · ${cat}`);
    L.push(
      `- Posición: ${axisLabel(axes.axisX)}=${Math.round(pos.x * 100)}, ${axisLabel(axes.axisY)}=${Math.round(pos.y * 100)} → cuadrante ${quadDesc}`,
    );
    if (m.ficha?.description) L.push(`- Qué mide: ${m.ficha.description}`);
    if (m.ficha?.whyItMatters) L.push(`- Por qué importa: ${m.ficha.whyItMatters}`);
    const meta: string[] = [];
    if (m.ficha?.esfuerzo) meta.push(`esfuerzo ${m.ficha.esfuerzo}`);
    if (m.ficha?.confianza) meta.push(`confianza ${m.ficha.confianza}`);
    if (m.ficha?.frecuencia) meta.push(`frecuencia ${m.ficha.frecuencia}`);
    if (meta.length) L.push(`- Medición: ${meta.join(" · ")}`);
    if (m.ficha?.howToMeasure?.length) L.push(`- Cómo medirla: ${list(m.ficha.howToMeasure)}`);
    if (m.ficha?.risksBiases?.length) L.push(`- Riesgos: ${list(m.ficha.risksBiases)}`);
    if (m.ficha?.cruzarCon?.length) L.push(`- Cruzar con: ${list(m.ficha.cruzarCon)}`);
    L.push("");
  }

  return L.join("\n").trim() + "\n";
}
