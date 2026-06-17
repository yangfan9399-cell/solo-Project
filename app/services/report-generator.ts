import { countShips } from '../db/repositories/ships';
import { countRecords, countAbnormalRecords, getLastUpdateDate } from '../db/repositories/records';
import type { LedgerSummary, DeviationRecord, DeviationPoint, CorrectionTableEntry, Ship } from '../types';

export async function buildLedgerSummary(): Promise<LedgerSummary> {
  return {
    totalShips: await countShips(),
    totalRecords: await countRecords(),
    verifiedRecords: (await countRecords('verified')) + (await countRecords('approved')),
    pendingRecords: await countRecords('draft'),
    abnormalRecords: await countAbnormalRecords(),
    archivedRecords: await countRecords('archived'),
    lastUpdateDate: await getLastUpdateDate()
  };
}

export function generateCsvExport(
  ship: Ship,
  record: DeviationRecord,
  points: DeviationPoint[],
  corrections: CorrectionTableEntry[]
): string {
  const lines: string[] = [];
  lines.push('旧船舶罗经自差校正台账 - 数据导出');
  lines.push(`生成时间,${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('=== 船舶信息 ===');
  lines.push(`船名,${ship.name}`);
  lines.push(`IMO编号,${ship.imo_number || ''}`);
  lines.push(`呼号,${ship.call_sign || ''}`);
  lines.push(`船旗国,${ship.flag || ''}`);
  lines.push(`船舶类型,${ship.ship_type || ''}`);
  lines.push(`总吨,${ship.gross_tonnage || ''}`);
  lines.push(`建造年份,${ship.built_year || ''}`);
  lines.push(`罗经类型,${ship.compass_type || ''}`);
  lines.push(`罗经型号,${ship.compass_model || ''}`);
  lines.push('');
  lines.push('=== 校正记录 ===');
  lines.push(`批次号,${record.batch_code}`);
  lines.push(`校正日期,${record.record_date}`);
  lines.push(`校正地点,${record.location || ''}`);
  lines.push(`纬度,${record.latitude || ''}`);
  lines.push(`经度,${record.longitude || ''}`);
  lines.push(`磁差,${record.magnetic_variation || ''} ${record.variation_direction || ''}`);
  lines.push(`验船师,${record.inspector_name || ''}`);
  lines.push(`证书号,${record.inspector_certificate || ''}`);
  lines.push(`检测机构,${record.survey_company || ''}`);
  lines.push(`状态,${record.status}`);
  lines.push('');
  lines.push('=== 自差观测表 ===');
  lines.push('船首向(°),磁航向(°),真航向(°),自差(°),方向,实测/插值');
  for (const p of points) {
    lines.push([
      p.ship_heading,
      p.magnetic_heading?.toFixed(1) || '',
      p.true_heading?.toFixed(1) || '',
      p.deviation.toFixed(1),
      p.deviation_direction,
      p.measured ? '实测' : '插值'
    ].join(','));
  }
  lines.push('');
  lines.push('=== 校正表 ===');
  lines.push('航向(°),适用范围,校正量(°),方向,使用规则');
  for (const c of corrections) {
    lines.push([c.heading, c.ship_heading_range, c.correction_value.toFixed(1), c.correction_direction, c.apply_rule || ''].join(','));
  }
  return lines.join('\n');
}

export function generateSummaryReport(
  ship: Ship,
  record: DeviationRecord,
  points: DeviationPoint[],
  corrections: CorrectionTableEntry[],
  anomalyReports: string[]
): string {
  const maxDev = Math.max(...points.map(p => p.deviation));
  const avgDev = points.reduce((s, p) => s + p.deviation, 0) / points.length;
  const eCount = points.filter(p => p.deviation_direction === 'E').length;
  const wCount = points.filter(p => p.deviation_direction === 'W').length;

  const statusLabel: Record<DeviationRecord['status'], string> = {
    draft: '草稿', verified: '已复核', approved: '已批准', archived: '已归档'
  };

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>罗经自差校正报告 - ${ship.name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: "SimSun", "宋体", serif; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 4px; letter-spacing: 4px; }
  h2 { font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
  .subtitle { text-align: center; color: #555; margin-bottom: 30px; font-size: 13px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 16px; }
  .meta-item { display: flex; }
  .meta-label { color: #555; width: 96px; flex-shrink: 0; }
  .meta-value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: center; }
  th { background: #eef2f7; font-weight: 600; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat-box { border: 1px solid #ccc; padding: 10px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 700; color: #1e40af; }
  .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
  .anomaly { background: #fef2f2; border-left: 4px solid #dc2626; padding: 8px 12px; margin: 8px 0; }
  .warning { background: #fffbeb; border-left: 4px solid #d97706; padding: 8px 12px; margin: 8px 0; }
  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
  .sign-block { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center; }
  .sign-line { border-bottom: 1px solid #333; height: 40px; }
  .dir-E { color: #1e40af; font-weight: 600; }
  .dir-W { color: #991b1b; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; background: #e0e7ff; color: #1e40af; }
</style>
</head>
<body>
<h1>船舶磁罗经自差校正报告</h1>
<div class="subtitle">MAGNETIC COMPASS DEVIATION CORRECTION REPORT</div>

<h2>一、船舶基本信息</h2>
<div class="meta-grid">
  <div class="meta-item"><span class="meta-label">船名：</span><span class="meta-value">${ship.name}</span></div>
  <div class="meta-item"><span class="meta-label">IMO编号：</span><span class="meta-value">${ship.imo_number || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">呼号：</span><span class="meta-value">${ship.call_sign || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">船旗国：</span><span class="meta-value">${ship.flag || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">船舶类型：</span><span class="meta-value">${ship.ship_type || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">总吨位：</span><span class="meta-value">${ship.gross_tonnage ? ship.gross_tonnage.toLocaleString() + ' GT' : '—'}</span></div>
  <div class="meta-item"><span class="meta-label">建造年份：</span><span class="meta-value">${ship.built_year || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">罗经型号：</span><span class="meta-value">${ship.compass_model || '—'}</span></div>
</div>

<h2>二、校正作业信息</h2>
<div class="meta-grid">
  <div class="meta-item"><span class="meta-label">批次编号：</span><span class="meta-value">${record.batch_code}</span></div>
  <div class="meta-item"><span class="meta-label">校正日期：</span><span class="meta-value">${record.record_date}</span></div>
  <div class="meta-item"><span class="meta-label">校正地点：</span><span class="meta-value">${record.location || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">报告状态：</span><span class="badge">${statusLabel[record.status]}</span></div>
  <div class="meta-item"><span class="meta-label">坐标纬度：</span><span class="meta-value">${record.latitude?.toFixed(4) || '—'}°N</span></div>
  <div class="meta-item"><span class="meta-label">坐标经度：</span><span class="meta-value">${record.longitude?.toFixed(4) || '—'}°E</span></div>
  <div class="meta-item"><span class="meta-label">当地磁差：</span><span class="meta-value">${record.magnetic_variation || '—'}° ${record.variation_direction || ''}</span></div>
  <div class="meta-item"><span class="meta-label">天气海况：</span><span class="meta-value">${record.weather_condition || '—'} / ${record.sea_state || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">验船师：</span><span class="meta-value">${record.inspector_name || '—'}</span></div>
  <div class="meta-item"><span class="meta-label">资质证书：</span><span class="meta-value">${record.inspector_certificate || '—'}</span></div>
</div>

<h2>三、校正数据统计摘要</h2>
<div class="stats-grid">
  <div class="stat-box">
    <div class="stat-num">${points.length}</div>
    <div class="stat-label">自差测点数量</div>
  </div>
  <div class="stat-box">
    <div class="stat-num">${maxDev.toFixed(1)}°</div>
    <div class="stat-label">最大自差值</div>
  </div>
  <div class="stat-box">
    <div class="stat-num">${avgDev.toFixed(1)}°</div>
    <div class="stat-label">平均自差值</div>
  </div>
  <div class="stat-box">
    <div class="stat-num">${eCount}/${wCount}</div>
    <div class="stat-label">东差/西差分布</div>
  </div>
</div>

${anomalyReports.length > 0 ? `<h2>四、异常数据提示</h2>${anomalyReports.map(r => `<div class="anomaly">⚠ ${r}</div>`).join('')}` : '<h2>四、异常数据提示</h2><div class="warning">✅ 经检测，本次校正数据无显著异常，各项指标符合常规范围。</div>'}

<h2>五、自差观测数据表</h2>
<table>
  <thead>
    <tr><th>序号</th><th>船首向(°)</th><th>磁航向(°)</th><th>真航向(°)</th><th>自差(°)</th><th>方向</th><th>备注</th></tr>
  </thead>
  <tbody>
    ${points.map((p, i) => `<tr>
      <td>${i + 1}</td>
      <td>${p.ship_heading}</td>
      <td>${p.magnetic_heading?.toFixed(1) || '—'}</td>
      <td>${p.true_heading?.toFixed(1) || '—'}</td>
      <td>${p.deviation.toFixed(1)}</td>
      <td class="dir-${p.deviation_direction}">${p.deviation_direction === 'E' ? '东 E' : '西 W'}</td>
      <td>${p.measured ? '实测' : '插值'}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>六、航向校正使用表</h2>
<table>
  <thead>
    <tr><th>主航向(°)</th><th>适用航向范围</th><th>校正量(°)</th><th>方向</th><th>使用说明</th></tr>
  </thead>
  <tbody>
    ${corrections.map(c => `<tr>
      <td>${c.heading}</td>
      <td>${c.ship_heading_range}</td>
      <td>${c.correction_value.toFixed(1)}</td>
      <td class="dir-${c.correction_direction}">${c.correction_direction === 'E' ? '东 E' : '西 W'}</td>
      <td style="text-align:left;">${c.apply_rule || '按标准规则使用'}</td>
    </tr>`).join('')}
  </tbody>
</table>

${record.notes ? `<h2>七、备注说明</h2><p style="padding: 0 12px;">${record.notes}</p>` : ''}

<div class="sign-block">
  <div>
    <div class="sign-line"></div>
    <div>校正员 签字</div>
  </div>
  <div>
    <div class="sign-line"></div>
    <div>验船师 签字</div>
  </div>
  <div>
    <div class="sign-line"></div>
    <div>船长 签字/日期</div>
  </div>
</div>

<div class="footer">
  <span>报告编号：${record.batch_code}</span>
  <span>打印时间：${new Date().toLocaleString('zh-CN')}</span>
  <span>本报告依据 SOLAS Ch.V / IMO A.382(X) 标准编制</span>
</div>
</body>
</html>
`;
  return html;
}
