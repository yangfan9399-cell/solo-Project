import { NextResponse } from "next/server";
import { getAllLevels, getLevel } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get("id");

  if (levelId) {
    const id = parseInt(levelId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的关卡ID" }, { status: 400 });
    }

    const level = await getLevel(id);
    if (!level) {
      return NextResponse.json({ error: "关卡不存在" }, { status: 404 });
    }
    return NextResponse.json(level);
  }

  const levels = await getAllLevels();
  return NextResponse.json(levels);
}
