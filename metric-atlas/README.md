# Metric Atlas

Plataforma para mapear y documentar métricas de Design Systems en la era de la IA.
Boards 2×2 (lienzo tipo FigJam), filtros por variables, ficha por métrica. Auth y datos por usuario en Firebase.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript estricto
- Tailwind 3 + Radix UI
- Firebase Auth (email/password + Google) y Firestore
- Despliegue en Firebase App Hosting (Next.js SSR nativo)

## Estructura

```
src/
├── app/
│   ├── (auth)/login/        # pantalla de login + registro
│   ├── (app)/               # rutas protegidas (requieren sesión)
│   │   ├── page.tsx         # dashboard de matrices
│   │   ├── board/[id]/      # canvas individual
│   │   └── metrics/         # biblioteca y fichas
│   └── api/metrics/         # endpoint público con el catálogo
├── lib/
│   ├── firebase/client.ts   # init de Firebase (auth + firestore)
│   ├── auth/                # AuthProvider, useAuth
│   ├── boards/              # CRUD Firestore + hook useBoards
│   └── matrix-boards.ts     # tipos puros y helpers (sin I/O)
└── data/metrics.ts          # catálogo de métricas (en código)
```

Datos en Firestore por usuario:
```
users/{uid}/boards/{boardId}
users/{uid}/spaces/{spaceId}
```

## Setup local

1. Crea el proyecto Firebase en https://console.firebase.google.com
2. Habilita **Authentication** → métodos `Email/Password` y `Google`
3. Habilita **Firestore Database** (modo nativo, región a tu gusto)
4. En Project Settings → tu app web, copia los valores de configuración
5. Copia `.env.example` a `.env.local` y rellena las 6 variables `NEXT_PUBLIC_FIREBASE_*`
6. Instala dependencias y arranca:

```bash
npm install
npm run dev
```

Sin `.env.local` la página de login muestra un aviso explicando qué hacer.

## Despliegue de las reglas Firestore

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # selecciona tu proyecto
firebase deploy --only firestore:rules
```

Las reglas (`firestore.rules`) garantizan que cada usuario solo accede a su subcolección `users/{uid}/...`.

## Despliegue en Firebase App Hosting

App Hosting soporta Next.js con SSR de forma nativa.

1. Sube este repo a GitHub (público o privado).
2. En Firebase Console → **App Hosting** → "Get started" → conecta el repo.
3. Configura las variables de entorno en App Hosting con los mismos 6 valores `NEXT_PUBLIC_FIREBASE_*` (`apphosting.yaml` ya las declara, los valores los pones en consola).
4. Cada push a la rama configurada despliega automáticamente.

Comando manual (alternativa CLI, si ya tienes el backend creado):
```bash
firebase apphosting:backends:list
git push origin main
```

## Scripts

- `npm run dev` — servidor de desarrollo en `http://localhost:3000`
- `npm run build` — build de producción
- `npm run start` — servir el build
- `npm run lint` — linter

## Rutas

- `/login` — login + registro
- `/` — dashboard (privada)
- `/board/[id]` — canvas (privada)
- `/metrics`, `/metrics/[id]` — biblioteca (privada)
- `GET /api/metrics` — JSON `{ metrics, version }` (pública)
