import { NextResponse } from "next/server";
import { getSession, updateSession, recordObservation } from "@/lib/gameLogic";
import { POOL_LOCATIONS, getTideLevelAtStep, getTidePhaseAtStep, getVisibleSpeciesAtPool } from "@/lib/gameData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, poolId, trampled = false, note } = body;

    if (!sessionId || !poolId) {
      return NextResponse.json({ error: "sessionId and poolId required" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 });
    }
    if (session.timeStep >= session.totalSteps) {
      return NextResponse.json({ error: "Session has ended" }, { status: 400 });
    }
    if (!POOL_LOCATIONS.find((p) => p.id === poolId)) {
      return NextResponse.json({ error: "Invalid pool" }, { status: 400 });
    }

    const tideLevel = getTideLevelAtStep(session.timeStep, session.totalSteps);
    const tidePhase = getTidePhaseAtStep(session.timeStep, session.totalSteps);
    const visibleSpecies = getVisibleSpeciesAtPool(poolId, tideLevel, tidePhase);

    const recordedObservations = [];
    for (const speciesId of visibleSpecies) {
      const obs = recordObservation({
        sessionId,
        poolId,
        speciesId,
        tideLevel,
        tidePhase,
        timeStep: session.timeStep,
        trampled,
        note: note && recordedObservations.length === 0 ? note : undefined,
      });
      recordedObservations.push(obs);
    }

    const pool = POOL_LOCATIONS.find((p) => p.id === poolId)!;
    session.route.push(poolId);
    if (!session.visitedPools.includes(poolId)) {
      session.visitedPools.push(poolId);
    }
    if (trampled) {
      session.tramplingCount += 1;
      session.ecoScore = Math.max(0, session.ecoScore - pool.ecoSensitivity * 3);
    }
    session.researchPoints += visibleSpecies.length * 10;
    session.timeStep += 1;

    if (session.timeStep >= session.totalSteps) {
      session.status = "completed";
      session.currentTideLevel = getTideLevelAtStep(session.totalSteps, session.totalSteps);
      session.currentTidePhase = getTidePhaseAtStep(session.totalSteps, session.totalSteps);
    } else {
      session.currentTideLevel = getTideLevelAtStep(session.timeStep, session.totalSteps);
      session.currentTidePhase = getTidePhaseAtStep(session.timeStep, session.totalSteps);
    }

    updateSession(session);

    return NextResponse.json({
      session,
      observations: recordedObservations,
      visibleSpecies,
      noteApplied: !!note,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
