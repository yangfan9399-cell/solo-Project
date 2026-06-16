import { json } from "@sveltejs/kit";
import { p as playersDb } from "../../../../chunks/db.js";
const GET = async () => {
  const players = playersDb.getAll();
  return json(players);
};
const POST = async ({ request }) => {
  const body = await request.json();
  const { name } = body;
  if (!name || name.trim().length === 0) {
    return json({ error: "玩家名称不能为空" }, { status: 400 });
  }
  const newPlayer = {
    id: `player-${Date.now()}`,
    name: name.trim(),
    createdAt: Date.now(),
    totalGames: 0,
    totalWins: 0,
    bestScore: 0
  };
  playersDb.create(newPlayer);
  return json(newPlayer, { status: 201 });
};
export {
  GET,
  POST
};
