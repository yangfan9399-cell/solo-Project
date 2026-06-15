import { APIEvent, json } from "solid-start/api";
import { getActiveGame, persistGameState, saveGameResult } from "../../../../server/gameStore";
import { calculateSettlement } from "../../../../server/gameEngine";

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

    const beforeResult = calculateSettlement(state, "before");
    const afterResult = calculateSettlement(state, "after");

    const parseDetails = (r: any) => {
      if (typeof r.settlementDetails === "string") {
        try { return JSON.parse(r.settlementDetails); } catch {}
      }
      return r.settlementDetails || {};
    };

    const beforeDetails = parseDetails(beforeResult);
    const afterDetails = parseDetails(afterResult);

    saveGameResult(beforeResult);
    saveGameResult(afterResult);

    state.session.phase = "settled";
    state.session.updatedAt = Date.now();
    persistGameState(state);

    const beforePremium = beforeResult.premiumCount;
    const afterPremium = afterResult.premiumCount;

    return json({
      success: true,
      data: {
        before: {
          ...beforeResult,
          settlementDetails: beforeDetails,
          totalConflicts: beforeResult.conflictCount,
        },
        after: {
          ...afterResult,
          settlementDetails: afterDetails,
          totalConflicts: afterResult.conflictCount,
        },
        summary: {
          revenueDiff: afterResult.totalRevenue - beforeResult.totalRevenue,
          revenueDiffPercent: beforeResult.totalRevenue > 0
            ? Math.round(((afterResult.totalRevenue - beforeResult.totalRevenue) / beforeResult.totalRevenue) * 100)
            : 0,
          qualityDownGrade: beforePremium - afterPremium,
          conflictsLost: afterResult.conflictCount,
        },
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

    const beforeResult = calculateSettlement(state, "before");
    const afterResult = calculateSettlement(state, "after");

    const parseDetails = (r: any) => {
      if (typeof r.settlementDetails === "string") {
        try { return JSON.parse(r.settlementDetails); } catch {}
      }
      return r.settlementDetails || {};
    };

    return json({
      success: true,
      data: {
        before: {
          ...beforeResult,
          settlementDetails: parseDetails(beforeResult),
          totalConflicts: beforeResult.conflictCount,
        },
        after: {
          ...afterResult,
          settlementDetails: parseDetails(afterResult),
          totalConflicts: afterResult.conflictCount,
        },
        isSettled: state.session.phase === "settled",
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
