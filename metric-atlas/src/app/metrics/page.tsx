import { AppShell } from "@/components/layout/app-shell";
import { MetricsLibrary } from "@/components/metric/metrics-library";
import { getAllMetrics } from "@/lib/metrics-data";

export default function MetricsLibraryPage() {
  const metrics = getAllMetrics();

  return (
    <AppShell>
      <MetricsLibrary metrics={metrics} />
    </AppShell>
  );
}
