import Link from "next/link";

const cards = [
  {
    href: "/admin/users",
    title: "Usuarios",
    description:
      "Listado de cuentas que han iniciado sesión. Próximamente podrás controlar el acceso desde aquí.",
  },
  {
    href: "/admin/metrics",
    title: "Métricas",
    description:
      "Crear, editar y archivar las métricas que se muestran en las matrices y en la documentación.",
  },
  {
    href: "/admin/templates",
    title: "Plantillas",
    description:
      "Definir matrices base que aparecen en el dashboard al crear una nueva matriz.",
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#1e1e1e]">
          Panel de administración
        </h1>
        <p className="text-xs text-[#757575]">
          Acceso restringido. Esta sección no está enlazada desde la app.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-[#e6e6e6] bg-white p-4 shadow-sm transition-[box-shadow,transform,border-color] duration-150 hover:translate-y-[-1px] hover:border-[#d9d9d9] hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
              Sección
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[#1e1e1e] group-hover:text-[#0d99ff]">
              {card.title}
            </h2>
            <p className="mt-1.5 text-xs leading-[1.5] text-[#626262]">
              {card.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
