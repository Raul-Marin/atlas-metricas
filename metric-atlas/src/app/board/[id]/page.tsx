import { BoardPageClient } from "@/components/atlas/board-page-client";
import { getAllMetrics } from "@/lib/metrics-data";

type Props = { params: Promise<{ id: string }> };

export default async function BoardPage({ params }: Props) {
  const { id } = await params;
  const metrics = getAllMetrics();
  return <BoardPageClient boardId={id} metrics={metrics} />;
}
