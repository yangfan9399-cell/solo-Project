import type { RequestHandler } from "@builder.io/qwik-city";
import { calculateStopCombinationScore } from "~/lib/server/scoring";
import { readGameData } from "~/lib/server/db";

export const onPost: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const targetStops = Array.isArray(body.targetStops) ? (body.targetStops as string[]) : [];
  const playerStops = Array.isArray(body.playerStops) ? (body.playerStops as string[]) : [];
  const timeTaken = typeof body.timeTaken === "string" ? parseFloat(body.timeTaken) : typeof body.timeTaken === "number" ? body.timeTaken : 30;
  const levelId = typeof body.levelId === "string" ? parseInt(body.levelId) : typeof body.levelId === "number" ? body.levelId : 1;
  const hintUsed = body.hintUsed === "true" || body.hintUsed === true;

  const gameData = readGameData();
  const level = gameData.levels.find((l) => l.id === levelId);
  const timeLimit = level?.timeLimit || 60;
  const difficulty = level?.difficulty || 1;

  const result = calculateStopCombinationScore(
    targetStops,
    playerStops,
    timeTaken,
    timeLimit,
    difficulty,
    hintUsed
  );

  json(200, { success: true, result });
};
