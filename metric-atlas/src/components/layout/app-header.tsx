import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-[#e6e6e6] bg-white/94 py-4 backdrop-blur-sm md:py-5">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-8">
        <Link href="/" className="group">
          <span className="text-xl font-semibold tracking-[-0.03em] text-[#1e1e1e] md:text-[28px]">
            Metric Atlas
          </span>
          <span className="ml-2 text-sm text-[#757575] transition-colors group-hover:text-[#1e1e1e]">
            ← mapa
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 text-[#626262] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
          >
            Herramienta
          </Link>
          <Link
            href="/metrics"
            className="rounded-md bg-[#f0f7ff] px-2.5 py-1.5 font-medium text-[#0d99ff] shadow-[inset_0_0_0_1px_rgba(13,153,255,0.06)] transition-colors hover:bg-[#e8f4ff]"
          >
            Documentación
          </Link>
        </nav>
      </div>
    </header>
  );
}
