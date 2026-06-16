import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createGameSession,
  getGameSession,
  updateGameSessionBridge,
  getLevel,
} from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json({ error: "缺少会话ID" }, { status: 400 });
  }

  const session = await getGameSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, levelId } = body;

    if (!playerId || !levelId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const level = await getLevel(levelId);
    if (!level) {
      return NextResponse.json({ error: "关卡不存在" }, { status: 404 });
    }

    const sessionId = uuidv4();
    const session = await createGameSession(sessionId, playerId, levelId);

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, bridge, operations } = body;

    if (!sessionId || !bridge) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    if (session.status !== "designing") {
      return NextResponse.json(
        { error: "只能在设计阶段修改桥梁" },
        { status: 400 }
      );
    }

    await updateGameSessionBridge(sessionId, bridge, operations || []);

    const updated = await getGameSession(sessionId);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
