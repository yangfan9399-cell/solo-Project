import { NextResponse } from "next/server";
import { db } from "@/db";
import { powerStations } from "@/db/schema";

export async function GET() {
  const stations = await db.select().from(powerStations).orderBy(powerStations.id);
  return NextResponse.json(stations);
}
