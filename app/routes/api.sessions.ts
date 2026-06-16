import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  addOperation,
  completeSession,
  createSession,
  deleteSession,
  getPlayerSessions,
  getSession,
  getSessionOperations,
  updateSessionScore,
  updateSessionState,
} from "~/repo.server";
import { v4 as uuid } from "uuid";
import type {
  LightSource,
  OperationType,
  PlacedExhibit,
} from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const playerId = url.searchParams.get("playerId");
  const withOps = url.searchParams.get("ops") === "1";

  if (id) {
    const session = getSession(id);
    if (!session) return json({ session: null }, { status: 404 });
    if (withOps) {
      const operations = getSessionOperations(id);
      return json({ session, operations });
    }
    return json({ session });
  }

  if (playerId) {
    const sessions = getPlayerSessions(playerId);
    return json({ sessions });
  }

  return json({ sessions: [] });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "create") {
    const playerId = form.get("playerId") as string;
    const levelId = form.get("levelId") as string;
    if (!playerId || !levelId) {
      return json({ error: "缺少参数" }, { status: 400 });
    }
    const session = createSession(playerId, levelId);
    return json({ session });
  }

  if (intent === "apply") {
    const sessionId = form.get("sessionId") as string;
    const opType = form.get("opType") as OperationType;
    const exhibitsRaw = form.get("exhibits") as string;
    const lightsRaw = form.get("lights") as string;
    const opDataRaw = form.get("opData") as string;

    if (!sessionId || !exhibitsRaw || !lightsRaw) {
      return json({ error: "缺少参数" }, { status: 400 });
    }

    const exhibits = JSON.parse(exhibitsRaw) as PlacedExhibit[];
    const lights = JSON.parse(lightsRaw) as LightSource[];
    const opData = opDataRaw ? JSON.parse(opDataRaw) : {};

    updateSessionState(sessionId, exhibits, lights);
    if (opType) {
      addOperation(sessionId, opType, opData);
    }

    return json({ ok: true });
  }

  if (intent === "complete") {
    const sessionId = form.get("sessionId") as string;
    const status = form.get("status") as "completed" | "failed";
    const scoreStr = form.get("score") as string;
    const score = parseInt(scoreStr, 10) || 0;
    if (!sessionId || !status) {
      return json({ error: "缺少参数" }, { status: 400 });
    }
    completeSession(sessionId, status, score);
    return json({ ok: true });
  }

  if (intent === "delete") {
    const sessionId = form.get("sessionId") as string;
    if (!sessionId) return json({ error: "缺少参数" }, { status: 400 });
    deleteSession(sessionId);
    return json({ ok: true });
  }

  if (intent === "setScore") {
    const sessionId = form.get("sessionId") as string;
    const scoreStr = form.get("score") as string;
    const score = parseInt(scoreStr, 10) || 0;
    if (!sessionId) return json({ error: "缺少参数" }, { status: 400 });
    updateSessionScore(sessionId, score);
    return json({ ok: true });
  }

  return json({ error: "未知操作" }, { status: 400 });
}
