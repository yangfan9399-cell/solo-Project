import type { TapeDefect, WaveformAnalysis } from './types';

const WAVEFORM_LENGTH = 200;

export function generateOriginalWaveform(seed: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < WAVEFORM_LENGTH; i++) {
    const t = i / WAVEFORM_LENGTH;
    let value = 0;
    value += 0.5 * Math.sin(2 * Math.PI * (3 + seed * 0.7) * t);
    value += 0.3 * Math.sin(2 * Math.PI * (7 + seed * 1.3) * t);
    value += 0.2 * Math.sin(2 * Math.PI * (11 + seed * 0.9) * t);
    if (i > 50 && i < 80) value += 0.3;
    if (i > 120 && i < 160) value += 0.25 * Math.sin(2 * Math.PI * 15 * t);
    waveform.push(Math.max(-1, Math.min(1, value)));
  }
  return waveform;
}

export function applyDefects(
  waveform: number[],
  defects: TapeDefect[],
  seed: number
): {
  waveform: number[];
  breakpoints: { position: number; correctSplice: number }[];
  speedDrift: number;
  noiseLevel: number;
} {
  let result = [...waveform];
  const breakpoints: { position: number; correctSplice: number }[] = [];
  let speedDrift = 0;
  let noiseLevel = 0;

  for (const defect of defects) {
    switch (defect) {
      case 'mold': {
        const moldStart = 30 + (seed % 20);
        const moldEnd = moldStart + 25 + (seed % 15);
        for (let i = moldStart; i < moldEnd && i < result.length; i++) {
          const fade = Math.sin(((i - moldStart) / (moldEnd - moldStart)) * Math.PI);
          result[i] = result[i] * (0.4 + fade * 0.3) + (Math.random() - 0.5) * 0.15 * fade;
        }
        noiseLevel += 0.3;
        break;
      }
      case 'breakage': {
        const breakCount = 1 + (seed % 2);
        for (let b = 0; b < breakCount; b++) {
          const breakPos = 50 + b * 60 + ((seed * (b + 3)) % 30);
          breakpoints.push({ position: breakPos, correctSplice: breakPos });
          for (let i = breakPos - 2; i < breakPos + 2 && i < result.length; i++) {
            if (i >= 0) {
              result[i] = (i < breakPos ? -0.8 : 0.8) + (Math.random() - 0.5) * 0.2;
            }
          }
        }
        break;
      }
      case 'speed_drift': {
        speedDrift = (seed % 2 === 0 ? 1 : -1) * (0.08 + (seed % 5) * 0.02);
        const stretched: number[] = [];
        for (let i = 0; i < result.length; i++) {
          const srcIdx = i * (1 + speedDrift);
          const base = Math.floor(srcIdx);
          const frac = srcIdx - base;
          if (base >= 0 && base < result.length - 1) {
            stretched.push(result[base] * (1 - frac) + result[base + 1] * frac);
          } else if (base < result.length) {
            stretched.push(result[base] || 0);
          } else {
            stretched.push(0);
          }
        }
        result = stretched.slice(0, WAVEFORM_LENGTH);
        while (result.length < WAVEFORM_LENGTH) result.push(0);
        break;
      }
      case 'noise': {
        const noiseBase = 0.15 + (seed % 5) * 0.05;
        for (let i = 0; i < result.length; i++) {
          result[i] += (Math.random() - 0.5) * noiseBase;
        }
        noiseLevel += noiseBase * 2;
        break;
      }
    }
  }

  return { waveform: result, breakpoints, speedDrift, noiseLevel };
}

export function applyCleaning(waveform: number[], method: string, noiseLevel: number): number[] {
  const result = [...waveform];
  let cleanFactor = 0;

  switch (method) {
    case 'alcohol_swab':
      cleanFactor = 0.3;
      break;
    case 'compressed_air':
      cleanFactor = 0.2;
      break;
    case 'baking_method':
      cleanFactor = 0.6;
      break;
    case 'rewind_cycle':
      cleanFactor = 0.25;
      break;
  }

  for (let i = 1; i < result.length - 1; i++) {
    const avg = (result[i - 1] + result[i] + result[i + 1]) / 3;
    result[i] = result[i] * (1 - cleanFactor * noiseLevel) + avg * cleanFactor * noiseLevel;
  }
  return result;
}

export function applySplice(
  waveform: number[],
  breakpoints: { position: number; correctSplice: number }[],
  splices: { position: number; isCorrect: boolean }[]
): number[] {
  const result = [...waveform];
  for (const bp of breakpoints) {
    const splice = splices.find((s) => Math.abs(s.position - bp.position) < 5);
    const splicePos = splice ? splice.position : bp.correctSplice;
    const correct = splice ? splice.isCorrect : true;

    const rangeStart = Math.max(0, splicePos - 3);
    const rangeEnd = Math.min(result.length - 1, splicePos + 3);

    if (!correct) {
      for (let i = rangeStart; i <= rangeEnd; i++) {
        result[i] = (i < splicePos ? result[rangeStart] : result[rangeEnd]) * 0.9 + (Math.random() - 0.5) * 0.4;
      }
    } else {
      for (let i = rangeStart; i <= rangeEnd; i++) {
        const t = (i - rangeStart) / (rangeEnd - rangeStart);
        const leftVal = result[rangeStart] || 0;
        const rightVal = result[rangeEnd] || 0;
        result[i] = leftVal * (1 - t) + rightVal * t;
      }
    }
  }
  return result;
}

