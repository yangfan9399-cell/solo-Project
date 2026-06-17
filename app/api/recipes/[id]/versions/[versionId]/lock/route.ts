import { NextResponse } from 'next/server';
import { lockVersion, unlockVersion } from '@/lib/data-store';

export async function POST(request: Request, context: { params: Promise<{ id: string; versionId: string }> }) {
  const params = await context.params;
  try {
    const { action } = await request.json();
    let success: boolean;

    if (action === 'lock') {
      success = await lockVersion(params.id, params.versionId);
    } else if (action === 'unlock') {
      success = await unlockVersion(params.id, params.versionId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Recipe or version not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to toggle lock', details: String(error) },
      { status: 500 }
    );
  }
}
