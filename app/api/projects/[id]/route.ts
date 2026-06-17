import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject, getRecipesByProject } from '@/lib/data-store';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const project = await getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const recipes = await getRecipesByProject(params.id);
    return NextResponse.json({ project, recipes });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const body = await request.json();
    const project = await updateProject(params.id, body);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const success = await deleteProject(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete project', details: String(error) },
      { status: 500 }
    );
  }
}