export function applySpeedCorrection(waveform: number[], drift: number, appliedSpeed: number): number[] {
  const correction = 1 - (drift * (appliedSpeed - 1));
  if (Math.abs(correction - 1) < 0.001) return [...waveform];

  const result: number[] = [];
  for (let i = 0; i < waveform.length; i++) {
    const srcIdx = i * correction;
    const base = Math.floor(srcIdx);
    const frac = srcIdx - base;
    if (base >= 0 && base < waveform.length - 1) {
      result.push(waveform[base] * (1 - frac) + waveform[base + 1] * frac);
    } else if (base >= 0 && base < waveform.length) {
      result.push(waveform[base]);
    } else {
      result.push(0);
    }
  }
  while (result.length < waveform.length) result.push(0);
  return result.slice(0, waveform.length);
}

export function applyNoiseReduction(waveform: number[], level: number): { waveform: number[]; detailLoss: number } {
  if (level <= 0) return { waveform: [...waveform], detailLoss: 0 };

  const result = [...waveform];
  const windowSize = Math.max(1, Math.floor(level * 8));
  const threshold = 0.05 + level * 0.08;

  for (let i = 0; i < result.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(result.length - 1, i + windowSize); j++) {
      sum += result[j];
      count++;
    }
    const localAvg = sum / count;
    const diff = Math.abs(result[i] - localAvg);
    if (diff < threshold) {
      result[i] = localAvg;
    } else {
      result[i] = localAvg + (result[i] - localAvg) * (1 - level * 0.5);
    }
  }

  const detailLoss = level > 0.7 ? (level - 0.7) * 2.5 : 0;
  return { waveform: result, detailLoss: Math.min(1, detailLoss) };
}

export function analyzeWaveforms(
  original: number[],
  current: number[],
  splices: { position: number; isCorrect: boolean }[],
  noiseReductionLevel: number
): WaveformAnalysis {
  const jumpPoints: { position: number; magnitude: number }[] = [];
  for (const s of splices) {
    if (!s.isCorrect) {
      let maxJump = 0;
      for (let i = Math.max(1, s.position - 3); i < Math.min(current.length - 1, s.position + 3); i++) {
        const jump = Math.abs(current[i] - current[i - 1]);
        if (jump > maxJump) maxJump = jump;
      }
      jumpPoints.push({ position: s.position, magnitude: maxJump });
    }
  }

  let energyBefore = 0;
  let energyAfter = 0;
  for (let i = 1; i < original.length - 1; i++) {
    energyBefore += Math.abs(original[i] - original[i - 1]);
    energyAfter += Math.abs(current[i] - current[i - 1]);
  }
  const voiceDetailBefore = energyBefore / original.length;
  const voiceDetailAfter = energyAfter / original.length;

  return {
    original,
    afterCleaning: original,
    afterRepair: current,
    voiceDetailBefore,
    voiceDetailAfter,
    jumpPoints,
  };
}

export function calculateMetrics(
  original: number[],
  current: number[],
  analysis: WaveformAnalysis,
  noiseReductionLevel: number,
  voiceDetailLoss: number
): { intelligibility: number; fidelity: number; correlation: number; jumpPenalty: number; detailPenalty: number } {
  let similarity = 0;
  for (let i = 0; i < Math.min(original.length, current.length); i++) {
    similarity += 1 - Math.abs(original[i] - current[i]) / 2;
  }
  similarity /= Math.min(original.length, current.length);

  let corrSum = 0;
  let origSum = 0;
  let currSum = 0;
  const len = Math.min(original.length, current.length);
  for (let i = 0; i < len; i++) {
    corrSum += original[i] * current[i];
    origSum += original[i] * original[i];
    currSum += current[i] * current[i];
  }
  const correlation = corrSum / (Math.sqrt(origSum) * Math.sqrt(currSum) + 1e-10);

  const jumpPenalty = analysis.jumpPoints.reduce((sum, j) => sum + j.magnitude * 0.15, 0);
  const detailPenalty = voiceDetailLoss * 0.4;

  const fidelity = Math.max(0, Math.min(100, (similarity * 0.6 + correlation * 0.4) * 100 - jumpPenalty * 20));
  const intelligibility = Math.max(0, Math.min(100, correlation * 100 - detailPenalty * 30 - jumpPenalty * 15));

  return { intelligibility, fidelity, correlation, jumpPenalty, detailPenalty };
}

export const CLEANING_COSTS: Record<string, number> = {
  alcohol_swab: 5,
  compressed_air: 3,
  baking_method: 15,
  rewind_cycle: 2,
};
