import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getSession, getLevel, getLevelPieces, getLevelCracks, getSessionOperations, completeSession, insertScoreRecord, insertRepairReport, updatePlayerStats, getPlayer, getScoreBySession, getReportBySession } from '@/lib/repositories';
import { calculateScore, generateRepairReport } from '@/lib/scoring';
import type { PlacedPieceState } from '@/lib/types';

function rebuildPlacedStates(operations: { type: string; pieceId: string; afterState: string }[]): PlacedPieceState[] {
  const stateMap = new Map<string, PlacedPieceState>();
  for (const op of operations) {
    try {
      const after: PlacedPieceState = JSON.parse(op.afterState);
      stateMap.set(op.pieceId, after);
    } catch {
      continue;
    }
  }
  return Array.from(stateMap.values());
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status === 'completed') {
      const existingScore = getScoreBySession(id);
      const existingReport = getReportBySession(id);
      const updatedPlayer = getPlayer(session.playerId);
      return NextResponse.json({
        scoreRecord: existingScore,
        repairReport: existingReport,
        player: updatedPlayer,
      });
    }

    const level = getLevel(session.levelId);
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const pieces = getLevelPieces(session.levelId);
    const cracks = getLevelCracks(session.levelId);
    const operations = getSessionOperations(id);
    const placedStates = rebuildPlacedStates(operations);

    const elapsedMs = Date.now() - session.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    const scoreResult = calculateScore({
      level,
      pieces,
      cracks,
      placedStates,
      elapsedSeconds,
      hintsUsed: session.hintsUsed,
      undosUsed: session.undosUsed,
      stability: session.stability,
    });

    const reportData = generateRepairReport({
      level,
      pieces,
      cracks,
      placedStates,
      stability: session.stability,
    });

    const now = Date.now();
    const scoreRecord = insertScoreRecord({
      sessionId: id,
      playerId: session.playerId,
      levelId: session.levelId,
      finalScore: scoreResult.final,
      accuracyBonus: scoreResult.accuracyBonus,
      speedBonus: scoreResult.speedBonus,
      stabilityBonus: scoreResult.stabilityBonus,
      layerBonus: scoreResult.layerBonus,
      deduction: scoreResult.deduction,
      rank: scoreResult.rank,
      createdAt: now,
    });

    const repairReport = insertRepairReport({
      sessionId: id,
      playerId: session.playerId,
      levelId: session.levelId,
      overallCondition: reportData.overallCondition,
      cracksRepaired: reportData.cracksRepaired,
      cracksRemaining: reportData.cracksRemaining,
      pieceIntegrity: reportData.pieceIntegrity,
      alignmentAccuracy: reportData.alignmentAccuracy,
      stabilityIndex: reportData.stabilityIndex,
      historicalValue: reportData.historicalValue,
      comment: reportData.comment,
      createdAt: now,
    });

    completeSession(id, 'completed');

    const isPerfect = scoreResult.rank === 'S';
    updatePlayerStats(
      session.playerId,
      scoreResult.final,
      true,
      session.piecesPlaced,
      isPerfect
    );

    const updatedPlayer = getPlayer(session.playerId);

    return NextResponse.json({
      scoreRecord,
      repairReport,
      player: updatedPlayer,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}
