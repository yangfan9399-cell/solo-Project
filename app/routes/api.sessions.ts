import { json } from "@remix-run/node";
import { getDb, saveDb, getOne, runInsert } from "~/lib/db";
import type { GameSession } from "~/lib/db";

export async function action({ request }: { request: Request }) {
  const db = await getDb();
  const formData = await request.formData();
  const method = request.method.toUpperCase();

  if (method === "POST") {
    const playerId = Number(formData.get("playerId"));
    const levelId = Number(formData.get("levelId"));

    if (!playerId || !levelId) {
      return json({ error: "缺少玩家编号或关卡编号" }, { status: 400 });
    }

    const id = runInsert(db, "INSERT INTO game_sessions (player_id, level_id, status) VALUES (?, ?, 'in_progress')", [playerId, levelId]);
    saveDb(db);
    return json({ id }, { status: 201 });
  }

  if (method === "PATCH") {
    const id = Number(formData.get("id"));
    const annotationsJson = formData.get("annotations_json") as string;
    const elapsedSeconds = Number(formData.get("elapsed_seconds"));

    if (!id) {
      return json({ error: "缺少局次编号" }, { status: 400 });
    }

    const session = getOne<GameSession>(db, "SELECT * FROM game_sessions WHERE id = ?", [id]);
    if (!session) {
      return json({ error: "局次不存在" }, { status: 404 });
    }

    if (session.status !== "in_progress") {
      return json({ error: "该局次已结算，不可修改" }, { status: 409 });
    }

    db.run(
      "UPDATE game_sessions SET annotations_json = ?, elapsed_seconds = ? WHERE id = ?",
      [annotationsJson ?? session.annotations_json, elapsedSeconds || session.elapsed_seconds, id]
    );

    const operationType = formData.get("operation_type") as string | null;
    const annotationAfterJson = formData.get("annotation_after_json") as string | null;

    if (operationType && annotationAfterJson) {
      const annotationBeforeJson = formData.get("annotation_before_json") as string | null;
      db.run(
        "INSERT INTO operation_history (session_id, operation_type, annotation_before_json, annotation_after_json) VALUES (?, ?, ?, ?)",
        [id, operationType, annotationBeforeJson, annotationAfterJson]
      );
    }

    saveDb(db);
    const updated = getOne<GameSession>(db, "SELECT * FROM game_sessions WHERE id = ?", [id]);
    return json(updated);
  }

  return json({ error: "不支持的请求方法" }, { status: 405 });
}
