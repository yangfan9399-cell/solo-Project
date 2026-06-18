import { NextRequest, NextResponse } from "next/server";
import { pointsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  await initSchema();
  const { archiveId } = await params;
  return NextResponse.json(await pointsRepo.listByArchive(archiveId));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  await initSchema();
  const { archiveId } = await params;
  const body = await req.json();
  if (Array.isArray(body)) {
    await pointsRepo.clearByArchive(archiveId);
    const created: any[] = [];
    for (const p of body) {
      created.push(await pointsRepo.create({ ...p, archiveId }));
    }
    return NextResponse.json(created, { status: 201 });
  }
  const created = await pointsRepo.create({ ...body, archiveId });
  return NextResponse.json(created, { status: 201 });
}
