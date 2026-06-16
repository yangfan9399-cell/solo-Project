import { APIEvent } from "@solidjs/start/server";
import { getGameHistory, getLevelHistory } from "~/server/fileStore";

export async function GET({ request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const levelId = url.searchParams.get("levelId");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    let history;
    if (levelId) {
      history = getLevelHistory(levelId);
    } else {
      history = getGameHistory();
    }

    return new Response(
      JSON.stringify({
        count: history.length,
        entries: history.slice(0, Math.min(limit, 100))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
