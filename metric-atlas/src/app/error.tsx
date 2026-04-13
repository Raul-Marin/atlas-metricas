"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Error en la app</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Ha ocurrido un error al renderizar esta vista."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
