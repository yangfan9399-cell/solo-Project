import { notFound, redirect } from 'next/navigation';
import { getSession, getTapeDetails } from '@/lib/gameService';
import { getAllSeeds } from '@/lib/seeds';
import RepairWorkbench from '@/components/RepairWorkbench';

type Params = Promise<{ id: string }>;

export default async function SessionPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    notFound();
  }

  if (session.status === 'completed') {
    redirect(`/session/${id}/result`);
  }

  const tapes = getTapeDetails(id);
  const seeds = getAllSeeds();

  let seedHint: string | undefined;
  for (const seed of seeds) {
    if (tapes.length === seed.tapes.length &&
        tapes.every((t, i) => t.label === seed.tapes[i].label)) {
      seedHint = seed.hint;
      break;
    }
  }

  return (
    <RepairWorkbench
      initialSession={{
        id: session.id,
        label: session.label,
        batchDescription: session.batchDescription,
        tapeCount: session.tapeCount,
        status: session.status,
        startedAt: session.startedAt,
      }}
      initialTapes={tapes as any}
      initialSeedHint={seedHint}
    />
  );
}
