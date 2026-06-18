import { NextRequest, NextResponse } from "next/server";
import { equipmentRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  await initSchema();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  return NextResponse.json(equipmentRepo.list(category));
}

export async function POST(req: NextRequest) {
  await initSchema();
  const body = await req.json();
  const created = equipmentRepo.create(body);
  return NextResponse.json(created, { status: 201 });
}
