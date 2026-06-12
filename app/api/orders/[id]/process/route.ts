import { NextResponse } from "next/server";
import { processOrder } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.actualExecuteTime) {
      body.actualExecuteTime = new Date(body.actualExecuteTime);
    }
    const result = await processOrder(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理失败" },
      { status: 400 }
    );
  }
}
