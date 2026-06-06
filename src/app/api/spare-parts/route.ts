import { NextResponse } from "next/server";
import { db } from "@/db";
import { spareParts } from "@/db/schema";

export async function GET() {
  const parts = await db.select().from(spareParts).orderBy(spareParts.id);
  return NextResponse.json(parts);
}
