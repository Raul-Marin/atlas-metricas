import {
  collection,
  deleteDoc,
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
import {
  defaultBoardCanvas,
  sanitizeBoard,
  type MatrixBoardCanvasSettings,
} from "@/lib/matrix-boards";
import { normalizeAxes } from "@/lib/matrix-axes";

export interface MatrixTemplate {
  id: string;
  name: string;
  description?: string;
  /** Color de portada (hex string). */
  accentColor?: string;
  /** Orden manual; menor = antes. */
  order?: number;
  archived?: boolean;
  canvas: MatrixBoardCanvasSettings;
}

function templatesCol() {
  return collection(getDb(), "templates");
}

export function sanitizeTemplate(
  raw: Partial<MatrixTemplate> & { id: string },
): MatrixTemplate {
  const sanitized = sanitizeBoard({
    id: raw.id,
    name: raw.name ?? "(sin nombre)",
    canvas: raw.canvas,
  });
  return {
    id: raw.id,
    name: raw.name ?? "(sin nombre)",
    description: raw.description,
    accentColor: raw.accentColor,
    order: typeof raw.order === "number" ? raw.order : undefined,
    archived: Boolean(raw.archived),
    canvas: {
      ...defaultBoardCanvas(),
      ...sanitized.canvas,
      matrixAxes: normalizeAxes(sanitized.canvas.matrixAxes),
    },
  };
}

export function subscribeToTemplates(
  cb: (templates: MatrixTemplate[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(templatesCol(), orderBy("name"));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) =>
        sanitizeTemplate({ ...(d.data() as Partial<MatrixTemplate>), id: d.id }),
      );
      cb(list);
    },
    (err) => {
      console.error("[templates] snapshot error", err);
      onError?.(err);
    },
  );
}

export async function getTemplateById(id: string): Promise<MatrixTemplate | null> {
  const snap = await getDoc(doc(templatesCol(), id));
  if (!snap.exists()) return null;
  return sanitizeTemplate({
    ...(snap.data() as Partial<MatrixTemplate>),
    id: snap.id,
  });
}

export async function createTemplate(template: MatrixTemplate): Promise<void> {
  await setDoc(doc(templatesCol(), template.id), {
    ...template,
    archived: Boolean(template.archived),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTemplate(
  id: string,
  patch: Partial<MatrixTemplate>,
): Promise<void> {
  await updateDoc(doc(templatesCol(), id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(templatesCol(), id));
}

/** Plantillas predefinidas: las dos que existían hardcodeadas en el dashboard. */
export const BUILTIN_TEMPLATES: MatrixTemplate[] = [
  {
    id: "impact-maturity",
    name: "Impacto × madurez",
    description: "Cruza la zona de impacto con la madurez de la métrica.",
    accentColor: "#A855F7",
    canvas: {
      ...defaultBoardCanvas(),
      matrixAxes: normalizeAxes({ axisX: "impactZone", axisY: "maturity" }),
    },
  },
  {
    id: "figma-layer",
    name: "Figma × capa",
    description: "Disponibilidad en Figma cruzada con la capa de la métrica.",
    accentColor: "#0EA5E9",
    canvas: {
      ...defaultBoardCanvas(),
      matrixAxes: normalizeAxes({
        axisX: "figmaAvailability",
        axisY: "layer",
      }),
    },
  },
];

/** Crea las plantillas predefinidas que aún no existan en la colección. */
export async function seedBuiltinTemplates(): Promise<{
  total: number;
  created: number;
  skipped: number;
}> {
  const existing = await getDocs(templatesCol());
  const have = new Set(existing.docs.map((d) => d.id));
  let created = 0;
  let skipped = 0;
  for (const t of BUILTIN_TEMPLATES) {
    if (have.has(t.id)) {
      skipped += 1;
      continue;
    }
    await createTemplate(t);
    created += 1;
  }
  return { total: BUILTIN_TEMPLATES.length, created, skipped };
}
