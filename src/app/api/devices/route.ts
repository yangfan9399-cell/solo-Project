import { NextResponse } from "next/server";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId")
    ? parseInt(searchParams.get("stationId")!)
    : undefined;

  let result;
  if (stationId) {
    result = await db
      .select()
      .from(devices)
      .where(eq(devices.stationId, stationId))
      .orderBy(devices.id);
  } else {
    result = await db.select().from(devices).orderBy(devices.id);
  }

  return NextResponse.json(result);
}
