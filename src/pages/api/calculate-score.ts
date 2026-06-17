import type { APIRoute } from 'astro';
import type { Shift, Action } from '@/types/game';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { actions, levelConfig } = await request.json();
    
    let totalScore = 0;
    let bonusScore = 0;
    let penaltyScore = 0;
    
    actions.forEach((action: Action) => {
      totalScore += action.scoreChange;
      if (action.scoreChange > 0) bonusScore += action.scoreChange;
      if (action.scoreChange < 0) penaltyScore += action.scoreChange;
    });
    
    const handledCalls = actions.filter((a: Action) => a.type === 'connect').length;
    const interruptCount = actions.filter((a: Action) => a.type === 'interrupt').length;
    
    const efficiencyBonus = Math.max(0, Math.floor(handledCalls * 5));
    const cleanShiftBonus = interruptCount === 0 ? 50 : 0;
    
    const finalScore = totalScore + efficiencyBonus + cleanShiftBonus;
    
    const grade = finalScore >= 500 ? 'S' : finalScore >= 300 ? 'A' : finalScore >= 200 ? 'B' : finalScore >= 100 ? 'C' : 'D';
    
    return new Response(JSON.stringify({
      totalScore,
      bonusScore,
      penaltyScore,
      efficiencyBonus,
      cleanShiftBonus,
      finalScore,
      grade,
      handledCalls,
      interruptCount,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
