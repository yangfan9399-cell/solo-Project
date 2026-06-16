import { NextResponse } from "next/server";
import {
  getLevel,
  getGameSession,
  finishGameSession,
  updatePlayerScore,
  addLeaderboardEntry,
  getPlayer,
} from "@/lib/queries";
import {
  simulateBridge,
  calculateScore,
  validateBridgeDesign,
} from "@/lib/physics";
import type { Bridge, Level } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, bridge, clientScore, clientMaxWeight } = body;

    if (!sessionId || !bridge) {
      return NextResponse.json(
        { error: "缺少必要参数：sessionId 和 bridge 是必填项" },
        { status: 400 }
      );
    }

    const session = await getGameSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "游戏会话不存在" }, { status: 404 });
    }

    const level = await getLevel(session.levelId);
    if (!level) {
      return NextResponse.json({ error: "关卡不存在" }, { status: 404 });
    }

    const validation = validateBridgeDesign(
      (bridge as Bridge).segments,
      level as Level
    );
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "桥梁设计无效",
          validationErrors: validation.errors,
          serverScore: 0,
          serverMaxWeight: 0,
        },
        { status: 400 }
      );
    }

    const physicsResult = simulateBridge(
      (bridge as Bridge).segments,
      level as Level
    );

    const totalPaperLength = (bridge as Bridge).segments.reduce(
      (sum, s) => sum + s.length,
      0
    );
    const serverScore = calculateScore(
      physicsResult.maxWeight,
      totalPaperLength,
      level as Level
    );

    const status = physicsResult.success ? "success" : "failed";

    await finishGameSession(
      sessionId,
      status as "success" | "failed",
      physicsResult.maxWeight,
      physicsResult.breakPoint,
      physicsResult.breakSegmentId,
      serverScore
    );

    if (serverScore > 0) {
      await updatePlayerScore(
        session.playerId,
        serverScore,
        physicsResult.success
      );

      const player = await getPlayer(session.playerId);
      if (player) {
        await addLeaderboardEntry(
          player.name,
          session.levelId,
          serverScore,
          physicsResult.maxWeight
        );
      }
    }

    const scoreDiff = serverScore - (clientScore || 0);
    const weightDiff = physicsResult.maxWeight - (clientMaxWeight || 0);

    return NextResponse.json({
      serverScore,
      serverMaxWeight: physicsResult.maxWeight,
      breakPoint: physicsResult.breakPoint,
      breakSegmentId: physicsResult.breakSegmentId,
      success: physicsResult.success,
      stressMap: physicsResult.stressMap,
      validated: true,
      scoreDiff,
      weightDiff,
      status,
    });
  } catch (error) {
    console.error("Score validation error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
