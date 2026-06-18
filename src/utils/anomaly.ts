import type { Sample, Anomaly } from '../types';
import { getAllAnomalies, saveAnomaly } from './storage';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function hasAnomaly(sampleId: string, type: Anomaly['type']): boolean {
  const existing = getAllAnomalies();
  return existing.some((a) => a.sampleId === sampleId && a.type === type && !a.resolved);
}

function checkToneMismatch(sample: Sample): Anomaly | null {
  const toneMap: Record<string, string[]> = {
    阴平: ['55', '44', '33', '53'],
    阳平: ['21', '223', '13', '24', '35'],
    上声: ['53', '51', '41', '35', '213'],
    去声: ['213', '231', '45', '33', '22'],
    阴上: ['35', '51', '53'],
    阳上: ['231', '13'],
    阴去: ['33', '45'],
    阳去: ['22', '231'],
    阴入: ['5', '55', '4', '32'],
    阳入: ['2', '23', '5'],
    入声: ['2', '24', '5'],
  };

  const validValues = toneMap[sample.toneCategory];
  if (validValues && !validValues.includes(sample.toneValue)) {
    return {
      id: generateId(),
      sampleId: sample.id,
      projectId: sample.projectId,
      type: 'tone_mismatch',
      description: `调类"${sample.toneCategory}"与调值"${sample.toneValue}"不匹配，常见值为: ${validValues.join('/')}`,
      severity: 'high',
      createdAt: new Date().toISOString(),
      resolved: false,
    };
  }
  return null;
}

function checkPitchOutlier(sample: Sample): Anomaly | null {
  if (sample.pitchData.length === 0) return null;

  const avg = sample.pitchData.reduce((a, b) => a + b, 0) / sample.pitchData.length;
  const stdDev = Math.sqrt(
    sample.pitchData.reduce((s, v) => s + (v - avg) ** 2, 0) / sample.pitchData.length
  );

  const hasOutlier = sample.pitchData.some((v) => Math.abs(v - avg) > 3 * stdDev);
  if (hasOutlier) {
    return {
      id: generateId(),
      sampleId: sample.id,
      projectId: sample.projectId,
      type: 'pitch_outlier',
      description: `基频数据存在异常离群值 (均值=${avg.toFixed(1)}, 标准差=${stdDev.toFixed(1)})`,
      severity: 'medium',
      createdAt: new Date().toISOString(),
      resolved: false,
    };
  }
  return null;
}

function checkSegmentationError(sample: Sample): Anomaly | null {
  if (sample.segmentationPoints.length === 0) return null;

  const sorted = [...sample.segmentationPoints].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] < 0 || sorted[i] > 1) {
      return {
        id: generateId(),
        sampleId: sample.id,
        projectId: sample.projectId,
        type: 'segmentation_error',
        description: `切分点 ${sorted[i]} 超出有效范围 [0, 1]`,
        severity: 'high',
        createdAt: new Date().toISOString(),
        resolved: false,
      };
    }
    if (i > 0 && sorted[i] - sorted[i - 1] < 0.05) {
      return {
        id: generateId(),
        sampleId: sample.id,
        projectId: sample.projectId,
        type: 'segmentation_error',
        description: `相邻切分点间距过小 (${(sorted[i] - sorted[i - 1]).toFixed(3)})`,
        severity: 'medium',
        createdAt: new Date().toISOString(),
        resolved: false,
      };
    }
  }
  return null;
}

function checkMissingData(sample: Sample): Anomaly | null {
  const missing: string[] = [];
  if (!sample.word) missing.push('词目');
  if (!sample.ipa) missing.push('国际音标');
  if (!sample.toneValue) missing.push('调值');
  if (!sample.toneCategory) missing.push('调类');
  if (sample.waveformData.length === 0) missing.push('波形数据');
  if (sample.pitchData.length === 0) missing.push('基频数据');

  if (missing.length > 0) {
    return {
      id: generateId(),
      sampleId: sample.id,
      projectId: sample.projectId,
      type: 'missing_data',
      description: `缺少必要数据: ${missing.join('、')}`,
      severity: missing.length >= 3 ? 'high' : missing.length >= 2 ? 'medium' : 'low',
      createdAt: new Date().toISOString(),
      resolved: false,
    };
  }
  return null;
}

export function detectAnomalies(sample: Sample): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const checks = [checkToneMismatch, checkPitchOutlier, checkSegmentationError, checkMissingData];

  for (const check of checks) {
    const anomaly = check(sample);
    if (anomaly && !hasAnomaly(sample.id, anomaly.type)) {
      anomalies.push(anomaly);
    }
  }

  return anomalies;
}

export function scanAndSaveAnomalies(samples: Sample[]): number {
  let count = 0;
  for (const sample of samples) {
    const anomalies = detectAnomalies(sample);
    for (const anomaly of anomalies) {
      saveAnomaly(anomaly);
      count++;
    }
  }
  return count;
}
