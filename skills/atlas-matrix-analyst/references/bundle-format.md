# Formato del paquete semántico (export "para IA")

Lo genera Metric Atlas en **Exportar → Exportar para IA (copiar)**. Es Markdown.
Estructura (las secciones aparecen en este orden):

```markdown
# Matriz: <nombre del board>

Contexto/dominio: <p.ej. Design Systems>

## Objetivo y audiencia
- Objetivo: <label del objetivo> — <descripción>        (o "ninguno")
- Audiencia: <lista de audiencias>                       (o "sin audiencia definida")

## Ejes del 2×2
- Eje X — <label>: "<extremo bajo>" (0) ↔ "<extremo alto>" (100)
- Eje Y — <label>: "<extremo bajo>" (0, arriba) ↔ "<extremo alto>" (100, abajo)

## Significado de los cuadrantes
- arriba-izquierda — <título>: <significado>
- arriba-derecha — <título>: <significado>
- abajo-izquierda — <título>: <significado>
- abajo-derecha — <título>: <significado>
# (si los ejes son personalizados, esta sección dice que no hay significado de plantilla)

## Fichas en la matriz (<n>)

### <nombre de la métrica> · <categoría>
- Posición: <eje X>=<0-100>, <eje Y>=<0-100> → cuadrante <posición> (<título del cuadrante>)
- Qué mide: …
- Por qué importa: …
- Medición: esfuerzo <…> · confianza <…> · frecuencia <…>
- Cómo medirla: …; …
- Riesgos: …; …
- Cruzar con: …; …
```

## Cómo leer las posiciones
- **X**: 0 = extremo bajo (izquierda), 100 = extremo alto (derecha).
- **Y**: 0 = extremo bajo (arriba), 100 = extremo alto (abajo). Ojo: en el eje Y,
  el valor 0 está **arriba**.
- El **cuadrante** ya viene resuelto en cada ficha (posición + título), no hace
  falta recalcularlo; úsalo tal cual.

## Notas
- Solo aparecen las **fichas colocadas** en el canvas (las que el usuario dejó en
  la matriz). Las excluidas no se exportan.
- Los campos de ficha (por qué importa, riesgos, cruzar con, etc.) pueden faltar
  en algunas métricas; trátalos como opcionales.
- "Cruzar con" son **nombres** de otras métricas complementarias, no ids.
