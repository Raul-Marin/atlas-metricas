# Heurísticas de interpretación y guion de presentación

## Principios
- El **objetivo** dice qué hay que demostrar; ordena los hallazgos hacia él.
- La **audiencia** dicta el tono y qué destacar (ver "Audiencias").
- El **significado de cada cuadrante** (del bloque) es la clave para interpretar
  dónde cae cada métrica. Léelo antes de opinar.

## Patrones a detectar
1. **Cuadrante saturado**: muchas fichas en un cuadrante → concentración de
   esfuerzo/atención ahí; ¿es lo que el objetivo quiere?
2. **Cuadrante vacío**: ninguna ficha → punto ciego o área sin medir (a menudo el
   hallazgo más importante).
3. **Vanity metrics**: métricas en cuadrantes tipo "bajo valor / fácil de medir",
   "evidencia débil" o "actividad sin acción". Señálalas para descartar o mover.
4. **Prioridad clara**: fichas en "alto impacto + alta urgencia" / "empezar aquí"
   / "métricas para leadership" → candidatas a first set / narrativa principal.
5. **Alto valor difícil de medir**: necesitan narrativa o investigación, no
   dashboard. Recoméndalo explícitamente.
6. **Contradicciones con el objetivo**: métricas cuya posición no ayuda al
   objetivo declarado (p.ej. objetivo "impacto en delivery" pero casi todo cae en
   evidencia débil) → riesgo de no poder demostrar lo que se busca.
7. **Cobertura por categoría**: si el objetivo abarca varias categorías y solo
   una está representada, señala la falta.
8. **Relaciones "cruzar con"**: si dos métricas que deberían cruzarse están en
   cuadrantes opuestos, coméntalo (p.ej. mucho uso + muchos overrides).

## Audiencias (tono y foco)
- **Leadership / Producto / Negocio**: impacto, ROI, decisión, riesgo a futuro.
  Pocas métricas, la narrativa por delante. Evita jerga.
- **DS Team / Engineering**: deuda, priorización, instrumentación, qué medir
  primero, guardrails. Se puede entrar al detalle.
- **Diseño**: adopción, consistencia, fricción, calidad percibida.
- **Ops**: mantenimiento, backlog, resolución.
- **Todas / mixta**: dos niveles — titular para leadership + detalle para el equipo.

## Guion de la presentación (si la piden)
Por defecto un **deck HTML autocontenido** (una sola página, navegable o con
secciones). Si el usuario prefiere .pptx o slides Markdown (Marp/reveal), adapta
el mismo contenido. Slides sugeridas:

1. **Portada**: nombre de la matriz · objetivo · audiencia.
2. **La matriz de un vistazo**: los dos ejes y qué significa cada cuadrante.
3. **Dónde estamos**: distribución de las fichas por cuadrante (resumen).
4. **Insight clave**: la conclusión principal (1 frase grande).
5. **Qué significa**: 2–4 lecturas por cuadrante, con las métricas concretas.
6. **Riesgos / vanity metrics**: qué descartar o mover.
7. **Acciones recomendadas**: priorizadas, atribuidas a métricas/cuadrantes.
8. **Cierre / narrativa para la audiencia**: cómo comunicarlo.

Reglas del deck: sobrio y legible, un mensaje por slide, cita métricas reales del
bloque, sin inventar cifras. Colorea con moderación (los cuadrantes pueden guiar
el color). Entrega el archivo listo para abrir/compartir.
