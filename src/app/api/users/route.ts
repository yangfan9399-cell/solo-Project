import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || undefined;

  let result;
  if (role) {
    result = await db
      .select()
      .from(users)
      .where(eq(users.role, role as any))
      .orderBy(users.id);
  } else {
    result = await db.select().from(users).orderBy(users.id);
  }

  return NextResponse.json(result);
}
