import { NextResponse } from "next/server";
import { getOrderDetail } from "@/lib/data-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const order = await getOrderDetail(id);
    if (!order) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取详情失败" },
      { status: 500 }
    );
  }
}
