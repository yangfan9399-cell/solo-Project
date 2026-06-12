import { NextResponse } from "next/server";
import { archiveOrder } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await archiveOrder(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "归档失败" },
      { status: 400 }
    );
  }
}
