import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Metric } from "@/lib/types";

function metricsCol() {
  return collection(getDb(), "metrics");
}

/** Coerciona los campos opcionales para que la pieza siempre tenga shape estable. */
export function sanitizeMetric(raw: Partial<Metric> & { id: string }): Metric {
  return {
    id: raw.id,
    name: raw.name ?? "(sin nombre)",
    shortName: raw.shortName,
    layer: raw.layer ?? "system-health",
    subgroup: raw.subgroup,
    impactZone: raw.impactZone ?? "system",
    measurementType: raw.measurementType ?? "qualitative",
    sourcePrimary: raw.sourcePrimary ?? "research",
    sourceSecondary: raw.sourceSecondary ?? [],
    figmaAvailability: raw.figmaAvailability ?? "no",
    maturity: raw.maturity ?? "experimental",
    signalQuality: raw.signalQuality ?? "weak",
    experimental: Boolean(raw.experimental),
    aiRelated: Boolean(raw.aiRelated),
    realtimePossible: Boolean(raw.realtimePossible),
    description: raw.description ?? "",
    whyItMatters: raw.whyItMatters ?? "",
    howToMeasure: Array.isArray(raw.howToMeasure) ? raw.howToMeasure : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    relatedMetricIds: Array.isArray(raw.relatedMetricIds)
      ? raw.relatedMetricIds
      : [],
    dashboardIdeas: raw.dashboardIdeas,
    automationIdeas: raw.automationIdeas,
    risksBiases: raw.risksBiases,
    priority: raw.priority,
    archived: Boolean(raw.archived),
  };
}

export function subscribeToMetrics(
  cb: (metrics: Metric[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(metricsCol(), orderBy("name"));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) =>
        sanitizeMetric({ ...(d.data() as Partial<Metric>), id: d.id }),
      );
      cb(list);
    },
    (err) => {
      console.error("[metrics] snapshot error", err);
      onError?.(err);
    },
  );
}

export async function getMetricByIdAsync(id: string): Promise<Metric | null> {
  const snap = await getDoc(doc(metricsCol(), id));
  if (!snap.exists()) return null;
  return sanitizeMetric({ ...(snap.data() as Partial<Metric>), id: snap.id });
}

export async function createMetric(metric: Metric): Promise<void> {
  const ref = doc(metricsCol(), metric.id);
  await setDoc(ref, {
    ...metric,
    archived: Boolean(metric.archived),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMetric(
  id: string,
  patch: Partial<Metric>,
): Promise<void> {
  const ref = doc(metricsCol(), id);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveMetric(id: string): Promise<void> {
  await updateMetric(id, { archived: true });
}

export async function unarchiveMetric(id: string): Promise<void> {
  await updateMetric(id, { archived: false });
}

/** Bulk seed (solo en admin). Crea documentos para los ids que no existan. */
export async function seedMetricsIfEmpty(seed: Metric[]): Promise<{
  total: number;
  created: number;
  skipped: number;
}> {
  const existing = await getDocs(metricsCol());
  const have = new Set(existing.docs.map((d) => d.id));
  let created = 0;
  let skipped = 0;
  for (const m of seed) {
    if (have.has(m.id)) {
      skipped += 1;
      continue;
    }
    await createMetric(m);
    created += 1;
  }
  return { total: seed.length, created, skipped };
}
