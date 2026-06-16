import { json } from "@sveltejs/kit";
import { g as gamesDb, p as playersDb, l as levelsDb } from "../../../../chunks/db.js";
import { c as createInitialGameState } from "../../../../chunks/engine.js";
import { g as generateId } from "../../../../chunks/seed.js";
const GET = async ({ url }) => {
  const playerId = url.searchParams.get("playerId");
  let games;
  if (playerId) {
    games = gamesDb.getByPlayerId(playerId);
  } else {
    games = gamesDb.getAll();
  }
  return json(games);
};
const POST = async ({ request }) => {
  const body = await request.json();
  const { playerId, levelId } = body;
  if (!playerId || !levelId) {
    return json({ error: "缺少 playerId 或 levelId" }, { status: 400 });
  }
  const player = playersDb.getById(playerId);
  if (!player) {
    return json({ error: "玩家不存在" }, { status: 404 });
  }
  const level = levelsDb.getById(levelId);
  if (!level) {
    return json({ error: "关卡不存在" }, { status: 404 });
  }
  const initialState = createInitialGameState(playerId, level);
  const game = {
    ...initialState,
    id: generateId()
  };
  gamesDb.create(game);
  playersDb.update(playerId, {
    totalGames: player.totalGames + 1
  });
  return json(game, { status: 201 });
};
export {
  GET,
  POST
};
