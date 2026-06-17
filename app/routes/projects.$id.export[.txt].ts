import { type LoaderFunctionArgs } from "@remix-run/node";
import {
  getProject, getCurrentVersion, listVersions, listSections, listWaterLevels, listRoughnesses,
  listObstacles, listFlowSegments, listUnsuitableZones, listAnomalies,
} from "~/db/queries";
import { seed } from "~/db/seed";
import { computeSummary, generateTextReport } from "~/utils/report";

export async function loader({ params, request }: LoaderFunctionArgs) {
  seed();
  const id = Number(params.id);
  const project = getProject(id);
  if (!project) throw new Response("Not Found", { status: 404 });
  const url = new URL(request.url);
  const vid = Number(url.searchParams.get("vid")) || undefined;
  const versions = listVersions(id);
  const version = vid ? versions.find((v) => v.id === vid) ?? getCurrentVersion(id) : getCurrentVersion(id);
  if (!version) throw new Response("No version", { status: 500 });
  const sections = listSections(id, version.id);
  const sectionIds = sections.map((s) => s.id);
  const waterLevelsBySection: Record<number, any[]> = {};
  const roughnessBySection: Record<number, any[]> = {};
  const obstaclesBySection: Record<number, any[]> = {};
  const segmentsBySection: Record<number, any[]> = {};
  const zonesBySection: Record<number, any[]> = {};
  for (const sid of sectionIds) {
    waterLevelsBySection[sid] = listWaterLevels(sid);
    roughnessBySection[sid] = listRoughnesses(sid);
    obstaclesBySection[sid] = listObstacles(sid);
    segmentsBySection[sid] = listFlowSegments(sid);
    zonesBySection[sid] = listUnsuitableZones(sid);
  }
  const allSegments = sections.flatMap((s) => segmentsBySection[s.id] ?? []);
  const allZones = sections.flatMap((s) => zonesBySection[s.id] ?? []);
  const anomalies = listAnomalies(id, version.id);
  const summary = computeSummary(allSegments, allZones);
  const text = generateTextReport({
    project, version, sections,
    waterLevelsBySection, roughnessBySection, obstaclesBySection,
    segmentsBySection, zonesBySection, anomalies, summary,
    generated_at: new Date().toISOString(),
  });
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.code}-${version.version_tag}-report.txt"`,
    },
  });
}
