import { NextResponse } from "next/server";
import { archivesRepo, versionsRepo, anomaliesRepo, pointsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET() {
  await initSchema();
  const archives = archivesRepo.list();
  const allAnomalies = anomaliesRepo.listAll();

  const byBowType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalDrawWeight = 0;
  let totalBraceHeight = 0;
  let totalArrowWeight = 0;

  for (const a of archives) {
    byBowType[a.bowType] = (byBowType[a.bowType] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    totalDrawWeight += Number(a.drawWeight || 0);
    totalBraceHeight += Number(a.braceHeight || 0);
    totalArrowWeight += Number(a.arrowWeight || 0);
  }

  const n = archives.length || 1;

  const bySeverity: Record<string, number> = {};
  const byField: Record<string, number> = {};
  for (const a of allAnomalies) {
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    byField[a.field] = (byField[a.field] || 0) + 1;
  }

  const allVersions = archives.flatMap((a) => versionsRepo.listByArchive(a.id));
  const byBatch: Record<string, number> = {};
  for (const v of allVersions) {
    byBatch[v.batchCode] = (byBatch[v.batchCode] || 0) + 1;
  }

  let totalArrows = 0;
  let totalScore = 0;
  for (const a of archives) {
    const pts = pointsRepo.listByArchive(a.id);
    totalArrows += pts.length;
    totalScore += pts.reduce((s, p) => s + p.score, 0);
  }

  const recentVersions = allVersions
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)
    .map((v) => ({
      id: v.id,
      archiveId: v.archiveId,
      versionNumber: v.versionNumber,
      batchCode: v.batchCode,
      changeLog: v.changeLog || v.changeNote || v.label || "",
      createdBy: v.createdBy || v.label || "系统记录",
      createdAt: v.createdAt,
      archiveName: archives.find((a) => a.id === v.archiveId)?.name ?? "",
    }));

  return NextResponse.json({
    archivesTotal: archives.length,
    byBowType,
    byStatus,
    avgDrawWeight: Number((totalDrawWeight / n).toFixed(1)),
    avgBraceHeight: Number((totalBraceHeight / n).toFixed(2)),
    avgArrowWeight: Number((totalArrowWeight / n).toFixed(0)),
    anomalyStats: { total: allAnomalies.length, bySeverity, byField },
    versionStats: { total: allVersions.length, batchCount: Object.keys(byBatch).length, byBatch },
    targetStats: { totalArrows, totalScore, avgScore: totalArrows > 0 ? Number((totalScore / totalArrows).toFixed(2)) : 0 },
    recentVersions,
  });
}
