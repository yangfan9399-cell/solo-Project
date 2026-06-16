import { json } from "@remix-run/node";
import { getDb, getAll } from "~/lib/db";
import type { Level } from "~/lib/db";

export async function loader() {
  const db = await getDb();
  const levels = getAll<Level>(db, "SELECT * FROM levels ORDER BY order_index ASC");
  return json(levels);
}
