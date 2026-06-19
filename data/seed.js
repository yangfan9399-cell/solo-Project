const fs = require('fs');
const path = require('path');

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function createVersion(recordId, versionNum, data, source, reason, isLocked = false, parentVersion = null) {
  return {
    id: generateId(),
    recordId: recordId,
    version: versionNum,
    parentVersion: parentVersion,
    data: { ...data },
    source: source,
    reason: reason,
    isLocked: isLocked,
    createdAt: new Date(Date.now() - (5 - versionNum) * 86400000).toISOString(),
    createdBy: '实验室操作员' + (versionNum % 3 + 1),
    comments: [],
    rollbackHistory: []
  };
}

const records = [];

// ===== 记录1：字段冲突 - 同一批次不同测试员测量值差异 =====
const record1Id = generateId();
const record1V1 = createVersion(record1Id, 1, {
  fiberLengthDistribution: { avg: 2.35, min: 0.8, max: 4.2, unit: 'mm' },
  whiteness: { value: 82.5, unit: '%ISO' },
  moistureContent: { value: 7.2, unit: '%' },
  beatingBatchNo: 'DJ-2024-001',
  micrographUrl: '/images/micrograph-001-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.23,
    dryWeight: 4.85,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '初始检测记录，样品来自一号生产线'
}, '初始录入', '纸浆批次DJ-2024-001首次质量检测');

const record1V2 = createVersion(record1Id, 2, {
  fiberLengthDistribution: { avg: 2.41, min: 0.75, max: 4.35, unit: 'mm' },
  whiteness: { value: 83.1, unit: '%ISO' },
  moistureContent: { value: 6.8, unit: '%' },
  beatingBatchNo: 'DJ-2024-001',
  micrographUrl: '/images/micrograph-001-v2.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.23,
    dryWeight: 4.87,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '复测记录，调整了纤维分散方法'
}, '复测修正', '测试员B复测，发现纤维分散更均匀后平均值提升', false, record1V1.id);

const record1V3 = createVersion(record1Id, 3, {
  fiberLengthDistribution: { avg: 2.38, min: 0.78, max: 4.28, unit: 'mm' },
  whiteness: { value: 82.8, unit: '%ISO' },
  moistureContent: { value: 7.0, unit: '%' },
  beatingBatchNo: 'DJ-2024-001',
  micrographUrl: '/images/micrograph-001-v3.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.23,
    dryWeight: 4.86,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '仲裁结果，取三次测量平均值'
}, '仲裁判定', '两次测量存在差异，由高级技师进行仲裁测量', false, record1V2.id);

// 添加评论
record1V2.comments.push({
  id: generateId(),
  author: '测试员A',
  content: '我认为我的初始测量是准确的，纤维没有明显结团',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
});
record1V3.comments.push({
  id: generateId(),
  author: '高级技师王工',
  content: '仲裁结果基于三次独立测量取平均，建议统一使用标准分散方法',
  createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
});

records.push({
  id: record1Id,
  title: 'DJ-2024-001 针叶木浆纤维检测',
  currentVersion: 3,
  versions: [record1V1, record1V2, record1V3]
});

