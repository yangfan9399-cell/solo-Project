import { APIEvent, json } from "solid-start/api";
import { getActiveGame, setActiveGame, persistGameState } from "../../../../server/gameStore";
import { initGame } from "../../../../server/gameEngine";
import type { CablewayOccupancy } from "../../../../types/game";

export async function POST({ params }: APIEvent) {
  try {
    const sessionId = params.id;
    const state = getActiveGame(sessionId);
    if (!state) {
      return json(
        { success: false, error: "游戏不存在" },
        { status: 404 }
      );
    }

    const seedType = state.session.seedType;
    const sessionName = state.session.name;
    const newState = initGame(seedType as any, sessionName);
    newState.session.id = sessionId;
    newState.session.createdAt = state.session.createdAt;

    setActiveGame(newState);
    persistGameState(newState);

    return json({
      success: true,
      data: {
        message: "已回滚到剧本初始状态，可重新规划调度",
        session: newState.session,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET({ params }: APIEvent) {
  try {
    const sessionId = params.id;
    const state = getActiveGame(sessionId);
    if (!state) {
      return json(
        { success: false, error: "游戏不存在" },
        { status: 404 }
      );
    }

    const occupancy: CablewayOccupancy[] = state.cableways.map((cw) => {
      const cwBaskets = state.baskets.filter((b) => b.cableCarId === cw.id);
      const posList = cwBaskets
        .map((b) => state.basketPositions[b.id])
        .filter(Boolean);
      const currentTime = state.session.currentTime;
      const timeSlots: Record<string, number> = {};
      for (let t = currentTime; t < currentTime + 300 && t < 1080; t += 30) {
        timeSlots[`${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`] =
          posList.length;
      }
      return {
        cablewayId: cw.id,
        cablewayName: cw.name,
        totalCapacity: cw.capacity,
        currentLoad: cwBaskets.length,
        occupancyRate: cw.capacity > 0 ? cwBaskets.length / cw.capacity : 0,
        hasConflict: state.conflicts.some((c) => c.cableways.includes(cw.id)),
        basketPositions: posList.map((p) => ({
          currentY: p?.currentY || 0,
          state: p?.state || "unknown",
        })),
        timeSlots,
      };
    });

    const warnings: string[] = [];
    for (const occ of occupancy) {
      if (occ.occupancyRate >= 0.8) {
        warnings.push(`${occ.cablewayName} 占用率超过80%，易发生冲突`);
      }
      if (occ.hasConflict) {
        warnings.push(`${occ.cablewayName} 已检测到冲突！茶青正在降级`);
      }
    }

    return json({
      success: true,
      data: {
        occupancy,
        warnings,
        conflictCount: state.conflicts.length,
        totalBaskets: state.baskets.length,
        idleStations: state.stations.filter((s) => s.status === "idle").length,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
