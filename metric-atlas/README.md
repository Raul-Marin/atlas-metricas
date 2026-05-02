<div align="center">
  <h1>🗺️ Metric Atlas</h1>
  <p><strong>Plataforma para mapear y documentar métricas de Design Systems en la era de la IA.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-Auth_%7C_Firestore-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  </p>
</div>

<br />

## 📖 Introducción y Visión General

Metric Atlas es una herramienta de gestión y visualización de **métricas para Design Systems**, pensada específicamente para la era de la IA. Nuestro objetivo es cerrar la brecha de comunicación entre diseño, producto y desarrollo. 

**¿En qué consiste?**
La plataforma permite a los usuarios:
- **Visualizar:** A través de *Boards 2x2* (lienzos interactivos al estilo FigJam) para mapear métricas visualmente según su impacto y esfuerzo.
- **Documentar:** Un catálogo detallado (fichas) por cada métrica, permitiendo ver sus variables, estados y definición.
- **Filtrar y Organizar:** Sistema de filtros dinámicos para encontrar rápidamente la métrica que necesitas.
- **Personalizar:** Todo el contenido es propio de cada usuario, persistido en la nube en tiempo real mediante Firebase.

---

## 🏗️ Arquitectura y Mantenimiento del Repositorio

La arquitectura del proyecto está diseñada para ser escalable y fácil de mantener. A continuación, se detallan las pautas establecidas para el desarrollo de nuevas funcionalidades y el mantenimiento del código existente:

### 1. Single Source of Truth
- **Catálogo Base:** La adición o modificación de las métricas predeterminadas del sistema se gestiona desde el origen de datos estático en `src/data/metrics.ts`.
- **Estilos Globales:** Cualquier alteración en la paleta de colores base o variables estructurales debe centralizarse en `src/styles/globals.css`. Es mandatorio utilizar las clases de Tailwind basadas en las variables `hsl` del proyecto, evitando el uso de colores hexadecimales (hardcoded) en los componentes.

### 2. Flujo de Desarrollo
- **UI / Componentes:** El desarrollo de la interfaz se basa en componentes modulares ubicados en la carpeta `src/components/`. Se debe mantener una estricta filosofía de encapsulación y asegurar que todos los componentes cumplan con los estándares de accesibilidad (a11y) utilizando las primitivas de Radix UI correspondientes.
- **Vistas / Rutas:** La creación de nuevas páginas se realiza en el directorio `src/app/(app)/`. El proyecto utiliza el App Router de Next.js, por lo que los componentes son `Server Components` por defecto. La directiva `"use client"` está reservada exclusivamente para componentes que requieran interactividad del lado del cliente (hojas, modales, formularios, estado complejo).
- **Backend / Firebase:** La interacción con la base de datos y la lógica de negocio se abstraen a través de Custom Hooks ubicados en `src/lib/boards/`. Al crear una nueva colección o documento en Firestore, es imprescindible actualizar las reglas en `firestore.rules` para garantizar que el acceso esté restringido a la información del usuario respectivo (`users/{uid}/...`).

### 3. Estándares y Buenas Prácticas
1. **Tipado Estricto:** Se requiere el uso constante de las interfaces definidas en `src/lib/matrix-boards.ts` para mantener la robustez y consistencia de los datos en toda la aplicación.
2. **Validación Pre-Integración:** Antes de proponer cualquier cambio (Pull Request), el código debe someterse a análisis mediante `npm run lint` y verificar que el proceso de compilación (`npm run build`) se ejecute sin errores.


---

## 🎨 Para Diseñadores (Design System & UI)

La plataforma está construida priorizando la estética y la coherencia del **Design System**. Hemos adoptado un enfoque "Glassmorphism" con transiciones suaves, modo oscuro nativo, y una paleta de colores cuidadosamente curada basada en **variables HSL** para un control absoluto desde Tailwind y CSS puro.

### Identidad Visual & Temas

La UI se maneja a través de un sistema dual (Light/Dark) altamente optimizado, inyectado mediante clases en `src/styles/globals.css`.

