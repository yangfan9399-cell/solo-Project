import { NextRequest, NextResponse } from "next/server";
import { anomaliesRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  return NextResponse.json(anomaliesRepo.listByArchive(id));
}
