import { NextResponse } from "next/server";
import { archivesRepo, equipmentRepo, anomaliesRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET() {
  await initSchema();
  const archives = archivesRepo.list();
  const equipment = equipmentRepo.list();
  const anomalies = anomaliesRepo.listAll();

  const inUse = archives.filter((a) => a.status === "active").length;
  const archived = archives.filter((a) => a.status === "archived").length;
  const highAnomalies = anomalies.filter((a) => a.severity === "high").length;
  const avgDrawWeight =
    archives.length > 0
      ? archives.reduce((s, a) => s + Number(a.drawWeight || 0), 0) / archives.length
      : 0;

  return NextResponse.json({
    archivesTotal: archives.length,
    active: inUse,
    archived,
    anomaliesHigh: highAnomalies,
    anomaliesTotal: anomalies.length,
    equipmentTotal: equipment.length,
    avgDrawWeight: Number(avgDrawWeight.toFixed(1)),
  });
}
