import { NextRequest, NextResponse } from "next/server";
import { anomaliesRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  await initSchema();
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity") || undefined;
  let list = anomaliesRepo.listAll();
  if (severity) list = list.filter((a) => a.severity === severity);
  return NextResponse.json(list);
}
