import { NextResponse } from "next/server";
import {
  getSessionObservations,
  recalculateSessionScore,
  getSessionResult,
  getNotebookEntries,
  addNotebookEntry,
  getSession,
} from "@/lib/gameLogic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const observations = getSessionObservations(sessionId);
  const notebook = getNotebookEntries(sessionId);
  let result = getSessionResult(sessionId);

  const session = getSession(sessionId);
  if (session && session.status === "completed" && !result) {
    result = recalculateSessionScore(sessionId);
  }

  return NextResponse.json({ observations, notebook, result });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, speciesId, content } = body;
  if (!sessionId || !speciesId || !content) {
    return NextResponse.json({ error: "sessionId, speciesId, content required" }, { status: 400 });
  }
  const entry = addNotebookEntry(sessionId, speciesId, content);
  return NextResponse.json(entry);
}
