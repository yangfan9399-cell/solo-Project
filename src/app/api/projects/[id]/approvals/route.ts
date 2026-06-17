import { NextRequest, NextResponse } from 'next/server';
import { addApproval } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const signature = addApproval(id, body);
    if (!signature) {
      return NextResponse.json(
        { success: false, error: '项目不存在或该角色已签署' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: signature }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
