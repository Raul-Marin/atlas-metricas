# Rediseño de la landing page

Documento de planificación para el rediseño completo de la landing page.

> Relacionado con la issue #7. Esta PR arranca **solo con esta descripción**; el
> trabajo de rediseño se irá añadiendo en commits posteriores sobre la rama
> `claude/landing-redesign`.

## Objetivo

Rediseñar por completo la vista pública (usuarios no autenticados) para comunicar
mejor la propuesta de valor de Metric Atlas y ofrecer una entrada clara al
registro/login.

## Punto de partida

- Componente: `src/components/landing/landing-page.tsx`.
- Render: `src/app/page.tsx` muestra `LandingPage` si no hay usuario; si hay
  sesión, muestra `MatrixDashboard`.
- Autenticación: mediante modal (`src/components/auth/auth-modal.tsx`); no hay
  ruta `/login`.

## Qué se va a hacer

- [ ] Migrar todos los colores hex hardcodeados a tokens semánticos del Design
      System (`bg-background`, `text-foreground`, `text-muted-foreground`,
      `bg-card`, `bg-primary`, `border-border`, etc.).
- [ ] Soporte completo de tema claro/oscuro vía tokens (sin hex).
- [ ] Rediseño del hero: jerarquía tipográfica y doble CTA (registro / login).
- [ ] (Opcional) Preview de producto: mockup de una matriz 2×2.
- [ ] Sección de features revisada.
- [ ] (Opcional) Banda CTA final + prueba social.
- [ ] Footer rediseñado.
- [ ] Responsive y accesibilidad básica (contraste, foco, semántica).

## Restricciones

- No romper la lógica de autenticación (modal `AuthModal`, props
  `initialModalOpen`, modos `signin`/`signup`).
- No tocar el routing a `MatrixDashboard` para usuarios autenticados.
- `npm run lint` y `npm run build` deben seguir pasando.
