import type { APIRoute } from 'astro';
import type { BoardAdjustments, ToneProfile, SoundSample, ScoreResult } from '@/types/game';
import { calculateToneFromAdjustments, calculateToneMatchScore, calculateSpectrumMatchScore, generateSoundSpectrum } from '@/utils/toneCalculator';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { adjustments, woodTypeId, targetTone, targetSpectrum, baseFreq, operationCount, timeSpent, idealAdjustments } = body as {
    adjustments: BoardAdjustments;
    woodTypeId: string;
    targetTone: ToneProfile;
    targetSpectrum: SoundSample[];
    baseFreq: number;
    operationCount: number;
    timeSpent: number;
    idealAdjustments: BoardAdjustments;
  };

  const currentTone = calculateToneFromAdjustments(adjustments, woodTypeId);
  const toneResult = calculateToneMatchScore(currentTone, targetTone);

  const currentSpectrum = generateSoundSpectrum(adjustments, baseFreq);
  const spectrumScore = calculateSpectrumMatchScore(currentSpectrum, targetSpectrum);

  const adjustmentKeys = Object.keys(idealAdjustments) as (keyof BoardAdjustments)[];
  let adjTotalDiff = 0;
  for (const key of adjustmentKeys) {
    const idealRange = idealAdjustments[key] || 1;
    adjTotalDiff += Math.abs(adjustments[key] - idealAdjustments[key]) / idealRange;
  }
  const adjustmentPrecisionScore = Math.max(0, 100 - (adjTotalDiff / adjustmentKeys.length) * 100);

  const opsScore = 100 - Math.min(operationCount * 2, 50);
  const efficiencyScore = Math.max(0, opsScore);

  const totalScore = toneResult.score * 0.4 + spectrumScore * 0.25 + adjustmentPrecisionScore * 0.2 + efficiencyScore * 0.15;

  const result: ScoreResult = {
    totalScore,
    toneMatchScore: toneResult.score,
    spectrumMatchScore: spectrumScore,
    adjustmentPrecisionScore,
    efficiencyScore,
    details: {
      tone: toneResult.details
    }
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
