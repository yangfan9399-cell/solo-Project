import { json } from "@remix-run/node";
import { getDb, saveDb, getAll, getOne, runInsert } from "~/lib/db";
import type { Player } from "~/lib/db";

export async function loader() {
  const db = await getDb();
  const players = getAll<Player>(db, "SELECT * FROM players ORDER BY created_at DESC");
  return json(players);
}

export async function action({ request }: { request: Request }) {
  const db = await getDb();
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return json({ error: "请输入工程师代号" }, { status: 400 });
  }

  const existing = getOne<Player>(db, "SELECT * FROM players WHERE name = ?", [name]);
  if (existing) {
    return json(existing);
  }

  const id = runInsert(db, "INSERT INTO players (name) VALUES (?)", [name]);
  saveDb(db);
  const player = getOne<Player>(db, "SELECT * FROM players WHERE id = ?", [id]);
  return json(player, { status: 201 });
}
