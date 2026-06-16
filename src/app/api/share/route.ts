import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { shareBridge, getSharedBridge, getGameSession, getPlayer } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("id");

  if (!shareId) {
    return NextResponse.json({ error: "缺少分享ID" }, { status: 400 });
  }

  const shared = await getSharedBridge(shareId);
  if (!shared) {
    return NextResponse.json({ error: "分享不存在或已过期" }, { status: 404 });
  }

  return NextResponse.json(shared);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "缺少会话ID" }, { status: 400 });
    }

    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    if (!session.bridge) {
      return NextResponse.json({ error: "该会话没有桥梁设计" }, { status: 400 });
    }

    const player = await getPlayer(session.playerId);
    const playerName = player?.name || "匿名玩家";

    const shareId = uuidv4().slice(0, 8);
    const shared = await shareBridge(
      shareId,
      session.bridge,
      session.levelId,
      session.maxWeightHeld,
      session.score,
      playerName
    );

    return NextResponse.json({
      shareId: shared.id,
      shareUrl: `/share/${shared.id}`,
      ...shared,
    });
  } catch (error) {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
