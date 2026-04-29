"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, LayoutGrid, Share2 } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

export function LandingPage({
  initialModalOpen = false,
}: {
  initialModalOpen?: boolean;
}) {
  const [modalOpen, setModalOpen] = React.useState(initialModalOpen);
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");

  const openSignIn = () => {
    setMode("signin");
    setModalOpen(true);
  };
  const openSignUp = () => {
    setMode("signup");
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f5f5f5] text-[#1e1e1e]">
      <header className="border-b border-[#e6e6e6] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-[-0.03em]">
            Metric Atlas
          </Link>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSignIn}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#626262] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={openSignUp}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0d99ff] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0b87e0]"
            >
              Crear cuenta
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-16 md:pt-24">
          <div className="mx-auto max-w-[760px] text-center">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f0f7ff] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#0d99ff]">
              <BookOpenText className="h-3.5 w-3.5" />
              Métricas para Design Systems
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#1e1e1e] md:text-[56px]">
              Mide lo que importa cuando el diseño escala con IA.
            </h1>
            <p className="mx-auto mt-4 max-w-[640px] text-base leading-[1.55] text-[#626262] md:text-lg">
              Una enciclopedia visual de métricas para sistemas de diseño que se
              cruzan con automatización, IA y herramientas como Figma. Crea
              matrices 2×2, fija tus métricas y comparte la vista.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={openSignUp}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d99ff] px-4 py-2 text-sm font-medium text-white shadow-sm transition-[background-color,transform] hover:translate-y-[-1px] hover:bg-[#0b87e0]"
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openSignIn}
                className="rounded-lg border border-[#e6e6e6] bg-white px-4 py-2 text-sm font-medium text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7]"
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </section>

        <section className="border-t border-[#e6e6e6] bg-white">
          <div className="mx-auto grid max-w-[1200px] gap-4 px-6 py-12 md:grid-cols-3">
            <FeatureCard
              icon={<LayoutGrid className="h-4 w-4" />}
              title="Matrices 2×2"
              description="Cruza cualquier par de variables de tu catálogo de métricas y arrastra fichas a mano. Cada matriz es persistente y privada."
            />
            <FeatureCard
              icon={<BookOpenText className="h-4 w-4" />}
              title="Documentación viva"
              description="Cada métrica vive como una ficha con descripción, fuentes, riesgos y métricas relacionadas. El contenido se mantiene desde el panel de admin."
            />
            <FeatureCard
              icon={<Share2 className="h-4 w-4" />}
              title="Comparte solo el canvas"
              description="Genera enlaces públicos de solo lectura para enseñar la matriz sin necesidad de cuenta. Apaga el enlace en cualquier momento."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e6e6] bg-white">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-6 text-xs text-[#757575]">
          <span>Metric Atlas</span>
          <button
            type="button"
            onClick={openSignIn}
            className="font-medium text-[#0d99ff] hover:underline"
          >
            Iniciar sesión
          </button>
        </div>
      </footer>

      <AuthModal
        open={modalOpen}
        initialMode={mode}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-[#e6e6e6] bg-[#fafafa] p-4">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#f0f7ff] text-[#0d99ff]">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-[1.55] text-[#626262]">{description}</p>
    </article>
  );
}
