import { NextRequest, NextResponse } from "next/server";
import { versionsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

function normalizeVersion(v: any) {
  let snapObj: any = {};
  if (typeof v.snapshot === "string") {
    try { snapObj = JSON.parse(v.snapshot); } catch { snapObj = {}; }
  } else if (v.snapshot && typeof v.snapshot === "object") {
    snapObj = v.snapshot;
  }
  return {
    ...v,
    changeLog: v.changeLog ?? v.changeNote ?? v.label ?? "",
    createdBy: v.createdBy ?? v.label ?? "系统记录",
    snapshot: snapObj,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const list = versionsRepo.listByArchive(id).map(normalizeVersion);
  return NextResponse.json(list);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();

  const payload: any = {
    versionNumber: body.versionNumber ?? 1,
    batchCode: body.batchCode ?? `BATCH-${Date.now().toString(36).toUpperCase()}`,
    label: body.label ?? body.createdBy ?? "手动快照",
    changeNote: body.changeNote ?? body.changeLog ?? "",
    changeLog: body.changeLog ?? body.changeNote ?? "",
    createdBy: body.createdBy ?? "匿名",
    snapshot: typeof body.snapshot === "string" ? body.snapshot : JSON.stringify(body.snapshot ?? {}),
  };

  const created = versionsRepo.create({ archiveId: id, ...payload });
  return NextResponse.json(normalizeVersion(created), { status: 201 });
}
