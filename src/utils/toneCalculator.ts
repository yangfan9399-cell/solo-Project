import type { BoardAdjustments, ToneProfile } from '@/types/game';
import { WOOD_TYPES } from '@/data/levels';

export function calculateToneFromAdjustments(
  adjustments: BoardAdjustments,
  woodTypeId: string
): ToneProfile {
  const wood = WOOD_TYPES.find(w => w.id === woodTypeId) || WOOD_TYPES[0];

  const thicknessFactor = adjustments.woodThickness / 3;
  const beamFactor = adjustments.beamPosition / 50;
  const lacquerFactor = adjustments.lacquerLayer / 3;
  const holeFactor = adjustments.soundHoleSize / 85;
  const braceFactor = adjustments.braceAngle / 20;

  const brightness = Math.max(0, Math.min(100,
    wood.brightness * (0.4 + 0.6 / thicknessFactor) * (0.7 + 0.3 * holeFactor) / lacquerFactor * 0.5
  ));

  const warmth = Math.max(0, Math.min(100,
    wood.warmth * (0.5 + 0.5 * thicknessFactor) * (0.8 + 0.2 * beamFactor) * (0.6 + 0.4 * lacquerFactor) * 0.5
  ));

  const resonance = Math.max(0, Math.min(100,
    wood.resonance * (0.6 + 0.4 / thicknessFactor) * (0.5 + 0.5 / beamFactor) * (0.9 - 0.3 * (lacquerFactor - 1)) * 0.5
  ));

  const sustain = Math.max(0, Math.min(100,
    (wood.resonance + wood.warmth) * 0.25 * (0.7 + 0.3 * thicknessFactor) * (0.5 + 0.5 * lacquerFactor) * (0.6 + 0.4 * braceFactor)
  ));

  const projection = Math.max(0, Math.min(100,
    brightness * 0.6 + wood.brightness * 0.2 * holeFactor * (0.5 + 0.5 / thicknessFactor)
  ));

  const clarity = Math.max(0, Math.min(100,
    brightness * 0.4 + wood.brightness * 0.3 + (100 - warmth * 0.3) * holeFactor * 0.3 / lacquerFactor
  ));

  return { brightness, warmth, resonance, sustain, projection, clarity };
}

export function calculateToneMatchScore(
  current: ToneProfile,
  target: ToneProfile
): { score: number; details: { dimension: string; score: number; target: number; actual: number }[] } {
  const dimensions = Object.keys(target) as (keyof ToneProfile)[];
  const details = dimensions.map(dim => {
    const diff = Math.abs(current[dim] - target[dim]);
    const score = Math.max(0, 100 - diff * 2);
    return {
      dimension: dim,
      score,
      target: target[dim],
      actual: current[dim]
    };
  });

  const avgScore = details.reduce((sum, d) => sum + d.score, 0) / details.length;
  return { score: avgScore, details };
}

export function calculateSpectrumMatchScore(
  currentSpectrum: { frequency: number; amplitude: number }[],
  targetSpectrum: { frequency: number; amplitude: number }[]
): number {
  if (!currentSpectrum.length || !targetSpectrum.length) return 0;

  const len = Math.min(currentSpectrum.length, targetSpectrum.length);
  let totalDiff = 0;

  for (let i = 0; i < len; i++) {
    const freqDiff = Math.abs(currentSpectrum[i].frequency - targetSpectrum[i].frequency) / targetSpectrum[i].frequency;
    const ampDiff = Math.abs(currentSpectrum[i].amplitude - targetSpectrum[i].amplitude);
    totalDiff += freqDiff * 0.4 + ampDiff * 0.6;
  }

  return Math.max(0, 100 - (totalDiff / len) * 150);
}

export function generateSoundSpectrum(
  adjustments: BoardAdjustments,
  baseFreq: number
): { frequency: number; amplitude: number }[] {
  const harmonics = Math.floor(10 + adjustments.soundHoleSize / 15);
  const samples: { frequency: number; amplitude: number }[] = [];

  for (let i = 1; i <= harmonics; i++) {
    const thicknessAttenuation = Math.exp(-i * 0.25 * (adjustments.woodThickness / 3));
    const lacquerBoost = 1 + (adjustments.lacquerLayer - 2) * 0.05 * i;
    const beamModulation = 1 + Math.sin(i * adjustments.beamPosition / 50) * 0.1;

    samples.push({
      frequency: baseFreq * i * (1 + adjustments.braceAngle * 0.001 * i),
      amplitude: Math.max(0, Math.min(1, thicknessAttenuation * lacquerBoost * beamModulation))
    });
  }

  return samples;
}

export function generateCustomerFeedback(
  toneMatchScore: number,
  totalScore: number,
  toneDetails: { dimension: string; score: number; target: number; actual: number }[]
) {
  const praiseAspects: string[] = [];
  const criticismAspects: string[] = [];
  const dimensionNames: Record<string, string> = {
    brightness: '明亮度',
    warmth: '温暖度',
    resonance: '共鸣',
    sustain: '延音',
    projection: '穿透力',
    clarity: '清晰度'
  };

  toneDetails.forEach(d => {
    if (d.score >= 85) {
      praiseAspects.push(`${dimensionNames[d.dimension]}表现极佳`);
    } else if (d.score < 50) {
      criticismAspects.push(`${dimensionNames[d.dimension]}需要改进`);
    }
  });

  let comment: string;
  let satisfaction: number;

  if (toneMatchScore >= 85) {
    satisfaction = Math.min(100, 85 + Math.random() * 15);
    comment = '太棒了！这正是我梦寐以求的音色，简直无可挑剔！';
    if (praiseAspects.length === 0) praiseAspects.push('整体音色完美平衡');
  } else if (toneMatchScore >= 70) {
    satisfaction = Math.min(100, 70 + Math.random() * 15);
    comment = '非常不错的作品，我能感受到你的用心。有几个小细节可以再打磨一下。';
    if (praiseAspects.length === 0) praiseAspects.push('制琴工艺扎实');
  } else if (toneMatchScore >= 50) {
    satisfaction = Math.min(100, 50 + Math.random() * 20);
    comment = '嗯...还算能用，但离我的期望还有些距离。希望下次能做得更好。';
    if (criticismAspects.length === 0) criticismAspects.push('整体还需加强');
  } else {
    satisfaction = Math.max(0, 30 + Math.random() * 20);
    comment = '说实话，这把琴让我很失望。音色完全不对，你需要重新学习制琴的基本原理。';
    if (criticismAspects.length === 0) criticismAspects.push('音色严重偏离');
  }

  return { satisfaction, comment, praiseAspects, criticismAspects };
}
