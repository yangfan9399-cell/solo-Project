import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, filterProjects, getAllTags } from '@/lib/storage';
import type { ProjectFilter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || undefined;
    const status = searchParams.get('status') || 'all';
    const hasAbnormalParam = searchParams.get('hasAbnormal');
    const tag = searchParams.get('tag') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const hasAbnormal: boolean | 'all' =
      hasAbnormalParam === 'all' ? 'all' :
      hasAbnormalParam === 'true' ? true :
      hasAbnormalParam === 'false' ? false : 'all';

    const filter: ProjectFilter = {
      keyword,
      status: status as any,
      hasAbnormal,
      tag,
      dateFrom,
      dateTo,
    };

    const projects = filterProjects(filter);
    const tags = getAllTags();

    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        total: projects.length,
        tags,
        stats: {
          draft: projects.filter((p) => p.status === 'draft').length,
          review: projects.filter((p) => p.status === 'review').length,
          approved: projects.filter((p) => p.status === 'approved').length,
          rejected: projects.filter((p) => p.status === 'rejected').length,
          abnormal: projects.filter((p) => p.hasAbnormalData).length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { createProject } = await import('@/lib/storage');
    const project = createProject(body);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
