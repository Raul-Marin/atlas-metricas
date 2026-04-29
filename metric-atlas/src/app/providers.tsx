"use client";

import { AuthProvider } from "@/lib/auth/auth-provider";
import { MetricsProvider } from "@/lib/metrics/provider";
import { TemplatesProvider } from "@/lib/templates/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MetricsProvider>
        <TemplatesProvider>{children}</TemplatesProvider>
      </MetricsProvider>
    </AuthProvider>
  );
}
