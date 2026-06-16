import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const levelIdParam = searchParams.get("levelId");
  const limitParam = searchParams.get("limit");

  if (!levelIdParam) {
    return NextResponse.json({ error: "缺少关卡ID" }, { status: 400 });
  }

  const levelId = parseInt(levelIdParam, 10);
  if (isNaN(levelId)) {
    return NextResponse.json({ error: "无效的关卡ID" }, { status: 400 });
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  const entries = await getLeaderboard(levelId, isNaN(limit) ? 10 : limit);
  return NextResponse.json(entries);
}
