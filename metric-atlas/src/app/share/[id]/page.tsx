import { SharedBoardClient } from "@/components/atlas/shared-board-client";

type Props = { params: Promise<{ id: string }> };

export default async function SharedBoardPage({ params }: Props) {
  const { id } = await params;
  return <SharedBoardClient boardId={id} />;
}
