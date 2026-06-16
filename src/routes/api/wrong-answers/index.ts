import type { RequestHandler } from "@builder.io/qwik-city";
import {
  getWrongAnswersByPlayer,
  markWrongAnswerReviewed,
} from "~/lib/server/db";

export const onGet: RequestHandler = async ({ query, json }) => {
  const playerId = query.get("playerId") || "";
  const limitStr = query.get("limit") || "50";
  const limit = parseInt(limitStr);
  const wrongAnswers = getWrongAnswersByPlayer(playerId, limit);
  json(200, { success: true, wrongAnswers });
};

export const onPatch: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const wrongId = typeof body.wrongId === "string" ? body.wrongId : "";
  const result = markWrongAnswerReviewed(wrongId);
  if (!result) {
    json(404, { success: false, error: "Wrong answer not found" });
    return;
  }
  json(200, { success: true, wrongAnswer: result });
};
