import { NextResponse } from 'next/server';
import { getVersionById, addSpecimen, updateSpecimen } from '@/lib/data-store';

export async function GET(_request: Request, context: { params: Promise<{ id: string; versionId: string }> }) {
  const params = await context.params;
  try {
    const version = await getVersionById(params.id, params.versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    return NextResponse.json({ specimens: version.specimens });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch specimens', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string; versionId: string }> }) {
  const params = await context.params;
  try {
    const body = await request.json();
    const specimen = await addSpecimen(params.id, params.versionId, body);
    if (!specimen) {
      return NextResponse.json({ error: 'Recipe or version not found' }, { status: 404 });
    }
    return NextResponse.json({ specimen }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create specimen', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; versionId: string }> }) {
  const params = await context.params;
  try {
    const { specimenId, ...updates } = await request.json();
    const specimen = await updateSpecimen(params.id, params.versionId, specimenId, updates);
    if (!specimen) {
      return NextResponse.json({ error: 'Specimen not found' }, { status: 404 });
    }
    return NextResponse.json({ specimen });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update specimen', details: String(error) },
      { status: 500 }
    );
  }
}
