import { json } from "@sveltejs/kit";
import { p as playersDb } from "../../../../../chunks/db.js";
const GET = async ({ params }) => {
  const player = playersDb.getById(params.id);
  if (!player) {
    return json({ error: "玩家不存在" }, { status: 404 });
  }
  return json(player);
};
const PATCH = async ({ params, request }) => {
  const body = await request.json();
  const updated = playersDb.update(params.id, body);
  if (!updated) {
    return json({ error: "玩家不存在" }, { status: 404 });
  }
  return json(updated);
};
export {
  GET,
  PATCH
};
