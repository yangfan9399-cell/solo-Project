import { NextResponse } from "next/server";
import { getRecoveryTasks, completeRecoveryTask, recalculateSessionScore, getSession } from "@/lib/gameLogic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const tasks = getRecoveryTasks(sessionId);
  const session = getSession(sessionId);
  return NextResponse.json({ tasks, session });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { taskId, sessionId, recalculate = false } = body;
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  const task = completeRecoveryTask(taskId);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  let result = null;
  if (recalculate && sessionId) {
    const session = getSession(sessionId);
    if (session && session.status === "completed") {
      result = recalculateSessionScore(sessionId);
    }
  }

  return NextResponse.json({ task, result });
}
