import { NextResponse } from "next/server";
import { getPlayer, createOrUpdatePlayer } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("id");

  if (!playerId) {
    return NextResponse.json({ error: "缺少玩家ID" }, { status: 400 });
  }

  const player = await getPlayer(playerId);
  if (!player) {
    return NextResponse.json({ error: "玩家不存在" }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, avatar } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const player = await createOrUpdatePlayer(id, name, avatar);
    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
