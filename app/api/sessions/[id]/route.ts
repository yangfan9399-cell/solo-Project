import { NextResponse } from 'next/server';
import { getSession, getTapeDetails, completeSession, getResultRecords } from '@/lib/gameService';

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const tapes = getTapeDetails(id);
    const results = getResultRecords(id);
    return NextResponse.json({ session, tapes, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_: Request, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const completed = completeSession(id);
    return NextResponse.json({ session: completed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
