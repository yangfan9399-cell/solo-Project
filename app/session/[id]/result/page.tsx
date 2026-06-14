import { notFound } from 'next/navigation';
import { getSession } from '@/lib/gameService';
import ResultPageClient from '@/components/ResultPageClient';

type Params = Promise<{ id: string }>;

export default async function ResultPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    notFound();
  }

  return <ResultPageClient sessionId={id} />;
}
