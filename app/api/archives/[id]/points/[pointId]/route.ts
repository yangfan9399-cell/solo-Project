import { NextRequest, NextResponse } from "next/server";
import { pointsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  await initSchema();
  const { pointId } = await params;
  const ok = pointsRepo.remove(pointId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
