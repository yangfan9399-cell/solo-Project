import { json } from "@sveltejs/kit";
import { g as gamesDb } from "../../../../../chunks/db.js";
const GET = async ({ params }) => {
  const game = gamesDb.getById(params.id);
  if (!game) {
    return json({ error: "游戏不存在" }, { status: 404 });
  }
  return json(game);
};
const PATCH = async ({ params, request }) => {
  const body = await request.json();
  const updated = gamesDb.update(params.id, body);
  if (!updated) {
    return json({ error: "游戏不存在" }, { status: 404 });
  }
  return json(updated);
};
export {
  GET,
  PATCH
};
