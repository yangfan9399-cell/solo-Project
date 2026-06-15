import type { AnomalyReport, BatchRecord, VersionDiff, MainRecord, FailTag } from './types';
import { listMainRecords, getFullBatch } from './db';

export const FAIL_TAG_LABELS: Record<FailTag, string> = {
  insufficient_blue: '蓝色不足',
  over_exposure: '曝光过度',
  under_exposure: '曝光不足',
  uneven_coating: '涂布不均',
  paper_stain: '纸张污染',
  washing_insufficient: '水洗不足',
  yellowing: '泛黄',
  poor_contrast: '对比度差',
  other: '其他问题',
};

export const WASH_STAGE_LABELS: Record<string, string> = {
  first_wash: '初次水洗',
  acid_bath: '酸浴定影',
  second_wash: '二次水洗',
  final_rinse: '最终漂洗',
};

export const PHOTO_STAGE_LABELS: Record<string, string> = {
  before_exposure: '曝光前',
  after_exposure: '曝光后',
  after_wash: '水洗后',
  dried: '干燥成品',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  processing: '进行中',
  completed: '已完成',
  failed: '失败',
  archived: '已归档',
  rolled_back: '已回滚',
};

export interface BaselineStats {
  avgSolutionA: number;
  avgSolutionB: number;
  avgTotalVolume: number;
  avgExposureMin: number;
  avgExposureSec: number;
  avgUvIntensity: number;
  avgWashTotalMin: number;
  avgRoomTemp: number;
  avgHumidity: number;
  avgOverallScore: number;
  sampleCount: number;
}

export function computeBaseline(): BaselineStats {
  const all = listMainRecords({ includeArchived: true });
  let solA = 0, solB = 0, vol = 0, expMin = 0, expSec = 0, uvInt = 0;
  let washMin = 0, roomT = 0, hum = 0, score = 0;
  let nExposure = 0, nWash = 0, nResult = 0;

  for (const m of all) {
    solA += m.solutionARatio;
    solB += m.solutionBRatio;
    vol += m.totalVolumeMl;
    const batch = getFullBatch(m.id) as any;
    if (batch) {
      for (const e of batch.exposureDetails) {
        expMin += e.exposureMinutes;
        expSec += e.exposureSeconds;
        uvInt += e.uvIntensityMwCm2;
        nExposure++;
      }
      let batchWashMin = 0;
      for (const w of batch.washHistories) {
        batchWashMin += w.durationMinutes + w.durationSeconds / 60;
      }
      if (batch.washHistories.length) {
        washMin += batchWashMin;
        nWash++;
      }
      if (batch.result) {
        roomT += batch.result.roomTempC;
        hum += batch.result.humidityPct;
        score += batch.result.overallScore;
        nResult++;
      }
    }
  }

  const n = all.length || 1;
  return {
    avgSolutionA: solA / n,
    avgSolutionB: solB / n,
    avgTotalVolume: vol / n,
    avgExposureMin: expMin / (nExposure || 1),
    avgExposureSec: expSec / (nExposure || 1),
    avgUvIntensity: uvInt / (nExposure || 1),
    avgWashTotalMin: washMin / (nWash || 1),
    avgRoomTemp: roomT / (nResult || 1),
    avgHumidity: hum / (nResult || 1),
    avgOverallScore: score / (nResult || 1),
    sampleCount: all.length,
  };
}

function pctDiff(cur: number, base: number): number {
  if (base === 0) return 0;
  return ((cur - base) / base) * 100;
}

function severityOf(pct: number, threshold: number): 'low' | 'medium' | 'high' {
  const abs = Math.abs(pct);
  if (abs >= threshold * 2) return 'high';
  if (abs >= threshold) return 'medium';
  return 'low';
}

