import { NextRequest, NextResponse } from "next/server";
import { anomaliesRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  await initSchema();
  const { archiveId } = await params;
  return NextResponse.json(await anomaliesRepo.listByArchive(archiveId));
}
