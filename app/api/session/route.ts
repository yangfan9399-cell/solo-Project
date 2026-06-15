import { NextResponse } from "next/server";
import { createNewSession, getSession } from "@/lib/gameLogic";

export async function POST() {
  const session = createNewSession();
  return NextResponse.json(session);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
