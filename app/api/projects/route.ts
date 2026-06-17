import { NextResponse } from 'next/server';
import { getAllProjects, createProject, searchProjects } from '@/lib/data-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  try {
    const projects = query ? await searchProjects(query) : await getAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await createProject(body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project', details: String(error) },
      { status: 500 }
    );
  }
}
