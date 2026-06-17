import { NextResponse } from 'next/server';
import { getAllRecipes, createRecipe, searchRecipes } from '@/lib/data-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const projectId = searchParams.get('projectId') || undefined;
  const status = searchParams.get('status') || undefined;
  const tagsParam = searchParams.get('tags');
  const tags = tagsParam ? tagsParam.split(',') : undefined;

  try {
    const recipes = query || projectId || status || tags
      ? await searchRecipes(query, { projectId, status, tags })
      : await getAllRecipes();
    return NextResponse.json({ recipes });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipes', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recipe = await createRecipe(body);
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create recipe', details: String(error) },
      { status: 500 }
    );
  }
}
