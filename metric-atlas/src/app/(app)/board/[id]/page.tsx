import { BoardPageClient } from "@/components/atlas/board-page-client";

type Props = { params: Promise<{ id: string }> };

export default async function BoardPage({ params }: Props) {
  const { id } = await params;
  return <BoardPageClient boardId={id} />;
}
