import { NextRequest, NextResponse } from "next/server";
import { archivesRepo, anomaliesRepo } from "@/lib/repo";
import { detectAnomalies } from "@/lib/anomaly";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const archive = archivesRepo.get(id);
  if (!archive) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(archive);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const updated = archivesRepo.update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const anomalies = detectAnomalies(updated);
  anomaliesRepo.clearByArchive(id);
  for (const a of anomalies) {
    anomaliesRepo.create({ archiveId: id, ...a });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const ok = archivesRepo.remove(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
