import { APIEvent } from "@solidjs/start/server";
import {
  getActiveSession,
  createSession,
  getPlayerProfile
} from "~/server/fileStore";
import type { GameState } from "~/types/game";

interface CreateSessionRequest {
  levelId: string;
  gameState: GameState;
}

export async function GET({ request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const levelId = url.searchParams.get("levelId");

    if (!levelId) {
      return new Response(JSON.stringify({ error: "levelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const profile = getPlayerProfile();
    const session = getActiveSession(profile.id, levelId);

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get session error:", error);
    return new Response(JSON.stringify({ error: "Failed to get session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    const body: CreateSessionRequest = await request.json();

    if (!body.levelId || !body.gameState) {
      return new Response(JSON.stringify({ error: "levelId and gameState are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const profile = getPlayerProfile();
    const session = createSession(profile.id, body.levelId, body.gameState);

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Create session error:", error);
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
