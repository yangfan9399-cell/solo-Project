import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { listLevels } from '@/lib/repositories';

export async function GET() {
  try {
    await initDb();
    const levels = listLevels();
    return NextResponse.json(levels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list levels' }, { status: 500 });
  }
}
