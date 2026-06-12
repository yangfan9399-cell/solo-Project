import { NextResponse } from "next/server";
import { reopenOrder } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await reopenOrder(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "重新处理失败" },
      { status: 400 }
    );
  }
}
