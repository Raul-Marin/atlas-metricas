"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";

export default function AppGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading) return;
    if (!configured || !user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/?next=${next}`);
    }
  }, [loading, user, configured, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Cargando…
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
