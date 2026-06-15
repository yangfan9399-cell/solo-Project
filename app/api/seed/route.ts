import { NextResponse } from "next/server";
import { getDb, resetDb } from "@/lib/db";
import {
  createNewSession,
  recordObservation,
  recalculateSessionScore,
  getSession,
  updateSession,
} from "@/lib/gameLogic";
import { SPECIES, POOL_LOCATIONS, TOTAL_STEPS, getTideLevelAtStep, getTidePhaseAtStep } from "@/lib/gameData";

export async function POST() {
  try {
    resetDb();
    const db = getDb();

    for (const sp of SPECIES) {
      db.prepare(
        `INSERT OR IGNORE INTO species (id, type, name, emoji, description, preferred_tide, min_tide_level, max_tide_level, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        sp.id, sp.type, sp.name, sp.emoji, sp.description,
        JSON.stringify(sp.preferredTide), sp.minTideLevel, sp.maxTideLevel, sp.rarity
      );
    }

    for (const pool of POOL_LOCATIONS) {
      db.prepare(
        `INSERT OR IGNORE INTO pool_locations (id, name, emoji, description, species_ids, eco_sensitivity)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(pool.id, pool.name, pool.emoji, pool.description, JSON.stringify(pool.speciesIds), pool.ecoSensitivity);
    }

    const scenario1 = () => {
      const session = createNewSession();
      const observations = [
        { step: 0, pool: "pool-north", species: "crab-red", trampled: false, note: "退潮时在岩缝中发现红螯相手蟹" },
        { step: 1, pool: "pool-south", species: "crab-hermit", trampled: false, note: "沙底水洼里的寄居蟹" },
        { step: 2, pool: "pool-north", species: "fish-tidepool", trampled: false },
        { step: 3, pool: "pool-north", species: "anemone-green", trampled: false, note: "触手开始伸展" },
        { step: 4, pool: "pool-south", species: "anemone-green", trampled: true },
        { step: 5, pool: "pool-east", species: "fish-clown", trampled: false },
        { step: 6, pool: "pool-east", species: "anemone-pink", trampled: false, note: "高潮时盛开的粉色海葵" },
        { step: 7, pool: "pool-south", species: "anemone-green", trampled: false },
      ];
      for (const obs of observations) {
        session.timeStep = obs.step;
        session.currentTideLevel = getTideLevelAtStep(obs.step, TOTAL_STEPS);
        session.currentTidePhase = getTidePhaseAtStep(obs.step, TOTAL_STEPS);
        session.route.push(obs.pool);
        if (!session.visitedPools.includes(obs.pool)) session.visitedPools.push(obs.pool);
        if (obs.trampled) session.tramplingCount += 1;
        recordObservation({
          sessionId: session.id,
          poolId: obs.pool,
          speciesId: obs.species,
          tideLevel: session.currentTideLevel,
          tidePhase: session.currentTidePhase,
          timeStep: obs.step,
          trampled: obs.trampled,
          note: obs.note,
        });
      }
      session.timeStep = TOTAL_STEPS;
      session.status = "completed";
      updateSession(session);
      recalculateSessionScore(session.id);
    };

    const scenario2 = () => {
      const session = createNewSession();
      const observations = [
        { step: 0, pool: "pool-west", species: "crab-red", trampled: false, note: "西礁的螃蟹也很多" },
        { step: 2, pool: "pool-west", species: "anemone-green", trampled: false },
        { step: 4, pool: "pool-west", species: "anemone-green", trampled: true },
        { step: 6, pool: "pool-east", species: "anemone-pink", trampled: false, note: "终于等到粉色海葵" },
        { step: 7, pool: "pool-east", species: "fish-clown", trampled: true },
      ];
      for (const obs of observations) {
        session.timeStep = obs.step;
        session.currentTideLevel = getTideLevelAtStep(obs.step, TOTAL_STEPS);
        session.currentTidePhase = getTidePhaseAtStep(obs.step, TOTAL_STEPS);
        session.route.push(obs.pool);
        if (!session.visitedPools.includes(obs.pool)) session.visitedPools.push(obs.pool);
        if (obs.trampled) session.tramplingCount += 1;
        recordObservation({
          sessionId: session.id,
          poolId: obs.pool,
          speciesId: obs.species,
          tideLevel: session.currentTideLevel,
          tidePhase: session.currentTidePhase,
          timeStep: obs.step,
          trampled: obs.trampled,
          note: obs.note,
        });
      }
      session.timeStep = TOTAL_STEPS;
      session.status = "completed";
      updateSession(session);
      recalculateSessionScore(session.id);
    };

    const scenario3 = () => {
      const session = createNewSession();
      const observations = [
        { step: 0, pool: "pool-south", species: "crab-hermit", trampled: false, note: "第一只寄居蟹！" },
        { step: 1, pool: "pool-north", species: "crab-red", trampled: false, note: "岩缝中的红蟹" },
        { step: 2, pool: "pool-north", species: "fish-tidepool", trampled: true },
        { step: 3, pool: "pool-west", species: "crab-red", trampled: false, note: "西礁也有红蟹" },
        { step: 4, pool: "pool-west", species: "anemone-green", trampled: false },
        { step: 5, pool: "pool-south", species: "anemone-green", trampled: true, note: "踩坏了一只绿海葵" },
        { step: 6, pool: "pool-east", species: "anemone-pink", trampled: false },
        { step: 7, pool: "pool-east", species: "fish-clown", trampled: false, note: "小丑雀鲷真漂亮" },
      ];
      for (const obs of observations) {
        session.timeStep = obs.step;
        session.currentTideLevel = getTideLevelAtStep(obs.step, TOTAL_STEPS);
        session.currentTidePhase = getTidePhaseAtStep(obs.step, TOTAL_STEPS);
        session.route.push(obs.pool);
        if (!session.visitedPools.includes(obs.pool)) session.visitedPools.push(obs.pool);
        if (obs.trampled) session.tramplingCount += 1;
        recordObservation({
          sessionId: session.id,
          poolId: obs.pool,
          speciesId: obs.species,
          tideLevel: session.currentTideLevel,
          tidePhase: session.currentTidePhase,
          timeStep: obs.step,
          trampled: obs.trampled,
          note: obs.note,
        });
      }
      session.timeStep = TOTAL_STEPS;
      session.status = "completed";
      updateSession(session);
      recalculateSessionScore(session.id);
    };

    scenario1();
    scenario2();
    scenario3();

    return NextResponse.json({ success: true, message: "三个种子场景已初始化" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
