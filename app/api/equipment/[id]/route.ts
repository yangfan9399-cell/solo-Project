import { NextRequest, NextResponse } from "next/server";
import { equipmentRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const updated = equipmentRepo.update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initSchema();
  const { id } = await params;
  const ok = equipmentRepo.remove(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
