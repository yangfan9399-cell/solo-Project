import type { RequestHandler } from '@builder.io/qwik-city';
import type { CalibrationResult } from '~/game/types';
import { simulateCalibration } from '~/game/engine';

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const { waterClock, environment, targetDuration, tolerance } = body;

    if (!waterClock || !environment) {
      json(400, { error: '缺少必要参数' });
      return;
    }

    const config = {
      ...waterClock,
      targetDuration: targetDuration || waterClock.targetDuration || 120,
    };

    const result: CalibrationResult = simulateCalibration(config, environment);

    const passed = Math.abs(result.errorSeconds) <= (tolerance || 30);

    json(200, {
      success: true,
      result: {
        ...result,
        passed,
      },
      calculatedAt: Date.now(),
    });
  } catch (e) {
    json(500, { error: '服务器计算错误', details: (e as Error).message });
  }
};
