import { NextRequest, NextResponse } from "next/server";
import { pointsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  return NextResponse.json(pointsRepo.listByArchive(id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const created = pointsRepo.create({ archiveId: id, ...body });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  pointsRepo.clearByArchive(id);
  return NextResponse.json({ ok: true });
}