| Token HSL | Light Mode (Aero/Clean) | Dark Mode (Deep/Gold) | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Background** | `210 20% 98%` | `220 16% 8%` | Fondo base de las vistas. |
| **Foreground** | `0 0% 12%` | `45 20% 96%` | Textos primarios y encabezados. |
| **Accent/Primary**| `204 100% 53%` (Azul vibrante) | `38 42% 58%` (Oro/Mostaza) | Botones, rings, highlights, CTAs. |
| **Card** | `0 0% 100%` (Blanco puro) | `220 14% 11%` | Superficies de las tarjetas y modales. |
| **Border** | `0 0% 90%` | `220 12% 20%` | Divisores sutiles y delineados de inputs. |
| **Radius** | `0.625rem` | `0.625rem` | Curvaturas estándar en toda la UI. |

* **Tipografía**: Optimizada para legibilidad (`optimizeLegibility`), con propiedades avanzadas (`font-feature-settings: "ss01" 1, "cv01" 1, "cv11" 1`).
* **Componentes**: Utiliza la filosofía de **Radix UI** + **Tailwind CSS**, permitiendo una accesibilidad total (a11y) sin comprometer el estilo visual.

---

## 💻 Para Desarrolladores (Arquitectura & Código)

### Estructura del Proyecto

El código fuente utiliza **Next.js App Router** y se organiza para una separación estricta de responsabilidades:

```text
src/
├── app/
│   ├── (auth)/login/        # Pantalla de login + registro
│   ├── (app)/               # Rutas protegidas (requieren sesión activa)
│   │   ├── page.tsx         # Dashboard principal de matrices
│   │   ├── board/[id]/      # Vista de Canvas individual 2x2
│   │   └── metrics/         # Biblioteca y fichas de métricas detalladas
│   ├── api/metrics/         # Endpoint público con el catálogo
│   └── globals.css          # Core Design System (Variables HSL, theming)
├── components/              # Componentes de UI modulares y reutilizables
├── lib/
│   ├── firebase/client.ts   # Inicialización de Firebase (Auth + Firestore)
│   ├── auth/                # AuthProvider, hooks de sesión (useAuth)
│   ├── boards/              # Funciones CRUD Firestore + hook useBoards
│   └── matrix-boards.ts     # Tipos puros y helpers (sin dependencias I/O)
└── data/metrics.ts          # Catálogo estático (Source of Truth inicial)
```

### Modelo de Datos (Firestore)
La estructura de base de datos está segregada por usuario para garantizar privacidad y seguridad total en los *Boards* y *Spaces*:

```json
users/{uid}/boards/{boardId}
users/{uid}/spaces/{spaceId}
```

---

## 🚀 Guía de Instalación (Setup Local)

Sigue estos pasos para arrancar el entorno local de desarrollo.

### 1. Configuración en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication** habilitando `Email/Password` y `Google`.
3. Activa **Firestore Database** en modo nativo.
4. Obtén las credenciales web en **Project Settings**.

### 2. Variables de Entorno
Copia el archivo de ejemplo para configurar tu `.env.local`:
```bash
cp .env.example .env.local
```
Completa las variables `NEXT_PUBLIC_FIREBASE_*` con los datos de tu proyecto. *(Nota: Sin este archivo, la ruta `/login` te avisará amigablemente del error).*

### 3. Instalación e Inicio
```bash
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🛡️ Despliegues & Seguridad

### Reglas de Seguridad (Firestore)
Es crucial que ningún usuario pueda leer datos de otros. Despliega las reglas locales:
```bash
npm install -g firebase-tools
firebase login
firebase use --add        # Selecciona tu proyecto
firebase deploy --only firestore:rules
```

### Hosting en Firebase App Hosting
Aprovechamos el **SSR (Server-Side Rendering) nativo** de Next.js mediante Firebase App Hosting:
1. Asegúrate de tener tu repo en GitHub.
2. En Firebase Console, navega a **App Hosting** → *Get started* y enlaza tu repo.
3. Configura las mismas variables de entorno `NEXT_PUBLIC_FIREBASE_*` en la consola. El archivo `apphosting.yaml` del repo orquestará el build.
4. 🎉 **Cada push a la rama principal lanzará un despliegue automático.**

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:3000`. |
| `npm run build` | Construye la aplicación para producción. |
| `npm run start` | Inicia el servidor de producción (post-build). |
| `npm run lint` | Analiza el código con ESLint para mantener estándares. |

<br />

<div align="center">
  <i>Desarrollado con ❤️ combinando Diseño, Datos e IA.</i>
</div>
