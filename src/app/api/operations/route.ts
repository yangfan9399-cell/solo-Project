import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { recordOperation, getSessionOperations, getNextSequence } from '@/lib/repositories';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId query parameter is required' }, { status: 400 });
    }
    const operations = getSessionOperations(sessionId);
    return NextResponse.json(operations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list operations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { sessionId, type, pieceId, beforeState, afterState } = body;
    if (!sessionId || !type || !pieceId) {
      return NextResponse.json({ error: 'sessionId, type, and pieceId are required' }, { status: 400 });
    }
    const sequence = getNextSequence(sessionId);
    const operation = recordOperation({
      sessionId,
      type,
      pieceId,
      beforeState: beforeState ?? '',
      afterState: afterState ?? '',
      timestamp: Date.now(),
      sequence,
    });
    return NextResponse.json(operation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record operation' }, { status: 500 });
  }
}
