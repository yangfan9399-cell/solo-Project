import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/data-service";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取统计失败" },
      { status: 500 }
    );
  }
}