// ===== 记录2：证据替换 - 显微照片更换 =====
const record2Id = generateId();
const record2V1 = createVersion(record2Id, 1, {
  fiberLengthDistribution: { avg: 1.85, min: 0.5, max: 3.6, unit: 'mm' },
  whiteness: { value: 78.2, unit: '%ISO' },
  moistureContent: { value: 8.1, unit: '%' },
  beatingBatchNo: 'DJ-2024-002',
  micrographUrl: '/images/micrograph-002-v1-old.jpg',
  dryingWeighingRecord: {
    sampleWeight: 4.98,
    dryWeight: 4.58,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '阔叶木浆检测，显微照片清晰度不足'
}, '初始录入', '阔叶木浆批次DJ-2024-002检测');

const record2V2 = createVersion(record2Id, 2, {
  fiberLengthDistribution: { avg: 1.85, min: 0.5, max: 3.6, unit: 'mm' },
  whiteness: { value: 78.2, unit: '%ISO' },
  moistureContent: { value: 8.1, unit: '%' },
  beatingBatchNo: 'DJ-2024-002',
  micrographUrl: '/images/micrograph-002-v2-new.jpg',
  dryingWeighingRecord: {
    sampleWeight: 4.98,
    dryWeight: 4.58,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '重新拍摄显微照片，提高分辨率'
}, '证据替换', '原显微照片模糊，重新制片后拍摄高清照片', false, record2V1.id);

const record2V3 = createVersion(record2Id, 3, {
  fiberLengthDistribution: { avg: 1.82, min: 0.48, max: 3.55, unit: 'mm' },
  whiteness: { value: 78.2, unit: '%ISO' },
  moistureContent: { value: 8.1, unit: '%' },
  beatingBatchNo: 'DJ-2024-002',
  micrographUrl: '/images/micrograph-002-v3-final.jpg',
  dryingWeighingRecord: {
    sampleWeight: 4.98,
    dryWeight: 4.58,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '基于高清照片重新测量纤维长度'
}, '数据修正', '高清照片下发现更多短纤维，重新统计分布', false, record2V2.id);

record2V2.comments.push({
  id: generateId(),
  author: '质量主管',
  content: '照片更换已审核通过，原照片存档保留',
  createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
});

records.push({
  id: record2Id,
  title: 'DJ-2024-002 阔叶木浆纤维检测',
  currentVersion: 3,
  versions: [record2V1, record2V2, record2V3]
});

// ===== 记录3：备注撤回 - 错误备注被撤销 =====
const record3Id = generateId();
const record3V1 = createVersion(record3Id, 1, {
  fiberLengthDistribution: { avg: 2.1, min: 0.6, max: 4.0, unit: 'mm' },
  whiteness: { value: 85.3, unit: '%ISO' },
  moistureContent: { value: 6.5, unit: '%' },
  beatingBatchNo: 'DJ-2024-003',
  micrographUrl: '/images/micrograph-003-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.12,
    dryWeight: 4.79,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '高质量漂白浆，可用于高档纸张生产'
}, '初始录入', '漂白针叶木浆检测');

const record3V2 = createVersion(record3Id, 2, {
  fiberLengthDistribution: { avg: 2.1, min: 0.6, max: 4.0, unit: 'mm' },
  whiteness: { value: 85.3, unit: '%ISO' },
  moistureContent: { value: 6.5, unit: '%' },
  beatingBatchNo: 'DJ-2024-003',
  micrographUrl: '/images/micrograph-003-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.12,
    dryWeight: 4.79,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '高质量漂白浆，可用于高档纸张生产。注意：该批次含有少量杂细胞。'
}, '备注补充', '添加杂细胞含量备注，提醒下游工序注意', false, record3V1.id);

const record3V3 = createVersion(record3Id, 3, {
  fiberLengthDistribution: { avg: 2.1, min: 0.6, max: 4.0, unit: 'mm' },
  whiteness: { value: 85.3, unit: '%ISO' },
  moistureContent: { value: 6.5, unit: '%' },
  beatingBatchNo: 'DJ-2024-003',
  micrographUrl: '/images/micrograph-003-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.12,
    dryWeight: 4.79,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '高质量漂白浆，可用于高档纸张生产。'
}, '备注撤回', '经核查，杂细胞含量在标准范围内，之前备注有误，予以撤回', false, record3V2.id);

record3V3.comments.push({
  id: generateId(),
  author: '审核员李工',
  content: '备注撤回已确认，误报已记录在案，请测试员加强复核',
  createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
});

record3V3.rollbackHistory.push({
  fromVersion: 2,
  toVersion: 3,
  reason: '错误备注撤回',
  operator: '审核员李工',
  timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
});

records.push({
  id: record3Id,
  title: 'DJ-2024-003 漂白针叶木浆检测',
  currentVersion: 3,
  versions: [record3V1, record3V2, record3V3]
});

// ===== 记录4：锁定版本 - 已审核版本被锁定 =====
const record4Id = generateId();
const record4V1 = createVersion(record4Id, 1, {
  fiberLengthDistribution: { avg: 2.55, min: 0.9, max: 4.8, unit: 'mm' },
  whiteness: { value: 80.1, unit: '%ISO' },
  moistureContent: { value: 7.8, unit: '%' },
  beatingBatchNo: 'DJ-2024-004',
  micrographUrl: '/images/micrograph-004-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.35,
    dryWeight: 4.93,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '进口针叶木浆，纤维较长'
}, '初始录入', '进口俄罗斯针叶木浆检测');

const record4V2 = createVersion(record4Id, 2, {
  fiberLengthDistribution: { avg: 2.58, min: 0.85, max: 4.9, unit: 'mm' },
  whiteness: { value: 80.5, unit: '%ISO' },
  moistureContent: { value: 7.5, unit: '%' },
  beatingBatchNo: 'DJ-2024-004',
  micrographUrl: '/images/micrograph-004-v2.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.35,
    dryWeight: 4.95,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '进口针叶木浆，纤维较长。补充平行样检测结果。'
}, '平行样补充', '增加第二个平行样数据，取平均值', false, record4V1.id);

const record4V3 = createVersion(record4Id, 3, {
  fiberLengthDistribution: { avg: 2.58, min: 0.85, max: 4.9, unit: 'mm' },
  whiteness: { value: 80.5, unit: '%ISO' },
  moistureContent: { value: 7.5, unit: '%' },
  beatingBatchNo: 'DJ-2024-004',
  micrographUrl: '/images/micrograph-004-v2.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.35,
    dryWeight: 4.95,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '进口针叶木浆，纤维较长。补充平行样检测结果。'
}, '审核锁定', '质量部审核通过，版本锁定作为结算依据', true, record4V2.id);

record4V3.comments.push({
  id: generateId(),
  author: '质量部经理',
  content: '该批次数据已审核，作为与供应商结算的最终依据，版本锁定。',
  createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
});

records.push({
  id: record4Id,
  title: 'DJ-2024-004 进口针叶木浆检测',
  currentVersion: 3,
  versions: [record4V1, record4V2, record4V3]
});

// ===== 记录5：错误回滚 + 不同烘干条件判读差异 =====
const record5Id = generateId();
const record5V1 = createVersion(record5Id, 1, {
  fiberLengthDistribution: { avg: 2.2, min: 0.7, max: 4.1, unit: 'mm' },
  whiteness: { value: 81.8, unit: '%ISO' },
  moistureContent: { value: 7.0, unit: '%' },
  beatingBatchNo: 'DJ-2024-005',
  micrographUrl: '/images/micrograph-005-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.08,
    dryWeight: 4.72,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '标准烘干条件下的检测结果'
}, '初始录入', '混合浆检测，标准105℃烘干');

const record5V2 = createVersion(record5Id, 2, {
  fiberLengthDistribution: { avg: 2.2, min: 0.7, max: 4.1, unit: 'mm' },
  whiteness: { value: 82.5, unit: '%ISO' },
  moistureContent: { value: 4.2, unit: '%' },
  beatingBatchNo: 'DJ-2024-005',
  micrographUrl: '/images/micrograph-005-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.08,
    dryWeight: 4.87,
    dryingTemp: 120,
    dryingTime: 180,
    unit: 'g'
  },
  remark: '高温快速烘干条件下的检测结果，含水率明显降低'
}, '烘干条件变更', '使用120℃快速烘干法，缩短检测时间', false, record5V1.id);

const record5V3 = createVersion(record5Id, 3, {
  fiberLengthDistribution: { avg: 2.25, min: 0.68, max: 4.15, unit: 'mm' },
  whiteness: { value: 82.8, unit: '%ISO' },
  moistureContent: { value: 3.8, unit: '%' },
  beatingBatchNo: 'DJ-2024-005',
  micrographUrl: '/images/micrograph-005-v3.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.08,
    dryWeight: 4.89,
    dryingTemp: 120,
    dryingTime: 180,
    unit: 'g'
  },
  remark: '高温烘干数据修正，发现过度烘干导致纤维损伤'
}, '数据修正', '高温下纤维有轻微降解，白度异常升高', false, record5V2.id);

const record5V4 = createVersion(record5Id, 4, {
  fiberLengthDistribution: { avg: 2.2, min: 0.7, max: 4.1, unit: 'mm' },
  whiteness: { value: 81.8, unit: '%ISO' },
  moistureContent: { value: 7.0, unit: '%' },
  beatingBatchNo: 'DJ-2024-005',
  micrographUrl: '/images/micrograph-005-v1.jpg',
  dryingWeighingRecord: {
    sampleWeight: 5.08,
    dryWeight: 4.72,
    dryingTemp: 105,
    dryingTime: 240,
    unit: 'g'
  },
  remark: '回滚至标准烘干条件数据，高温法结果不予采用'
}, '错误回滚', '高温烘干会导致纤维降解和数据失真，回滚至标准方法版本', false, record5V1.id);

record5V2.comments.push({
  id: generateId(),
  author: '测试员小陈',
  content: '新方法效率提升很多，建议推广使用',
  createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
});
record5V3.comments.push({
  id: generateId(),
  author: '资深技师',
  content: '白度异常升高可疑，高温可能导致纤维组分变化',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
});
record5V4.comments.push({
  id: generateId(),
  author: '技术总监',
  content: '确认回滚。高温烘干仅作参考，正式报告必须使用标准方法。',
  createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
});

record5V4.rollbackHistory.push({
  fromVersion: 3,
  toVersion: 1,
  newVersion: 4,
  reason: '高温烘干方法被证实会导致纤维降解，数据失真，回滚至标准方法版本',
  operator: '技术总监',
  timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
  affectedRecords: ['报告系统-2024-Q1', '质量统计月报-03']
});

records.push({
  id: record5Id,
  title: 'DJ-2024-005 混合浆检测（烘干条件对比）',
  currentVersion: 4,
  versions: [record5V1, record5V2, record5V3, record5V4]
});

const outputPath = path.join(__dirname, 'data.json');
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
console.log('Seed data generated at:', outputPath);
console.log('Total records:', records.length);
records.forEach(r => {
  console.log(`  - ${r.title}: ${r.versions.length} versions`);
});

module.exports = records;
