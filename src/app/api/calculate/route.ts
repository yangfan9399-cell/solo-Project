import { NextRequest, NextResponse } from 'next/server';
import { calculateAllLoads, calculateLoadForPoint, getPeakLoads } from '@/lib/calculations';
import type { LiftPoint, Performer, MotionPath } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { liftPoints, performers, motionPaths, defaultSafetyFactor, dynamicCoefficient, impactCoefficient, singlePoint } = await req.json();

    if (singlePoint) {
      const { point, path, progress, performer } = singlePoint;
      const result = calculateLoadForPoint(
        point as LiftPoint,
        performers as Performer[],
        (path as MotionPath) || null,
        defaultSafetyFactor || 5,
        dynamicCoefficient || 1.2,
        impactCoefficient || 1.5,
        progress || 0,
        (performer as Performer) || null
      );
      return NextResponse.json({ success: true, data: { single: result } });
    }

    const results = calculateAllLoads(
      liftPoints as LiftPoint[],
      performers as Performer[],
      motionPaths as MotionPath[],
      defaultSafetyFactor || 5,
      dynamicCoefficient || 1.2,
      impactCoefficient || 1.5
    );
    const peaks = getPeakLoads(results);

    return NextResponse.json({
      success: true,
      data: {
        all: results,
        peak: peaks,
        stats: {
          normal: peaks.filter((r) => r.alertLevel === 'normal').length,
          warning: peaks.filter((r) => r.alertLevel === 'warning').length,
          danger: peaks.filter((r) => r.alertLevel === 'danger').length,
          maxUtilization: peaks.length > 0 ? Math.max(...peaks.map((r) => r.utilization)) : 0,
          minSafetyFactor: peaks.length > 0 ? Math.min(...peaks.map((r) => r.safetyFactor)) : 0,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
