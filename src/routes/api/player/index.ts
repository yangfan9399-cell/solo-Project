import type { RequestHandler } from "@builder.io/qwik-city";
import { createPlayer, getPlayer } from "~/lib/server/db";

export const onGet: RequestHandler = async ({ query, json }) => {
  const id = query.get("id") || "";
  const player = getPlayer(id);
  if (!player) {
    json(404, { success: false, error: "Player not found" });
    return;
  }
  json(200, { success: true, player });
};

export const onPost: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name : "匿名玩家";
  const player = createPlayer(name);
  json(200, { success: true, player });
};
