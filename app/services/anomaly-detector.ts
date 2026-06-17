import type { DeviationPoint, AnomalyReport } from '../types';

export const EXCESSIVE_DEVIATION_THRESHOLD = 10.0;
export const ABNORMAL_JUMP_THRESHOLD = 6.0;
export const MIN_REQUIRED_POINTS = 24;

export function detectAnomalies(recordId: number, points: DeviationPoint[]): AnomalyReport[] {
  const reports: AnomalyReport[] = [];

  if (points.length < MIN_REQUIRED_POINTS) {
    reports.push({
      record_id: recordId,
      type: 'missing_points',
      severity: 'high',
      message: `自差点数量不足：当前 ${points.length} 个，标准要求 ${MIN_REQUIRED_POINTS} 个（每15°一个）`,
      details: { missing: MIN_REQUIRED_POINTS - points.length, current: points.length }
    });
  }

  const excessive = points.filter(p => p.deviation > EXCESSIVE_DEVIATION_THRESHOLD);
  if (excessive.length > 0) {
    const headings = excessive.map(p => `${p.ship_heading}°(${p.deviation}${p.deviation_direction})`).join(', ');
    reports.push({
      record_id: recordId,
      type: 'deviation_excessive',
      severity: excessive.some(p => p.deviation > 15) ? 'high' : 'medium',
      message: `检测到超差数据：${excessive.length} 个航向上自差值超过 ${EXCESSIVE_DEVIATION_THRESHOLD}° 阈值`,
      details: { headings, threshold: EXCESSIVE_DEVIATION_THRESHOLD, count: excessive.length, max: Math.max(...excessive.map(p => p.deviation)) }
    });
  }

  let lastVal = 0;
  let lastDir: 'E' | 'W' = 'E';
  const jumps: Array<{ from: number; to: number; delta: number }> = [];
  const dirChanges: Array<{ heading: number; from: string; to: string }> = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const signedVal = p.deviation_direction === 'E' ? p.deviation : -p.deviation;
    if (i > 0) {
      const delta = Math.abs(signedVal - lastVal);
      if (delta > ABNORMAL_JUMP_THRESHOLD) {
        jumps.push({ from: points[i - 1].ship_heading, to: p.ship_heading, delta: Math.round(delta * 10) / 10 });
      }
      if (p.deviation_direction !== lastDir && Math.abs(signedVal) > 2 && Math.abs(lastVal) > 2) {
        dirChanges.push({ heading: p.ship_heading, from: lastDir, to: p.deviation_direction });
      }
    }
    lastVal = signedVal;
    lastDir = p.deviation_direction;
  }

  if (jumps.length > 0) {
    const details = jumps.map(j => `${j.from}°→${j.to}°(变化${j.delta}°)`).join(', ');
    reports.push({
      record_id: recordId,
      type: 'abnormal_jump',
      severity: jumps.length >= 3 ? 'high' : 'medium',
      message: `检测到 ${jumps.length} 处异常跳变：相邻航向自差变化超过 ${ABNORMAL_JUMP_THRESHOLD}°`,
      details: { jumps: details, threshold: ABNORMAL_JUMP_THRESHOLD }
    });
  }

  if (dirChanges.length >= 4) {
    reports.push({
      record_id: recordId,
      type: 'inconsistent_direction',
      severity: 'medium',
      message: `方向变化频繁：全航向范围内自差方向发生 ${dirChanges.length} 次切换，曲线可能不连续`,
      details: { changes: dirChanges.map(c => `${c.heading}°:${c.from}→${c.to}`).join(' | ') }
    });
  }

  if (points.length >= 12) {
    const signed = points.map(p => p.deviation_direction === 'E' ? p.deviation : -p.deviation);
    let discontinuities = 0;
    for (let i = 2; i < signed.length; i++) {
      const predicted = (signed[i - 2] + signed[i]) / 2;
      if (Math.abs(signed[i - 1] - predicted) > 4) {
        discontinuities++;
      }
    }
    if (discontinuities >= 3) {
      reports.push({
        record_id: recordId,
        type: 'curve_discontinuity',
        severity: 'low',
        message: `自差曲线平滑度不足：存在 ${discontinuities} 处明显非线性跳变，建议复测确认`,
        details: { discontinuities, smoothness_score: Math.max(0, 100 - discontinuities * 15) }
      });
    }
  }

  return reports;
}

export function getOverallSeverity(reports: AnomalyReport[]): 'none' | 'low' | 'medium' | 'high' {
  if (reports.length === 0) return 'none';
  if (reports.some(r => r.severity === 'high')) return 'high';
  if (reports.some(r => r.severity === 'medium')) return 'medium';
  return 'low';
}