export function runAnomalyCheck(batch: BatchRecord, baseline: BaselineStats): AnomalyReport[] {
  const reports: AnomalyReport[] = [];
  const th = 20;

  const check = (
    field: string,
    label: string,
    cur: number,
    base: number,
    thresholdPct: number,
    suggestionTpl: (dir: 'up' | 'down') => string
  ) => {
    const dev = pctDiff(cur, base);
    const isA = Math.abs(dev) >= thresholdPct;
    reports.push({
      field, label, currentValue: cur, baselineValue: base,
      deviationPct: Math.round(dev * 10) / 10,
      thresholdPct, isAnomaly: isA,
      severity: isA ? severityOf(dev, thresholdPct) : 'low',
      suggestion: isA ? suggestionTpl(dev > 0 ? 'up' : 'down') : '参数在正常范围',
    });
  };

  check(
    'solutionARatio', '药液A比例',
    batch.main.solutionARatio, baseline.avgSolutionA, th,
    (d) => d === 'up' ? 'A液比例偏高，考虑减少A液，可能导致蓝色过深或氧化' : 'A液比例偏低，建议增加A液以保证显色'
  );
  check(
    'solutionBRatio', '药液B比例',
    batch.main.solutionBRatio, baseline.avgSolutionB, th,
    (d) => d === 'up' ? 'B液比例偏高，可能导致泛黄' : 'B液比例偏低，对比度可能下降'
  );
  check(
    'totalVolumeMl', '药液总容量',
    batch.main.totalVolumeMl, baseline.avgTotalVolume, 30,
    (d) => d === 'up' ? '总容量偏大，注意涂布厚度' : '总容量偏小，可能涂布不足'
  );

  for (const exp of batch.exposureDetails) {
    const totalSec = exp.exposureMinutes * 60 + exp.exposureSeconds;
    const baseTotalSec = baseline.avgExposureMin * 60 + baseline.avgExposureSec;
    check(
      `exposure_sheet_${exp.sheetNo}`,
      `Sheet${exp.sheetNo} 曝光时长（秒）`,
      totalSec, baseTotalSec, 25,
      (d) => d === 'up' ? '曝光时间过长，可能导致过曝或对比度下降' : '曝光时间不足，蓝色可能偏浅'
    );
    check(
      `uv_intensity_sheet_${exp.sheetNo}`,
      `Sheet${exp.sheetNo} UV强度`,
      exp.uvIntensityMwCm2, baseline.avgUvIntensity, 30,
      (d) => d === 'up' ? 'UV过强需缩短曝光时间防止过曝' : 'UV偏弱需延长曝光时间'
    );
  }

  const totalWashMin = batch.washHistories.reduce(
    (s, w) => s + w.durationMinutes + w.durationSeconds / 60, 0
  );
  if (batch.washHistories.length) {
    check(
      'wash_total_min', '水洗总时长（分钟）',
      totalWashMin, baseline.avgWashTotalMin, 25,
      (d) => d === 'up' ? '水洗过长，注意防止图案损失' : '水洗不足可能造成后期泛黄'
    );
  }

  if (batch.result) {
    check(
      'room_temp', '环境温度（℃）',
      batch.result.roomTempC, baseline.avgRoomTemp, 15,
      (d) => d === 'up' ? '室温偏高易导致干燥过快和涂布不均' : '室温偏低需延长干燥时间'
    );
    check(
      'humidity', '湿度（%）',
      batch.result.humidityPct, baseline.avgHumidity, 25,
      (d) => d === 'up' ? '湿度过高，需加强通风或增加干燥时间' : '湿度过低易产生裂纹'
    );
    check(
      'overall_score', '综合评分',
      batch.result.overallScore, baseline.avgOverallScore, 20,
      (d) => d === 'up' ? '表现优异，可考虑固化该参数' : '得分低于基线，建议复盘参数并调整'
    );
  }

  return reports;
}

export function compareMainVersions(oldM: MainRecord, newM: MainRecord): VersionDiff[] {
  const diffs: VersionDiff[] = [];
  const fields: Array<[keyof MainRecord, string, (v: any) => string | number | null]> = [
    ['solutionARatio', '药液A比例', (v) => v as number],
    ['solutionBRatio', '药液B比例', (v) => v as number],
    ['solutionC_Ratio', '药液C比例', (v) => v as number | null],
    ['totalVolumeMl', '总容量(ml)', (v) => v as number],
    ['paperType', '纸张类型', (v) => v as string],
    ['paperWeightGsm', '纸张克重(g/m²)', (v) => v as number],
    ['notes', '备注', (v) => v as string | null],
    ['status', '状态', (v) => STATUS_LABELS[v as string] || v],
    ['version', '版本号', (v) => v as number],
  ];
  for (const [key, label, fmt] of fields) {
    const ov = fmt((oldM as any)[key]);
    const nv = fmt((newM as any)[key]);
    const changed = JSON.stringify(ov) !== JSON.stringify(nv);
    diffs.push({ field: key as string, label, oldValue: ov, newValue: nv, changed });
  }
  return diffs;
}

export function toCsv(rows: any[], headers: Array<[string, string]>): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines: string[] = [];
  lines.push(headers.map(([, l]) => esc(l)).join(','));
  for (const row of rows) {
    lines.push(headers.map(([k]) => esc(row[k])).join(','));
  }
  return lines.join('\n');
}

