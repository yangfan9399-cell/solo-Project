import { NextResponse } from 'next/server';
import { getAllSeeds } from '@/lib/seeds';

export async function GET() {
  try {
    const seeds = getAllSeeds();
    return NextResponse.json({ seeds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
