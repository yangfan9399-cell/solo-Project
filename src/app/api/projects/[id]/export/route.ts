import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, generateExportSummary, saveExportToFile } from '@/lib/storage';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') as 'json' | 'txt') || 'json';
    const download = searchParams.get('download') === 'true';

    const project = getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    const summary = generateExportSummary(project, '当前用户');
    const filepath = saveExportToFile(summary, format);

    if (download && format === 'txt') {
      const text = fs.readFileSync(filepath, 'utf-8');
      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${summary.project.code}-summary.txt"`,
        },
      });
    }

    if (download && format === 'json') {
      const data = fs.readFileSync(filepath, 'utf-8');
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${summary.project.code}-summary.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: summary,
      filepath,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