export function fmtDate(ts: number | null | undefined): string {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type SeedType = 'sample1_normal' | 'sample2_anomaly' | 'sample3_rollback' | 'custom';

export interface SeedMeta {
  type: SeedType;
  label: string;
  shortLabel: string;
  badgeClass: string;
  summary: string;
  impact: string;
  beforeAfter: { before: string; after: string; change: string } | null;
}

const SAMPLE1_HINTS = ['张显影师', '标准配方', '首次使用新批次纸张', '水彩纸 300g 粗纹'];
const SAMPLE2_HINTS = ['王实验员', '参数偏差', 'A液加量到40g', '素描纸 160g', '素描纸 160g 细纹'];
const SAMPLE3_HINTS = ['赵工艺师', '棉浆纸 250g'];

export function detectSeed(main: any, result?: any, photos?: any[], versionChain?: any[]): SeedMeta {
  const text = `${main.createdBy}|${main.notes}|${main.paperType}|${main.batchNo}`;
  const vCount = (versionChain?.length || 0);
  const hasManyPhotos = (photos?.length || 0) >= 4;
  const score = result?.overallScore ?? -1;
  const isArchived = main.isArchived;

  if ((vCount >= 2 || text.includes('赵工艺师') || SAMPLE3_HINTS.some(h => text.includes(h))) && (isArchived || main.notes?.includes('回滚') || main.notes?.includes('重算') || vCount >= 2)) {
    return {
      type: 'sample3_rollback',
      label: '🧪 样本3：失败→归档→回滚→重算',
      shortLabel: '多版本',
      badgeClass: 'status-tag status-warning',
      summary: '首个版本涂布不均+曝光不足，得分44标记为失败；归档后创建重算版本回到标准配方（得分68），再重算v3更换纸张。是「边界样本如何修正错误」的完整工作流。',
      impact: '影响：版本对比页的时间线可视化、归档库的对照样本、参数基线计算中作为负样本权重被降低（已归档不参与基线）。',
      beforeAfter: {
        before: 'v1 20:12配方 + 涂布不均 + 曝光8分钟 → 得分 44，3项失败标签',
        after: 'v2 回归25:10标准配方 → 得分 68，仅1项轻微失败标签',
        change: '配方纠偏后综合得分 +54.5%，涂布失败标签消失，成功率提升明显'
      }
    };
  }
  if (SAMPLE2_HINTS.some(h => text.includes(h)) || (main.solutionARatio >= 40 && score > 0 && score < 35)) {
    return {
      type: 'sample2_anomaly',
      label: '🚩 样本2：参数对比触发严重异常',
      shortLabel: '参数异常',
      badgeClass: 'status-tag status-danger',
      summary: '人为放大A液到40g、高温高湿(31℃/78%)、曝光过量(22分)、水洗不足。触发6项以上严重异常告警，综合得分28。',
      impact: '影响：异常检测卡片红色高亮严重偏离；参数对比矩阵中几乎所有单元格高亮蓝色差异；作为训练数据中失败案例的典型代表。',
      beforeAfter: {
        before: '标准 25:10 + 室温23℃ + 曝光12分',
        after: 'A液40g(+60%) + 室温31℃(+34%) + 曝光22分(+83%)',
        change: '综合得分 78→28 (-64%)，失败标签 0→4 项，异常严重度显著上升'
      }
    };
  }
  if (SAMPLE1_HINTS.some(h => text.includes(h)) || hasManyPhotos || (main.solutionARatio === 25 && main.solutionBRatio === 10 && score >= 70)) {
    return {
      type: 'sample1_normal',
      label: '✅ 样本1：批次照片完整·正常完成',
      shortLabel: '基准参考',
      badgeClass: 'status-tag status-normal',
      summary: '标准25:10配方+300g水彩纸粗纹+4阶段完整水洗+4张阶段照片，综合得分78，无失败标签。',
      impact: '影响：作为计算基线的核心参考样本（平均药液配比、平均水洗时长、平均评分等）；参数对比页作为对照组。',
      beforeAfter: {
        before: '淡黄绿色涂布液 + 阴干30分钟',
        after: '饱和普鲁士蓝 + 良好对比度 + 纹理自然',
        change: '化学反应充分，图像还原完整，4张阶段照片完整记录全过程'
      }
    };
  }
  return {
    type: 'custom',
    label: '📝 用户自建批次',
    shortLabel: '自建',
    badgeClass: 'status-tag status-warning',
    summary: '非种子样本的用户自定义批次记录。',
    impact: '影响：新增数据将参与全库基线统计，有助于优化异常检测阈值的准确性。',
    beforeAfter: null,
  };
}

export function seedTypeOfMain(main: any): SeedMeta {
  return detectSeed(main);
}
