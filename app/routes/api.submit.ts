import { json } from "@remix-run/node";
import { getDb, saveDb, getOne, getAll } from "~/lib/db";
import type { GameSession, Level, WaferImage, DefectAnnotation, GroundTruthDefect } from "~/lib/db";
import { computeScore, isLevelPassed } from "~/lib/scoring";

export async function action({ request }: { request: Request }) {
  const db = await getDb();
  const formData = await request.formData();
  const sessionId = Number(formData.get("sessionId"));
  const submittedAnnotationsJson = formData.get("annotations_json") as string;
  const submittedElapsed = Number(formData.get("elapsed_seconds"));

  if (!sessionId) {
    return json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = getOne<GameSession>(db, "SELECT * FROM game_sessions WHERE id = ?", [sessionId]);
  if (!session) {
    return json({ error: "Session not found" }, { status: 404 });
  }

  const annotationsJson = submittedAnnotationsJson ?? session.annotations_json;
  const elapsedSeconds = submittedElapsed > 0 ? submittedElapsed : session.elapsed_seconds;

  const level = getOne<Level>(db, "SELECT * FROM levels WHERE id = ?", [session.level_id]) as Level;
  const waferImages = getAll<WaferImage>(db, "SELECT * FROM wafer_images WHERE level_id = ?", [session.level_id]);

  const annotations: DefectAnnotation[] = JSON.parse(annotationsJson || "[]");
  const allGroundTruth: GroundTruthDefect[] = waferImages.flatMap((img) => JSON.parse(img.defects_json) as GroundTruthDefect[]);

  const scoringResult = computeScore(
    annotations,
    allGroundTruth,
    level.time_limit_seconds,
    elapsedSeconds,
    level.target_precision,
    level.target_recall
  );

  const passed = isLevelPassed(scoringResult.confusion_matrix, level.target_precision, level.target_recall);
  const status = passed ? "completed" : "failed";

  const trainingSet = annotations.map((a) => ({
    type: a.type,
    x: a.x,
    y: a.y,
    width: a.width,
    height: a.height,
    level_id: level.id,
    validated: true,
  }));

  db.run(
    "UPDATE game_sessions SET score = ?, confusion_matrix_json = ?, status = ?, completed_at = datetime('now'), annotations_json = ?, elapsed_seconds = ?, training_set_json = ? WHERE id = ?",
    [scoringResult.total_score, JSON.stringify(scoringResult.confusion_matrix), status, annotationsJson, elapsedSeconds, JSON.stringify(trainingSet), sessionId]
  );
  saveDb(db);

  db.run(
    "UPDATE players SET total_score = total_score + ?, levels_completed = levels_completed + ? WHERE id = ?",
    [scoringResult.total_score, passed ? 1 : 0, session.player_id]
  );
  saveDb(db);

  return json({
    ...scoringResult,
    status,
    passed,
    training_set_count: trainingSet.length,
  });
}
