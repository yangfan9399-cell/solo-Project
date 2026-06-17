import { NextResponse } from 'next/server';
import { getRecipeById, addRecipeVersion } from '@/lib/data-store';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const recipe = await getRecipeById(params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ versions: recipe.versions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const body = await request.json();
    const version = await addRecipeVersion(params.id, body);
    if (!version) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create version', details: String(error) },
      { status: 500 }
    );
  }
}
