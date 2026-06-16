import { json } from "@remix-run/node";
import { getDb, getAll } from "~/lib/db";
import type { OperationHistory } from "~/lib/db";

export async function loader({ request }: { request: Request }) {
  const db = await getDb();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return json({ error: "缺少局次编号" }, { status: 400 });
  }

  const history = getAll<OperationHistory>(db, "SELECT * FROM operation_history WHERE session_id = ? ORDER BY created_at ASC", [Number(sessionId)]);
  return json(history);
}
