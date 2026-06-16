import { json } from "@remix-run/node";
import { getDb, saveDb, getAll, runInsert, getOne } from "~/lib/db";
import type { Player } from "~/lib/db";

export async function loader() {
  const db = await getDb();
  const players = getAll<Player>(db, "SELECT * FROM players ORDER BY created_at DESC");
  return json(players);
}

export async function action({ request }: { request: Request }) {
  const db = await getDb();
  const formData = await request.formData();
  const name = formData.get("name") as string;

  if (!name) {
    return json({ error: "Name is required" }, { status: 400 });
  }

  const id = runInsert(db, "INSERT INTO players (name) VALUES (?)", [name]);
  saveDb(db);
  const player = getOne<Player>(db, "SELECT * FROM players WHERE id = ?", [id]);
  return json(player, { status: 201 });
}
