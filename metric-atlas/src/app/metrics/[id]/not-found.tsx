import Link from "next/link";

export default function MetricNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Métrica no encontrada</h1>
      <p className="text-muted-foreground">
        Ese id no existe en el dataset estático del MVP.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Volver al mapa
      </Link>
    </div>
  );
}
