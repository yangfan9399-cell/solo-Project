import { NextRequest, NextResponse } from 'next/server';
import { createVersion, revertToVersion } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { changeLog, createdBy } = await req.json();
    const version = createVersion(id, changeLog || '保存版本', createdBy || '当前用户');
    if (!version) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { version } = await req.json();
    const project = revertToVersion(id, version);
    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目或版本不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
