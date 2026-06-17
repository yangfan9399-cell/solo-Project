import { NextResponse } from 'next/server';
import { getRecipeById, updateRecipe } from '@/lib/data-store';
import { validateRecipeComponents, validateFiringParams } from '@/lib/data-store';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const recipe = await getRecipeById(params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipe', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const body = await request.json();
    const recipe = await updateRecipe(params.id, body);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update recipe', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const { type, ...data } = await request.json();

    if (type === 'validate') {
      const componentIssues = data.components ? validateRecipeComponents(data.components) : [];
      const firingIssues = data.temperature && data.cone
        ? validateFiringParams(data.temperature, data.cone)
        : [];
      return NextResponse.json({
        issues: [...componentIssues, ...firingIssues],
      });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed', details: String(error) },
      { status: 500 }
    );
  }
}
