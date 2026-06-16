import type { DefectAnnotation, GroundTruthDefect, ConfusionMatrix, ScoringResult } from "./db";

export function computeIoU(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (intersection === 0) return 0;

  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

export function computeConfusionMatrix(
  annotations: DefectAnnotation[],
  groundTruth: GroundTruthDefect[],
  iouThreshold: number = 0.3
): ConfusionMatrix {
  let tp = 0;
  let fp = 0;
  let fn = 0;

  const matchedGT = new Set<number>();

  for (const ann of annotations) {
    let bestIoU = 0;
    let bestGTIdx = -1;

    for (let i = 0; i < groundTruth.length; i++) {
      if (matchedGT.has(i)) continue;
      if (ann.type !== groundTruth[i].type) continue;

      const iou = computeIoU(ann, groundTruth[i]);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestGTIdx = i;
      }
    }

    if (bestIoU >= iouThreshold && bestGTIdx >= 0) {
      tp++;
      matchedGT.add(bestGTIdx);
    } else {
      fp++;
    }
  }

  fn = groundTruth.length - matchedGT.size;

  const totalCells = 10 * 10;
  const tn = totalCells - tp - fp - fn;

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { tp, fp, fn, tn: Math.max(0, tn), precision, recall, f1 };
}

export function computeScore(
  annotations: DefectAnnotation[],
  groundTruth: GroundTruthDefect[],
  timeLimitSeconds: number,
  elapsedSeconds: number,
  targetPrecision: number,
  target_recall: number
): ScoringResult {
  const matrix = computeConfusionMatrix(annotations, groundTruth);

  const baseScore = Math.round(matrix.f1 * 1000);

  const precisionBonus = matrix.precision >= targetPrecision
    ? Math.round((matrix.precision - targetPrecision) * 500)
    : 0;

  const recallBonus = matrix.recall >= target_recall
    ? Math.round((matrix.recall - target_recall) * 500)
    : 0;

  const timeRatio = Math.max(0, 1 - elapsedSeconds / timeLimitSeconds);
  const timeBonus = Math.round(timeRatio * 200);

  const totalScore = baseScore + precisionBonus + recallBonus + timeBonus;

  return {
    base_score: baseScore,
    precision_bonus: precisionBonus,
    recall_bonus: recallBonus,
    f1_score: Math.round(matrix.f1 * 100) / 100,
    time_bonus: timeBonus,
    total_score: totalScore,
    confusion_matrix: matrix,
  };
}

export function isLevelPassed(
  matrix: ConfusionMatrix,
  targetPrecision: number,
  targetRecall: number
): boolean {
  return matrix.precision >= targetPrecision && matrix.recall >= targetRecall;
}
