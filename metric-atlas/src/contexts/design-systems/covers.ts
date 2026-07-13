import type { CoverDef } from "@/lib/context/types";

/**
 * Portadas del contexto Design Systems. 8 corresponden a las plantillas (1:1) y
 * `user-created` es la portada por defecto de los archivos creados en blanco.
 * Imágenes en `public/covers/*.webp` (optimizadas).
 */
export const COVERS: CoverDef[] = [
  { id: "adopcion-gobernanza", label: "Adopción y gobernanza", src: "/covers/adopcion-gobernanza.webp" },
  { id: "salud-sistema", label: "Salud del sistema", src: "/covers/salud-sistema.webp" },
  { id: "impacto-delivery", label: "Impacto en delivery", src: "/covers/impacto-delivery.webp" },
  { id: "figma-codigo", label: "Figma vs código", src: "/covers/figma-codigo.webp" },
  { id: "ia-anti-slop", label: "IA y anti-slop", src: "/covers/ia-anti-slop.webp" },
  { id: "por-audiencia", label: "Por audiencia", src: "/covers/por-audiencia.webp" },
  { id: "madurez-sistema", label: "Madurez del sistema", src: "/covers/madurez-sistema.webp" },
  { id: "valor-facilidad", label: "Valor vs facilidad", src: "/covers/valor-facilidad.webp" },
  { id: "user-created", label: "Genérica", src: "/covers/user-created.webp" },
];

/** Id de portada por defecto para un archivo creado en blanco. */
export const USER_CREATED_COVER = "user-created";

export const COVER_BY_ID: Record<string, CoverDef> = Object.fromEntries(
  COVERS.map((c) => [c.id, c]),
);
