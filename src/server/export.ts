import { stringify } from 'csv-stringify/sync';
import type { SectionDetail, SectionListItem } from '~/types/mineral';

export function exportToCSV(sections: SectionListItem[]): string {
  const records = sections.map(s => ({
    '薄片编号': s.thinSectionNumber,
    '样品编号': s.sampleNumber,
    '矿物名称': s.mineralName,
    '矿物分子式': s.mineralFormula || '',
    '晶系': s.crystalSystem || '',
    '产地': s.locality || '',
    '采集日期': s.collectionDate || '',
    '采集者': s.collector || '',
    '厚度(μm)': s.thicknessMicrometers,
    '盖玻片': s.coverSlip ? '是' : '否',
    '封固剂': s.mountingMedium || '',
    '粒度(mm)': s.grainSizeMm || '',
    '岩石类型': s.rockType || '',
    '蚀变程度(%)': s.alterationDegree || 0,
    '标本盒': s.boxName || '',
    '盒内位置': s.boxPosition || '',
    '照片数量': s.micrographCount,
    '干涉色记录': s.interferenceColorCount,
    '伴生矿物': s.associationCount,
    '数据异常': s.anomalyCount,
    '当前版本': s.currentVersion,
    '最后更新': s.updatedAt,
    '创建时间': s.createdAt,
    '备注': s.notes || '',
  }));

  return stringify(records, {
    header: true,
    encoding: 'utf-8',
    quoted: true,
  });
}

export function exportDetailToMarkdown(section: SectionDetail): string {
  const modeLabel: Record<string, string> = {
    ppl: '单偏光',
    xpl: '正交偏光',
    cnl: '锥光',
  };

  const opticSignLabel: Record<string, string> = {
    positive: '正光性',
    negative: '负光性',
    unknown: '未知',
  };

  const severityLabel: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
  };

  const md: string[] = [];

  md.push(`# ${section.mineralName} 薄片观察档案`);
  md.push('');
  md.push(`**薄片编号:** ${section.thinSectionNumber}`);
  md.push(`**样品编号:** ${section.sampleNumber}`);
  md.push(`**当前版本:** v${section.currentVersion}`);
  md.push(`**创建时间:** ${section.createdAt}`);
  md.push(`**最后更新:** ${section.updatedAt}`);
  md.push('');

  md.push('## 基本信息');
  md.push('');
  md.push('| 属性 | 数值 |');
  md.push('|------|------|');
  md.push(`| 矿物名称 | ${section.mineralName} |`);
  if (section.mineralFormula) md.push(`| 矿物分子式 | ${section.mineralFormula} |`);
  if (section.crystalSystem) md.push(`| 晶系 | ${section.crystalSystem} |`);
  if (section.locality) md.push(`| 产地 | ${section.locality} |`);
  if (section.collectionDate) md.push(`| 采集日期 | ${section.collectionDate} |`);
  if (section.collector) md.push(`| 采集者 | ${section.collector} |`);
  md.push(`| 薄片厚度 | ${section.thicknessMicrometers} μm |`);
  md.push(`| 盖玻片 | ${section.coverSlip ? '有' : '无'} |`);
  if (section.mountingMedium) md.push(`| 封固剂 | ${section.mountingMedium} |`);
  if (section.grainSizeMm) md.push(`| 粒度 | ${section.grainSizeMm} mm |`);
  if (section.rockType) md.push(`| 岩石类型 | ${section.rockType} |`);
  if (section.alterationDegree !== undefined) md.push(`| 蚀变程度 | ${section.alterationDegree}% |`);
  if (section.box) md.push(`| 储存位置 | ${section.box.name} (${section.box.position || '-'}) |`);
  md.push('');

  if (section.notes) {
    md.push('## 备注');
    md.push('');
    md.push(section.notes);
    md.push('');
  }

  if (section.optics) {
    md.push('## 光学性质');
    md.push('');
    md.push('| 属性 | 数值 |');
    md.push('|------|------|');
    md.push(`| 突起 | ${section.optics.relief > 0 ? '+' : ''}${section.optics.relief} |`);
    if (section.optics.refractiveIndexMin && section.optics.refractiveIndexMax) {
      md.push(`| 折射率范围 | ${section.optics.refractiveIndexMin} - ${section.optics.refractiveIndexMax} |`);
    }
    if (section.optics.birefringence) md.push(`| 双折射率 | ${section.optics.birefringence} |`);
    if (section.optics.opticSign) md.push(`| 光性符号 | ${opticSignLabel[section.optics.opticSign]} |`);
    if (section.optics.opticAxisAngle) md.push(`| 光轴角 | 2V = ${section.optics.opticAxisAngle}° |`);
    if (section.optics.extinctionType) md.push(`| 消光类型 | ${section.optics.extinctionType} |`);
    if (section.optics.extinctionAngle) md.push(`| 消光角 | ${section.optics.extinctionAngle}° |`);
    if (section.optics.pleochroism) md.push(`| 多色性 | ${section.optics.pleochroism} |`);
    if (section.optics.pleochroismColors) md.push(`| 多色性公式 | ${section.optics.pleochroismColors} |`);
    if (section.optics.absorptionFormula) md.push(`| 吸收公式 | ${section.optics.absorptionFormula} |`);
    if (section.optics.twinningType) md.push(`| 双晶类型 | ${section.optics.twinningType} |`);
    if (section.optics.twinningDescription) md.push(`| 双晶描述 | ${section.optics.twinningDescription} |`);
    md.push(`| 环带结构 | ${section.optics.zoning ? '有' : '无'} |`);
    if (section.optics.inclusionsDescription) md.push(`| 包体特征 | ${section.optics.inclusionsDescription} |`);
    md.push('');
  }

  if (section.micrographs.length > 0) {
    md.push('## 显微照片');
    md.push('');
    md.push('| 编号 | 偏光方式 | 放大倍数 | 比例尺 | 视域特征 |');
    md.push('|------|----------|----------|--------|----------|');
    section.micrographs.forEach((m, i) => {
      md.push(`| ${i + 1} | ${modeLabel[m.mode] || m.mode} | ${m.magnification}× | ${m.scaleBarMicrometers} μm | ${m.notes || '-'} |`);
    });
    md.push('');
  }

  if (section.interferenceColors.length > 0) {
    md.push('## 干涉色记录');
    md.push('');
    md.push('| 颗粒编号 | 级序 | 颜色 | 估算双折率 | 厚度 | 颗粒方位 | 异常 |');
    md.push('|----------|------|------|------------|------|----------|------|');
    section.interferenceColors.forEach(ic => {
      md.push(`| ${ic.mineralGrainId || '-'} | ${ic.order}级 | ${ic.colorName} | ${ic.estimatedBirefringence} | ${ic.thicknessMicrometers}μm | ${ic.grainOrientation} | ${ic.isAnomalous ? '是' : '否'} |`);
    });
    md.push('');
  }

  if (section.cleavages.length > 0) {
    md.push('## 解理特征');
    md.push('');
    md.push('| 颗粒编号 | 解理等级 | 方向数 | 夹角 | 描述 |');
    md.push('|----------|----------|--------|------|------|');
    section.cleavages.forEach(c => {
      md.push(`| ${c.mineralGrainId || '-'} | ${c.quality} | ${c.numberOfDirections}组 | ${c.angleBetweenDirections || '-'}° | ${c.cleavageTrace || c.notes || '-'} |`);
    });
    md.push('');
  }

  if (section.associations.length > 0) {
    md.push('## 伴生关系');
    md.push('');
    md.push('| 伴生矿物 | 关系类型 | 结构关系 | 含量 | 世代 |');
    md.push('|----------|----------|----------|------|------|');
    section.associations.forEach(a => {
      md.push(`| ${a.associatedMineral} | ${a.relationshipType} | ${a.texturalRelation} | ${a.abundancePercent}% | ${a.parageneticStage || '-'} |`);
    });
    md.push('');
  }

  if (section.versionHistory.length > 0) {
    md.push('## 版本历史');
    md.push('');
    md.push('| 版本 | 变更类型 | 描述 | 操作人 | 时间 |');
    md.push('|------|----------|------|--------|------|');
    section.versionHistory.slice(0, 20).forEach(v => {
      md.push(`| v${v.version} | ${v.changeType} | ${v.changeDescription} | ${v.changedBy || '-'} | ${v.changedAt} |`);
    });
    md.push('');
  }

  const unresolvedAnomalies = section.anomalies.filter(a => !a.resolvedAt);
  if (unresolvedAnomalies.length > 0) {
    md.push('## ⚠️ 数据异常提示');
    md.push('');
    md.push('| 严重程度 | 类型 | 描述 |');
    md.push('|----------|------|------|');
    unresolvedAnomalies.forEach(a => {
      md.push(`| ${severityLabel[a.severity]} | ${a.anomalyType} | ${a.description} |`);
    });
    md.push('');
  }

  md.push('---');
  md.push('');
  md.push(`*本文档由《稀有矿物薄片显微观察档案》系统于 ${new Date().toISOString()} 自动生成*`);

  return md.join('\n');
}

