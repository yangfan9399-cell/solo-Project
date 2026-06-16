import { APIEvent } from "@solidjs/start/server";
import {
  updateSessionState,
  completeSession,
  abandonSession
} from "~/server/fileStore";
import type { GameState, HistoryAction, GameSession } from "~/types/game";

interface UpdateSessionRequest {
  gameState: GameState;
  history: HistoryAction[];
}

export async function PUT({ request, params }: APIEvent) {
  try {
    const body: UpdateSessionRequest = await request.json();
    const sessionId = params.id;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!body.gameState || !body.history) {
      return new Response(JSON.stringify({ error: "gameState and history are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const session = updateSessionState(sessionId, body.gameState, body.history);

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Update session error:", error);
    return new Response(JSON.stringify({ error: "Failed to update session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function DELETE({ request, params }: APIEvent) {
  try {
    const sessionId = params.id;
    const url = new URL(request.url);
    const complete = url.searchParams.get("complete") === "true";

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let session: GameSession | null;
    if (complete) {
      session = completeSession(sessionId);
    } else {
      session = abandonSession(sessionId);
    }

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Delete session error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
