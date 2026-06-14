import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromSeed, listAllSessions } from '@/lib/gameService';
import { getSeedById } from '@/lib/seeds';

export async function GET() {
  try {
    const sessions = await listAllSessions();
    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seedId } = await request.json();
    if (!seedId) {
      return NextResponse.json({ error: 'seedId is required' }, { status: 400 });
    }
    const seed = getSeedById(seedId);
    if (!seed) {
      return NextResponse.json({ error: 'Seed not found' }, { status: 404 });
    }
    const session = await createSessionFromSeed(seed);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
