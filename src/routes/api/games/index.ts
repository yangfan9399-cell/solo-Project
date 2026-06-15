import { APIEvent, json } from "solid-start/api";
import { initGame } from "../../../server/gameEngine";
import { setActiveGame, persistGameState, listSessions } from "../../../server/gameStore";
import type { SeedType } from "../../../types/game";

export async function GET() {
  try {
    const sessions = listSessions();
    return json({ success: true, data: sessions });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const seedType = (body.seedType || "normal") as SeedType;
    const name = body.name;

    if (!["normal", "exception", "rollback"].includes(seedType)) {
      return json(
        { success: false, error: "无效的种子类型" },
        { status: 400 }
      );
    }

    const state = initGame(seedType, name);
    setActiveGame(state);
    persistGameState(state);

    return json({
      success: true,
      data: {
        sessionId: state.session.id,
        session: state.session,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