export function generateExportSummary(sections: SectionListItem[]): {
  totalCount: number;
  mineralTypes: string[];
  localities: string[];
  withAnomalies: number;
  withMicrographs: number;
  totalMicrographs: number;
  avgThickness: number;
  oldestRecord?: string;
  newestRecord?: string;
} {
  const mineralSet = new Set<string>();
  const localitySet = new Set<string>();
  let withAnomalies = 0;
  let withMicrographs = 0;
  let totalMicrographs = 0;
  let totalThickness = 0;
  let oldestRecord: string | undefined;
  let newestRecord: string | undefined;

  sections.forEach(s => {
    mineralSet.add(s.mineralName);
    if (s.locality) localitySet.add(s.locality);
    if (s.anomalyCount > 0) withAnomalies++;
    if (s.micrographCount > 0) withMicrographs++;
    totalMicrographs += s.micrographCount;
    totalThickness += s.thicknessMicrometers;
    
    if (!oldestRecord || s.createdAt < oldestRecord) oldestRecord = s.createdAt;
    if (!newestRecord || s.createdAt > newestRecord) newestRecord = s.createdAt;
  });

  return {
    totalCount: sections.length,
    mineralTypes: Array.from(mineralSet).sort(),
    localities: Array.from(localitySet).sort(),
    withAnomalies,
    withMicrographs,
    totalMicrographs,
    avgThickness: sections.length > 0 ? Math.round(totalThickness / sections.length) : 0,
    oldestRecord,
    newestRecord,
  };
}
