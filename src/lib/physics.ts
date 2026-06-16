import type { PaperSegment, Point, Level, PhysicsResult } from "@/types/game";

interface SegmentForce {
  segmentId: string;
  tension: number;
  compression: number;
  maxStress: number;
  stressRatio: number;
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getFoldStrengthMultiplier(foldType: string): number {
  switch (foldType) {
    case "flat":
      return 1.0;
    case "valley":
      return 1.4;
    case "mountain":
      return 1.3;
    case "tube":
      return 2.2;
    case "triangle":
      return 1.9;
    default:
      return 1.0;
  }
}

function getFoldEffectiveWidth(foldType: string, paperWidth: number): number {
  switch (foldType) {
    case "flat":
      return paperWidth;
    case "valley":
      return paperWidth * 0.9;
    case "mountain":
      return paperWidth * 0.85;
    case "tube":
      return paperWidth * 0.4;
    case "triangle":
      return paperWidth * 0.5;
    default:
      return paperWidth;
  }
}

function calculateSectionModulus(
  foldType: string,
  paperWidth: number,
  paperThickness: number
): number {
  const t = paperThickness;
  const w = paperWidth;

  switch (foldType) {
    case "flat":
      return (w * t ** 2) / 6;
    case "tube": {
      const r = w / (2 * Math.PI);
      return Math.PI * r ** 3 * t / r;
    }
    case "triangle": {
      const side = w / 3;
      return (side * t ** 2) / 6 * 3;
    }
    case "valley":
    case "mountain":
      return (w * t ** 2) / 6 * 1.5;
    default:
      return (w * t ** 2) / 6;
  }
}

function segmentMidpoint(seg: PaperSegment): Point {
  return {
    x: (seg.start.x + seg.end.x) / 2,
    y: (seg.start.y + seg.end.y) / 2,
  };
}

function getLoadDistribution(
  segments: PaperSegment[],
  totalWeight: number
): { segmentId: string; load: number; loadPoint: Point }[] {
  const result: { segmentId: string; load: number; loadPoint: Point }[] = [];

  const horizontalSegments = segments.filter((s) => {
    const angle = Math.abs(Math.atan2(s.end.y - s.start.y, s.end.x - s.start.x));
    return angle < Math.PI / 4;
  });

  if (horizontalSegments.length === 0) {
    return result;
  }

  const totalLength = horizontalSegments.reduce((sum, s) => sum + s.length, 0);
  const weightPerLength = totalWeight / totalLength;

  for (const seg of horizontalSegments) {
    const load = weightPerLength * seg.length;
    result.push({
      segmentId: seg.id,
      load,
      loadPoint: segmentMidpoint(seg),
    });
  }

  return result;
}

function calculateBendingStress(
  seg: PaperSegment,
  load: number,
  level: Level
): number {
  const effectiveWidth = getFoldEffectiveWidth(seg.foldType, level.paperWidth);
  const sectionModulus = calculateSectionModulus(
    seg.foldType,
    effectiveWidth,
    level.paperThickness
  );

  const span = seg.length;
  const bendingMoment = (load * 9.81 * span) / 8;

  const bendingStress = sectionModulus > 0 ? bendingMoment / sectionModulus : Infinity;

  return bendingStress / 1000;
}

function isBridgeConnected(
  segments: PaperSegment[],
  leftAnchor: Point,
  rightAnchor: Point
): { connected: boolean; hasLeft: boolean; hasRight: boolean } {
  if (segments.length === 0) {
    return { connected: false, hasLeft: false, hasRight: false };
  }

  const anchorThreshold = 15;

  const startPoints = segments.map((s) => s.start);
  const endPoints = segments.map((s) => s.end);
  const allPoints = [...startPoints, ...endPoints];

  function pointNearAnchor(p: Point, anchor: Point): boolean {
    return distance(p, anchor) < anchorThreshold;
  }

  const hasLeft = allPoints.some((p) => pointNearAnchor(p, leftAnchor));
  const hasRight = allPoints.some((p) => pointNearAnchor(p, rightAnchor));

  const visited = new Set<string>();
  const queue: PaperSegment[] = [];

  for (const seg of segments) {
    if (pointNearAnchor(seg.start, leftAnchor) || pointNearAnchor(seg.end, leftAnchor)) {
      queue.push(seg);
      visited.add(seg.id);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentPoints = [current.start, current.end];

    for (const seg of segments) {
      if (visited.has(seg.id)) continue;

      const segPoints = [seg.start, seg.end];
      let connected = false;

      for (const cp of currentPoints) {
        for (const sp of segPoints) {
          if (distance(cp, sp) < 10) {
            connected = true;
            break;
          }
        }
        if (connected) break;
      }

      if (connected) {
        visited.add(seg.id);
        queue.push(seg);
      }
    }
  }

  const reachableFromLeft = visited.size > 0;
  let reachesRight = false;

  for (const segId of visited) {
    const seg = segments.find((s) => s.id === segId);
    if (seg) {
      if (pointNearAnchor(seg.start, rightAnchor) || pointNearAnchor(seg.end, rightAnchor)) {
        reachesRight = true;
        break;
      }
    }
  }

  return {
    connected: reachableFromLeft && reachesRight,
    hasLeft,
    hasRight,
  };
}

export function simulateBridge(
  segments: PaperSegment[],
  level: Level
): PhysicsResult {
  const connection = isBridgeConnected(segments, level.leftAnchor, level.rightAnchor);

  if (!connection.connected || segments.length === 0) {
    return {
      success: false,
      maxWeight: 0,
      breakPoint: null,
      breakSegmentId: null,
      stressMap: [],
    };
  }

  const segmentForces: SegmentForce[] = segments.map((seg) => ({
    segmentId: seg.id,
    tension: 0,
    compression: 0,
    maxStress: 0,
    stressRatio: 0,
  }));

  let currentWeight = 0;
  const weightStep = 1;
  let failedSegmentId: string | null = null;
  let failed = false;

  const foldMultMap = new Map(segments.map((s) => [s.id, getFoldStrengthMultiplier(s.foldType)]));

  while (!failed && currentWeight < level.targetWeight * 3) {
    currentWeight += weightStep;

    const loads = getLoadDistribution(segments, currentWeight);

    for (const seg of segments) {
      const segLoad = loads.find((l) => l.segmentId === seg.id)?.load || 0;
      const stress = calculateBendingStress(seg, segLoad, level);

      const foldMult = foldMultMap.get(seg.id) || 1;
      const effectiveStrength = level.paperStrength * foldMult * 1000;

      const segForce = segmentForces.find((f) => f.segmentId === seg.id)!;
      segForce.maxStress = stress;
      segForce.stressRatio = stress / effectiveStrength;

      if (segForce.stressRatio >= 1.0) {
        failed = true;
        failedSegmentId = seg.id;
        break;
      }
    }
  }

  const maxWeight = failed ? currentWeight - weightStep : currentWeight;
  const success = maxWeight >= level.targetWeight;

  let breakPoint: Point | null = null;
  if (failedSegmentId) {
    const failedSeg = segments.find((s) => s.id === failedSegmentId);
    if (failedSeg) {
      breakPoint = {
        x: (failedSeg.start.x + failedSeg.end.x) / 2,
        y: (failedSeg.start.y + failedSeg.end.y) / 2 - 5,
      };
    }
  }

  const stressMap = segmentForces.map((sf) => ({
    segmentId: sf.segmentId,
    maxStress: sf.maxStress,
  }));

  return {
    success,
    maxWeight: Math.round(maxWeight * 10) / 10,
    breakPoint,
    breakSegmentId: failedSegmentId,
    stressMap,
  };
}

export function calculateScore(
  maxWeight: number,
  paperUsed: number,
  level: Level
): number {
  if (maxWeight === 0) return 0;

  const weightScore = Math.max(0, Math.round(maxWeight * 10));

  const efficiencyRatio = level.maxPaperLength / Math.max(paperUsed, 1);
  const efficiencyBonus = Math.round(weightScore * (efficiencyRatio - 1) * 0.5);

  const targetRatio = maxWeight / level.targetWeight;
  const targetBonus = targetRatio >= 1 ? Math.round(level.targetWeight * 5) : 0;

  const totalScore = weightScore + Math.max(0, efficiencyBonus) + targetBonus;

  return Math.max(0, totalScore);
}

export function validateBridgeDesign(
  segments: PaperSegment[],
  level: Level
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (segments.length === 0) {
    errors.push("桥梁还没有任何构件");
  }

  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  if (totalLength > level.maxPaperLength + 0.1) {
    errors.push(
      `纸张长度超出限制：使用了 ${totalLength.toFixed(1)}mm / 限制 ${level.maxPaperLength}mm`
    );
  }

  const connection = isBridgeConnected(segments, level.leftAnchor, level.rightAnchor);
  if (!connection.hasLeft) {
    errors.push("桥梁没有连接到左侧桥墩");
  }
  if (!connection.hasRight) {
    errors.push("桥梁没有连接到右侧桥墩");
  }
  if (!connection.connected && segments.length > 0) {
    warnings.push("桥梁结构可能不连通，部分构件无法传递力量");
  }

  for (const seg of segments) {
    if (seg.length < 5) {
      warnings.push(`有一段纸太短了（${seg.length.toFixed(1)}mm），可能难以折叠`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
