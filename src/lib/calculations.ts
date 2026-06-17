import {
  LiftPoint,
  Performer,
  MotionPath,
  Waypoint,
  LoadCalculationResult,
  LoadAlertLevel,
} from './types';

export function calculateTotalPerformerWeight(performer: Performer): number {
  return performer.weight + performer.costumeWeight + performer.propWeight;
}

export function calculateTensionAngle(
  anchor: { x: number; y: number; z: number },
  load: { x: number; y: number; z: number }
): number {
  const dx = load.x - anchor.x;
  const dy = load.y - anchor.y;
  const dz = load.z - anchor.z;
  const horizontalDist = Math.sqrt(dx * dx + dy * dy);
  const verticalDist = Math.abs(dz);
  if (horizontalDist === 0) return 90;
  return Math.atan(verticalDist / horizontalDist) * (180 / Math.PI);
}

export function calculateDistance3D(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2) +
    Math.pow(b.y - a.y, 2) +
    Math.pow(b.z - a.z, 2)
  );
}

export function interpolateWaypoint(
  path: MotionPath,
  progress: number
): Waypoint & { position: { x: number; y: number; z: number } } {
  const waypoints = path.waypoints.sort((a, b) => a.sequence - b.sequence);
  if (waypoints.length === 0) {
    return {
      id: 'empty',
      sequence: 0,
      x: 0,
      y: 0,
      z: 0,
      timestamp: 0,
      velocity: 0,
      acceleration: 0,
      position: { x: 0, y: 0, z: 0 },
    };
  }
  if (waypoints.length === 1) {
    const wp = waypoints[0];
    return { ...wp, position: { x: wp.x, y: wp.y, z: wp.z } };
  }

  const totalDuration = waypoints[waypoints.length - 1].timestamp - waypoints[0].timestamp;
  const targetTime = waypoints[0].timestamp + progress * totalDuration;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    if (targetTime >= curr.timestamp && targetTime <= next.timestamp) {
      const segDuration = next.timestamp - curr.timestamp;
      const t = segDuration === 0 ? 0 : (targetTime - curr.timestamp) / segDuration;
      return {
        id: `interp-${i}`,
        sequence: curr.sequence + t,
        x: curr.x + (next.x - curr.x) * t,
        y: curr.y + (next.y - curr.y) * t,
        z: curr.z + (next.z - curr.z) * t,
        timestamp: targetTime,
        velocity: curr.velocity + (next.velocity - curr.velocity) * t,
        acceleration: curr.acceleration + (next.acceleration - curr.acceleration) * t,
        position: {
          x: curr.x + (next.x - curr.x) * t,
          y: curr.y + (next.y - curr.y) * t,
          z: curr.z + (next.z - curr.z) * t,
        },
      };
    }
  }

  const last = waypoints[waypoints.length - 1];
  return { ...last, position: { x: last.x, y: last.y, z: last.z } };
}

export function determineAlertLevel(
  safetyFactor: number,
  designSafetyFactor: number,
  utilization: number
): LoadAlertLevel {
  if (safetyFactor < designSafetyFactor * 0.7 || utilization >= 95) {
    return 'danger';
  }
  if (safetyFactor < designSafetyFactor || utilization >= 80) {
    return 'warning';
  }
  return 'normal';
}

export function calculateLoadForPoint(
  point: LiftPoint,
  performers: Performer[],
  path: MotionPath | null,
  defaultSafetyFactor: number,
  dynamicCoefficient: number,
  impactCoefficient: number,
  progress: number = 0,
  performer: Performer | null = null
): LoadCalculationResult {
  const activePerformers = performer ? [performer] : performers;
  const totalPerformerWeight = activePerformers.reduce(
    (sum, p) => sum + calculateTotalPerformerWeight(p),
    0
  );

  let pos = { x: point.x, y: point.y, z: point.z - 2 };
  let acceleration = 0;

  if (path) {
    const wp = interpolateWaypoint(path, progress);
    pos = wp.position;
    acceleration = wp.acceleration;
  }

  const angle = calculateTensionAngle(point, pos);
  const angleRad = (angle * Math.PI) / 180;

  const g = 9.81;
  const staticForceNewtons = (totalPerformerWeight * g) / Math.max(Math.sin(angleRad), 0.1);
  const staticLoadKg = staticForceNewtons / g;

  const dynFactor = 1 + (acceleration / g) * dynamicCoefficient;
  const dynamicLoadKg = staticLoadKg * Math.max(dynFactor, 1.0);

  const impactLoadKg = staticLoadKg * impactCoefficient;

  const maxLoadKg = Math.max(staticLoadKg, dynamicLoadKg, impactLoadKg);
  const utilization = point.maxLoad > 0 ? (maxLoadKg / point.maxLoad) * 100 : 999;
  const actualSafetyFactor = point.maxLoad > 0 ? point.maxLoad / maxLoadKg : 0;

  return {
    pointId: point.id,
    pointName: point.name,
    staticLoad: Number(staticLoadKg.toFixed(2)),
    dynamicLoad: Number(dynamicLoadKg.toFixed(2)),
    impactLoad: Number(impactLoadKg.toFixed(2)),
    maxLoad: Number(maxLoadKg.toFixed(2)),
    safetyFactor: Number(actualSafetyFactor.toFixed(2)),
    designSafetyFactor: defaultSafetyFactor,
    utilization: Number(utilization.toFixed(1)),
    alertLevel: determineAlertLevel(actualSafetyFactor, defaultSafetyFactor, utilization),
    timestamp: progress,
    position: pos,
    tensionAngle: Number(angle.toFixed(1)),
    performerId: performer?.id,
  };
}

export function calculateAllLoads(
  points: LiftPoint[],
  performers: Performer[],
  paths: MotionPath[],
  defaultSafetyFactor: number,
  dynamicCoefficient: number,
  impactCoefficient: number
): LoadCalculationResult[] {
  const results: LoadCalculationResult[] = [];
  const steps = 11;

  for (const point of points) {
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      const path = paths.length > 0 ? paths[0] : null;
      const result = calculateLoadForPoint(
        point,
        performers,
        path,
        defaultSafetyFactor,
        dynamicCoefficient,
        impactCoefficient,
        progress,
        performers[i % Math.max(performers.length, 1)] || null
      );
      results.push(result);
    }
  }

  return results;
}

export function getPeakLoads(results: LoadCalculationResult[]): LoadCalculationResult[] {
  const pointMap = new Map<string, LoadCalculationResult>();
  for (const r of results) {
    const existing = pointMap.get(r.pointId);
    if (!existing || r.maxLoad > existing.maxLoad) {
      pointMap.set(r.pointId, r);
    }
  }
  return Array.from(pointMap.values());
}

export function validatePoint(point: LiftPoint): string[] {
  const errors: string[] = [];
  if (!point.name.trim()) errors.push('吊点名称不能为空');
  if (point.maxLoad <= 0) errors.push('额定载荷必须大于0');
  if (point.z <= 0) errors.push('吊点高度必须大于0');
  return errors;
}

export function validatePerformer(performer: Performer): string[] {
  const errors: string[] = [];
  if (!performer.name.trim()) errors.push('演员姓名不能为空');
  if (performer.weight <= 0) errors.push('演员体重必须大于0');
  return errors;
}
