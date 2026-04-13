import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricDetail } from "@/components/metric/metric-detail";
import { getMetricById } from "@/lib/metrics-data";

type Props = { params: Promise<{ id: string }> };

export default async function MetricDetailPage({ params }: Props) {
  const { id } = await params;
  const metric = getMetricById(id);
  if (!metric) notFound();

  return (
    <AppShell>
      <div className="mb-4 rounded-lg border border-[#e6e6e6] bg-white px-4 py-3 shadow-sm">
        <Link
          href="/metrics"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#626262] transition-colors hover:text-[#1e1e1e]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a documentación
        </Link>
      </div>
      <MetricDetail metric={metric} />
    </AppShell>
  );
}
