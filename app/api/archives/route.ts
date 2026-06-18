import { NextRequest, NextResponse } from "next/server";
import { archivesRepo, anomaliesRepo } from "@/lib/repo";
import { detectAnomalies } from "@/lib/anomaly";
import { initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  await initSchema();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const bowType = searchParams.get("bowType") || undefined;
  const search = searchParams.get("search") || undefined;
  const data = archivesRepo.list({ status, bowType, search });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const body = await req.json();
  const created = archivesRepo.create(body);
  const anomalies = detectAnomalies(created);
  anomaliesRepo.clearByArchive(created.id);
  for (const a of anomalies) {
    anomaliesRepo.create({ archiveId: created.id, ...a });
  }
  return NextResponse.json(created, { status: 201 });
}
