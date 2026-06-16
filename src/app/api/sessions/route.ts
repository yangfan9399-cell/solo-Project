import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { createSession, listPlayerSessions } from '@/lib/repositories';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    if (!playerId) {
      return NextResponse.json({ error: 'playerId query parameter is required' }, { status: 400 });
    }
    const sessions = listPlayerSessions(playerId);
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { playerId, levelId } = body;
    if (!playerId || levelId == null) {
      return NextResponse.json({ error: 'playerId and levelId are required' }, { status: 400 });
    }
    const session = createSession(playerId, Number(levelId));
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
