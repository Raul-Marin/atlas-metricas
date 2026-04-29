"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { LandingPage } from "@/components/landing/landing-page";
import { MatrixDashboard } from "@/components/dashboard/matrix-dashboard";

function RootInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  React.useEffect(() => {
    if (loading || !user || !next) return;
    if (next.startsWith("/") && !next.startsWith("//")) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
        Cargando…
      </div>
    );
  }

  if (user) return <MatrixDashboard />;

  return <LandingPage initialModalOpen={Boolean(next)} />;
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f5] text-sm text-[#757575]">
          Cargando…
        </div>
      }
    >
      <RootInner />
    </Suspense>
  );
}
