import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getLevel, getLevelPieces, getLevelCracks } from '@/lib/repositories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const levelId = Number(id);
    const level = getLevel(levelId);
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }
    const pieces = getLevelPieces(levelId);
    const cracks = getLevelCracks(levelId);
    return NextResponse.json({ ...level, pieces, cracks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get level' }, { status: 500 });
  }
}
