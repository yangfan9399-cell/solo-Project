import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getPlayer } from '@/lib/repositories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const player = getPlayer(id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get player' }, { status: 500 });
  }
}
