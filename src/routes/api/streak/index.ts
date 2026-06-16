import type { RequestHandler } from "@builder.io/qwik-city";
import { getStreakDays, getSessionsByPlayer } from "~/lib/server/db";

export const onGet: RequestHandler = async ({ query, json }) => {
  const playerId = query.get("playerId") || "";
  const type = query.get("type") || "streak";

  if (type === "history") {
    const sessions = getSessionsByPlayer(playerId);
    const streakInfo = getStreakDays(playerId);
    json(200, { success: true, sessions, streak: streakInfo });
    return;
  }

  const streakInfo = getStreakDays(playerId);
  json(200, { success: true, streak: streakInfo });
};
