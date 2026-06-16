import type { RequestHandler } from '@builder.io/qwik-city';
import type { GameSession, SettleResult, CalibrationResult, OrderWithStatus } from '~/game/types';
import { INITIAL_LEVELS } from '~/game/levels';
import { simulateCalibration, clamp } from '~/game/engine';

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const { waterClock, environment, targetDuration, tolerance } = body;

    if (!waterClock || !environment) {
      return json(400, { error: '缺少必要参数' });
    }

    const config = {
      ...waterClock,
      targetDuration: targetDuration || waterClock.targetDuration || 120,
    };

    const result: CalibrationResult = simulateCalibration(config, environment);

    const passed = Math.abs(result.errorSeconds) <= (tolerance || 30);

    return json(200, {
      success: true,
      result: {
        ...result,
        passed,
      },
      calculatedAt: Date.now(),
    });
  } catch (e) {
    return json(500, { error: '服务器计算错误', details: (e as Error).message });
  }
};
