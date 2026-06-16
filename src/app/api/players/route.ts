import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listPlayers, createPlayer } from '@/lib/repositories';

export async function GET() {
  try {
    await initDb();
    const players = listPlayers();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list players' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { name, avatar } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const player = createPlayer(name, avatar);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
