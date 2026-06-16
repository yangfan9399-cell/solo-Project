import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getSession, updateSessionProgress, completeSession } from '@/lib/repositories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.status) {
      completeSession(id, body.status);
    } else {
      const { score, stability, piecesPlaced, hintsUsed, undosUsed } = body;
      updateSessionProgress(id, score, stability, piecesPlaced, hintsUsed, undosUsed);
    }
    const updated = getSession(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
