import { NextRequest, NextResponse } from "next/server";
import { versionsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  await initSchema();
  const { archiveId } = await params;
  return NextResponse.json(await versionsRepo.listByArchive(archiveId));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  await initSchema();
  const { archiveId } = await params;
  const body = await req.json();
  const created = await versionsRepo.create({ ...body, archiveId });
  return NextResponse.json(created, { status: 201 });
}
