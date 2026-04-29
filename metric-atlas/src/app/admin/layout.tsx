"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAdminGuard } from "@/lib/admin/use-admin";
import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/metrics", label: "Métricas" },
  { href: "/admin/templates", label: "Plantillas" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const state = useAdminGuard();
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const { user, signOutUser } = useAuth();

  React.useEffect(() => {
    if (state.kind === "no-user") {
      router.replace(`/?next=${encodeURIComponent(pathname)}`);
    }
  }, [state.kind, router, pathname]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Verificando acceso…
      </div>
    );
  }

  if (state.kind === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f5f5] px-4 text-center">
        <p className="text-sm font-medium text-[#1e1e1e]">Acceso restringido</p>
        <p className="max-w-md text-xs text-[#757575]">
          Tu cuenta no tiene permisos de admin. Si crees que es un error,
          comprueba que estás conectado con la cuenta correcta.
        </p>
        <Link
          href="/"
          className="text-xs font-medium text-[#0d99ff] hover:underline"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  if (state.kind !== "ok") return null;

  const onSignOut = async () => {
    await signOutUser();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <header className="sticky top-0 z-30 border-b border-[#e6e6e6] bg-white">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
              Metric Atlas · Admin
            </span>
            <span className="hidden text-xs text-[#949494] sm:inline">
              {user?.email}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#626262] transition-colors hover:bg-[#f5f5f5] hover:text-[#1e1e1e]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 border-t border-[#f0f0f0] px-4">
          {TABS.map((tab) => {
            const active =
              tab.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-[#0d99ff] text-[#0d99ff]"
                    : "border-transparent text-[#626262] hover:text-[#1e1e1e]",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  );
}
