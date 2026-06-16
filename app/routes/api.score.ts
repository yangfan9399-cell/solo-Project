import { json, type ActionFunctionArgs } from "@remix-run/node";
import { computeScore, computeHeatmap, getExhibitLightLevel, isExhibitSafe } from "~/gameLogic";
import { getAllExhibitDefs, getLevel, getSession } from "~/repo.server";
import type { LightSource, PlacedExhibit } from "~/types";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const sessionId = form.get("sessionId") as string;
  const exhibitsRaw = form.get("exhibits") as string;
  const lightsRaw = form.get("lights") as string;

  if (!sessionId) {
    return json({ error: "缺少 sessionId" }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return json({ error: "局次不存在" }, { status: 404 });
  }

  const level = getLevel(session.levelId);
  if (!level) {
    return json({ error: "关卡不存在" }, { status: 404 });
  }

  const exhibitDefs = getAllExhibitDefs();

  const exhibits: PlacedExhibit[] = exhibitsRaw
    ? JSON.parse(exhibitsRaw)
    : session.exhibits;
  const lights: LightSource[] = lightsRaw
    ? JSON.parse(lightsRaw)
    : session.lights;

  const score = computeScore(exhibits, lights, level, exhibitDefs);
  const heatmap = computeHeatmap(lights, level.gridW, level.gridH);

  const exhibitDetails = exhibits.map((ex) => {
    const def = exhibitDefs[ex.defId];
    if (!def) return { id: ex.id, lightLevel: 0, safe: false, safetyScore: 0, defId: ex.defId };
    const lightLevel = getExhibitLightLevel(ex, heatmap, def);
    const { safe, score: safetyScore } = isExhibitSafe(lightLevel, def);
    return { id: ex.id, defId: ex.defId, lightLevel: Math.round(lightLevel), safe, safetyScore: Math.round(safetyScore) };
  });

  return json({
    score,
    heatmap: heatmap.map((row) => row.map((c) => Math.round(c.intensity))),
    exhibitDetails,
    targetScore: level.targetScore,
  });
}
