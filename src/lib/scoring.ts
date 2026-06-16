import type { PlacedPieceState, ScoreRecord, RepairReport, Level, Crack, PuzzlePiece } from './types';

export interface ScoreCalculationInput {
  level: Level;
  pieces: PuzzlePiece[];
  cracks: Crack[];
  placedStates: PlacedPieceState[];
  elapsedSeconds: number;
  hintsUsed: number;
  undosUsed: number;
  stability: number;
}

export interface ScoreResult {
  base: number;
  accuracyBonus: number;
  speedBonus: number;
  stabilityBonus: number;
  layerBonus: number;
  deduction: number;
  final: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

export function calculateScore(input: ScoreCalculationInput): ScoreResult {
  const { level, pieces, cracks, placedStates, elapsedSeconds, hintsUsed, undosUsed, stability } = input;

  const base = level.baseScore;

  const totalPieces = pieces.length;
  const placedPieces = placedStates.filter(s => s.isPlaced);

  let correctCount = 0;
  let rotationPenalty = 0;
  for (const piece of pieces) {
    const state = placedStates.find(s => s.pieceId === piece.id);
    if (!state || !state.isPlaced) continue;

    const posCorrect = state.row === piece.row && state.col === piece.col && state.layer === piece.layer;
    if (posCorrect) {
      correctCount++;
      const rotDiff = Math.abs((state.rotation % 360) - (piece.baseRotation % 360));
      const normalizedRotDiff = Math.min(rotDiff, 360 - rotDiff);
      rotationPenalty += normalizedRotDiff / 90;
    }
  }

  const accuracy = totalPieces > 0 ? correctCount / totalPieces : 0;
  const accuracyBonus = Math.floor(base * accuracy * 0.6);

  const timeLimit = level.timeLimit;
  let speedBonus = 0;
  if (accuracy >= 0.95 && elapsedSeconds <= timeLimit) {
    const remainingRatio = Math.max(0, (timeLimit - elapsedSeconds) / timeLimit);
    speedBonus = Math.floor(base * remainingRatio * 0.4);
  }

  const stabilityBonus = stability >= 80
    ? Math.floor(base * (stability / 100) * 0.2)
    : 0;

  const layerBonus = level.layers > 1
    ? Math.floor(base * (level.layers - 1) * 0.15)
    : 0;

  const hintDeduction = hintsUsed * Math.floor(base * 0.02);
  const undoDeduction = undosUsed * Math.floor(base * 0.005);
  const rotationDeduction = Math.floor(rotationPenalty * Math.floor(base * 0.01));
  const incompleteDeduction = Math.floor(base * (1 - accuracy) * 0.5);
  const deduction = hintDeduction + undoDeduction + rotationDeduction + incompleteDeduction;

  let final = base + accuracyBonus + speedBonus + stabilityBonus + layerBonus - deduction;
  final = Math.max(0, final);

  const maxPossible = base + Math.floor(base * 0.6) + Math.floor(base * 0.4) + Math.floor(base * 0.2) + Math.floor(base * 0.3);
  const ratio = final / maxPossible;

  let rank: ScoreResult['rank'];
  if (ratio >= 0.95) rank = 'S';
  else if (ratio >= 0.8) rank = 'A';
  else if (ratio >= 0.6) rank = 'B';
  else if (ratio >= 0.4) rank = 'C';
  else rank = 'D';

  return {
    base,
    accuracyBonus,
    speedBonus,
    stabilityBonus,
    layerBonus,
    deduction,
    final,
    rank
  };
}

export interface ReportCalculationInput {
  level: Level;
  pieces: PuzzlePiece[];
  cracks: Crack[];
  placedStates: PlacedPieceState[];
  stability: number;
}

export function generateRepairReport(input: ReportCalculationInput): Omit<RepairReport, 'id' | 'sessionId' | 'playerId' | 'levelId' | 'createdAt'> {
  const { level, pieces, cracks, placedStates, stability } = input;
  const totalPieces = pieces.length;
  const totalCracks = cracks.length;

  const placed = placedStates.filter(s => s.isPlaced);
  const placedIds = new Set(placed.map(s => s.pieceId));

  const correctlyPlaced = pieces.filter(p => {
    const s = placedStates.find(st => st.pieceId === p.id);
    return s && s.isPlaced && s.row === p.row && s.col === p.col && s.layer === p.layer;
  }).length;

  const pieceIntegrity = totalPieces > 0 ? (correctlyPlaced / totalPieces) * 100 : 0;

  const repairedCracks = cracks.filter(c => placedIds.has(c.pieceIdA) && placedIds.has(c.pieceIdB)).length;
  const cracksRemaining = totalCracks - repairedCracks;

  let alignmentSum = 0;
  for (const piece of pieces) {
    const state = placedStates.find(s => s.pieceId === piece.id);
    if (state && state.isPlaced) {
      const rowDiff = Math.abs(state.row - piece.row);
      const colDiff = Math.abs(state.col - piece.col);
      const layerDiff = Math.abs(state.layer - piece.layer);
      const totalDiff = rowDiff + colDiff + layerDiff;
      const maxDiff = level.gridRows + level.gridCols + level.layers;
      alignmentSum += maxDiff > 0 ? Math.max(0, 100 - (totalDiff / maxDiff) * 100) : 100;
    }
  }
  const alignmentAccuracy = placed.length > 0 ? alignmentSum / placed.length : 0;

  const stabilityIndex = stability;

  const historicalValue = (pieceIntegrity * 0.4 + alignmentAccuracy * 0.3 + stabilityIndex * 0.3);
  const overallCondition = historicalValue;

  let comment: string;
  if (overallCondition >= 90) {
    comment = `此次修复堪称典范。${level.era}时期${level.patternType}纹样的神韵完整重现，${level.location}影壁的历史价值得到了最大程度的保存。匠人精神令人钦佩！`;
  } else if (overallCondition >= 75) {
    comment = `修复质量上乘。大部分${level.patternType}纹样拼接准确，影壁整体结构稳固。细微之处仍有提升空间，已记录供后续参考。`;
  } else if (overallCondition >= 60) {
    comment = `修复工作合格。主要纹样已恢复，裂缝处理基本到位。建议对细节部位进行二次加固以提升整体稳定性。`;
  } else if (overallCondition >= 40) {
    comment = `修复初步完成，但${level.patternType}纹样存在错位，部分裂缝未能完全弥合。需组织进一步评估和返工。`;
  } else {
    comment = `修复未能达到保存标准。${level.era}风格的纹样大面积错位，影壁结构稳定度不足。建议重新分析碎片分组后再试。`;
  }

  return {
    overallCondition: Math.round(overallCondition * 100) / 100,
    cracksRepaired: repairedCracks,
    cracksRemaining,
    pieceIntegrity: Math.round(pieceIntegrity * 100) / 100,
    alignmentAccuracy: Math.round(alignmentAccuracy * 100) / 100,
    stabilityIndex: Math.round(stabilityIndex * 100) / 100,
    historicalValue: Math.round(historicalValue * 100) / 100,
    comment
  };
}

export function calculateStability(
  pieces: PuzzlePiece[],
  placedStates: PlacedPieceState[],
  cracks: Crack[]
): number {
  const total = pieces.length;
  if (total === 0) return 0;

  const placed = placedStates.filter(s => s.isPlaced);
  const placedRatio = placed.length / total;

  const correctlyPlaced = placed.filter(s => {
    const piece = pieces.find(p => p.id === s.pieceId);
    return piece && s.row === piece.row && s.col === piece.col && s.layer === piece.layer;
  });
  const accuracyRatio = placed.length > 0 ? correctlyPlaced.length / placed.length : 0;

  const placedIds = new Set(placed.map(s => s.pieceId));
  const repairedCracks = cracks.filter(c => placedIds.has(c.pieceIdA) && placedIds.has(c.pieceIdB)).length;
  const crackRatio = cracks.length > 0 ? repairedCracks / cracks.length : 1;

  const groupMap = new Map<string, number>();
  for (const piece of pieces) {
    groupMap.set(piece.groupId, (groupMap.get(piece.groupId) || 0) + 1);
  }

  let groupCohesion = 0;
  const totalGroups = groupMap.size;
  if (totalGroups > 0) {
    for (const [groupId, totalCount] of groupMap.entries()) {
      const groupPieces = pieces.filter(p => p.groupId === groupId);
      const placedInGroup = groupPieces.filter(p => placedIds.has(p.id)).length;
      groupCohesion += placedInGroup / totalCount;
    }
    groupCohesion /= totalGroups;
  } else {
    groupCohesion = 1;
  }

  const stability = (
    placedRatio * 35 +
    accuracyRatio * 35 +
    crackRatio * 15 +
    (groupCohesion || 1) * 15
  );

  return Math.round(Math.max(0, Math.min(100, stability)) * 100) / 100;
}
