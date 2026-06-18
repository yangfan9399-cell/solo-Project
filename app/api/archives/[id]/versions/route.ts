import { NextRequest, NextResponse } from "next/server";
import { versionsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  return NextResponse.json(versionsRepo.listByArchive(id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const created = versionsRepo.create({ archiveId: id, ...body });
  return NextResponse.json(created, { status: 201 });
}
