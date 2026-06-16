import type { Level } from './db.server';

export interface Submission {
  subtitleText: string;
  fontStyle: string;
  fontSize: number;
  timingStart: number;
  timingEnd: number;
}

export interface ScoreBreakdown {
  textAccuracy: number;
  timingAccuracy: number;
  styleMatch: number;
  readability: number;
  total: number;
  details: {
    textSimilarity: number;
    timingOverlap: number;
    fontStyleMatch: boolean;
    fontSizeDiff: number;
    durationRatio: number;
  };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function textSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.max(0, 100 - (distance / maxLen) * 100);
}

function calculateTimingOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): number {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapDuration = Math.max(0, overlapEnd - overlapStart);
  const targetDuration = end2 - start2;
  if (targetDuration === 0) return 0;
  return (overlapDuration / targetDuration) * 100;
}

export function calculateScore(
  submission: Submission,
  level: Level
): ScoreBreakdown {
  const textSim = textSimilarity(
    submission.subtitleText.trim(),
    level.target_text.trim()
  );

  const timingOverlap = calculateTimingOverlap(
    submission.timingStart,
    submission.timingEnd,
    level.target_timing_start,
    level.target_timing_end
  );

  const fontStyleMatch = submission.fontStyle === level.target_font_style;
  const fontSizeDiff = Math.abs(submission.fontSize - level.target_font_size);

  const submissionDuration = submission.timingEnd - submission.timingStart;
  const targetDuration = level.target_timing_end - level.target_timing_start;
  const durationRatio =
    targetDuration > 0
      ? Math.min(submissionDuration, targetDuration) /
        Math.max(submissionDuration, targetDuration)
      : 0;

  const textAccuracy = Math.round(textSim * 0.4);

  const timingAccuracy = Math.round(timingOverlap * 0.3);

  let styleMatch = 0;
  if (fontStyleMatch) {
    styleMatch += 12;
  }
  const fontSizeScore = Math.max(0, 100 - fontSizeDiff * 2.5);
  styleMatch += Math.round(fontSizeScore * 0.18);

  let readability = 0;
  const textLength = submission.subtitleText.length;
  if (textLength > 0 && textLength <= 80) {
    readability += 5;
  }
  if (durationRatio >= 0.6 && durationRatio <= 1.4) {
    readability += 5;
  }
  if (submission.fontSize >= 24 && submission.fontSize <= 72) {
    readability += 5;
  }
  if (submission.timingStart >= 0 && submission.timingEnd <= level.duration) {
    readability += 5;
  }

  const total = Math.min(
    100,
    Math.max(0, textAccuracy + timingAccuracy + styleMatch + readability)
  );

  return {
    textAccuracy,
    timingAccuracy,
    styleMatch,
    readability,
    total,
    details: {
      textSimilarity: Math.round(textSim * 10) / 10,
      timingOverlap: Math.round(timingOverlap * 10) / 10,
      fontStyleMatch,
      fontSizeDiff,
      durationRatio: Math.round(durationRatio * 100) / 100
    }
  };
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function isPassing(score: number, minScore: number): boolean {
  return score >= minScore;
}
