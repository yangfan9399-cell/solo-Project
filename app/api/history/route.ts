import { NextResponse } from "next/server";
import { getHistoricalConditions } from "@/lib/gameLogic";
import { getDb } from "@/lib/db";

export async function GET() {
  const conditions = getHistoricalConditions();

  const db = getDb();
  const sessions = db.prepare("SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 10").all() as any[];

  const parsedSessions = sessions.map((s) => ({
    id: s.id,
    createdAt: s.created_at,
    status: s.status,
    timeStep: s.time_step,
    totalSteps: s.total_steps,
    researchPoints: s.research_points,
    ecoScore: s.eco_score,
    route: JSON.parse(s.route),
  }));

  return NextResponse.json({ conditions, sessions: parsedSessions });
}
