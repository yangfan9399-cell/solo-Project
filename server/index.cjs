const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'pulp_samples.json')
const FILTER_FILE = path.join(DATA_DIR, 'filter_state.json')
const DETAIL_FILE = path.join(DATA_DIR, 'active_detail.txt')

let samplesCache = null
let filterCache = null
let detailCache = null

/* ============== 工具函数 ============== */

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

/* ============== 种子数据 ============== */

const DRYING_CONDITIONS = [
  { id: 'STD_105', name: '标准烘干 105℃×2h', temperatureC: 105, durationHours: 2, standard: 'GB/T 462-2008' },
  { id: 'LOW_80', name: '低温烘干 80℃×4h', temperatureC: 80, durationHours: 4, standard: '企业内部标准' },
  { id: 'FAST_130', name: '快速烘干 130℃×45min', temperatureC: 130, durationHours: 0.75, standard: '快速检测法' },
]

const OPERATORS = [
  { id: 'U001', name: '张伟', role: '操作员' },
  { id: 'U002', name: '李娜', role: '主管' },
  { id: 'U003', name: '王强', role: '化验员' },
  { id: 'U004', name: '刘芳', role: '质检员' },
]

function makeAudit(id, action, operator, timestamp, fromStatus, toStatus, note) {
  return { id, action, operatorId: operator.id, operatorName: operator.name, operatorRole: operator.role, timestamp, fromStatus, toStatus, note: note || '' }
}

function moistureFromWeights(wet, dry) {
  if (!wet || !dry || wet <= 0) return 0
  return Number(((wet - dry) / wet * 100).toFixed(2))
}

function makeDrying(id, condition, wetG, dryG, at, opName, opId) {
  const mc = moistureFromWeights(wetG, dryG)
  return {
    id, conditionId: condition.id, conditionName: condition.name,
    wetWeightG: Number(wetG.toFixed(3)), dryWeightG: Number(dryG.toFixed(3)),
    moistureContent: mc, recordedAt: at,
    operatorName: opName, operatorId: opId,
    notes: '',
  }
}

function makeMicroSvg(prefix, tint) {
  const w = 400, h = 300
  const fibers = []
  const colors = tint === 'brown' ? ['#8B7355', '#A0826D', '#C4A77D', '#6B5344']
    : tint === 'light' ? ['#E8DCC8', '#D4C4A8', '#C9B896', '#F0E6D2']
    : ['#7A8B8B', '#5F7070', '#90A0A0', '#4A5A5A']
  for (let i = 0; i < 40; i++) {
    const x1 = Math.random() * w, y1 = Math.random() * h
    const len = 40 + Math.random() * 120
    const angle = Math.random() * Math.PI
    const x2 = x1 + Math.cos(angle) * len
    const y2 = y1 + Math.sin(angle) * len
    const sw = 1 + Math.random() * 3
    const c = colors[Math.floor(Math.random() * colors.length)]
    fibers.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="${0.6 + Math.random() * 0.4}"/>`)
  }
  const nodes = []
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * w, cy = Math.random() * h
    const r = 3 + Math.random() * 6
    nodes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${colors[0]}" opacity="0.5"/>`)
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="background:#F5F0E8"><defs><filter id="blur"><feGaussianBlur stdDeviation="0.5"/></filter></defs><g filter="url(#blur)">${fibers.join('')}${nodes.join('')}</g><rect x="0" y="0" width="${w}" height="4" fill="rgba(0,0,0,0.1)"/><text x="10" y="20" font-size="10" fill="#666" font-family="monospace">${prefix} · ×400</text></svg>`)}`
}

function makeMicro(id, label, tint, mag, at, opName) {
  return {
    id, label, magnification: mag,
    imageUrl: makeMicroSvg(label, tint),
    capturedAt: at, operatorName: opName,
    notes: '',
  }
}

function buildSeedSamples() {
  const now = nowIso()
  const op = OPERATORS[0]
  const chief = OPERATORS[1]
  const qc = { id: 'U005', name: '陈建国', role: '质检员' }

  const samples = []

  // 1. 正常·判读合格
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260610-001',
    pulpBatch: 'PK-HT-2026-06-088',
    fiberLength: { short: 18.5, medium: 62.3, long: 19.2, weightedAverage: 2.29 },
    whiteness: 84.7, moistureContent: 5.48,
    sourceType: 'PURCHASE', sourceInfo: '供应商：山东华泰纸业 | 合同号：HT-2026-0612',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'JUDGED_PASS',
    microPhotos: [makeMicro(uid('mp'), '针叶木浆 · 标准烘干', 'brown', 400, now, op.name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 94.520, now, op.name, op.id)],
    auditLogs: [
      makeAudit(uid('a'), '采购入库登记', op, new Date(Date.now() - 86400000 * 10).toISOString(), undefined, 'DRAFT', '针叶木浆批次 088'),
      makeAudit(uid('a'), '预检通过', op, new Date(Date.now() - 86400000 * 10).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '提交判读', op, new Date(Date.now() - 86400000 * 8).toISOString(), 'PRECHECK_PASS', 'PENDING_JUDGE', '样本齐全'),
      makeAudit(uid('a'), '判读合格', chief, new Date(Date.now() - 86400000 * 5).toISOString(), 'PENDING_JUDGE', 'JUDGED_PASS', '纤维形态良好，符合标准'),
    ],
    judgeConclusion: 'PASS', judgeRemark: '纤维形态良好，符合采购标准', judgeBy: chief.name,
    judgeAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    tags: [], isDuplicate: false, missingFields: [],
  })

  // 2. 正常·待判读
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PD-20260612-014',
    pulpBatch: 'PD-BH-2026-06-031',
    fiberLength: { short: 22.1, medium: 58.7, long: 19.2, weightedAverage: 2.17 },
    whiteness: 82.9, moistureContent: 5.53,
    sourceType: 'PRODUCTION', sourceInfo: '车间：二号硫酸盐浆车间 | 工段：洗涤筛选段',
    operatorId: OPERATORS[3].id, operatorName: OPERATORS[3].name,
    responsiblePersonId: 'U006', responsiblePersonName: '赵明辉',
    registeredAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    status: 'PENDING_JUDGE',
    microPhotos: [makeMicro(uid('mp'), '纤维形态 ×400', 'light', 400, now, OPERATORS[3].name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 94.470, now, OPERATORS[3].name, OPERATORS[3].id)],
    auditLogs: [
      makeAudit(uid('a'), '生产批次取样', OPERATORS[3], new Date(Date.now() - 86400000 * 8).toISOString(), undefined, 'DRAFT', '阔叶木浆生产样'),
      makeAudit(uid('a'), '预检通过', OPERATORS[3], new Date(Date.now() - 86400000 * 8).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '提交判读', OPERATORS[3], new Date(Date.now() - 86400000 * 6).toISOString(), 'PRECHECK_PASS', 'PENDING_JUDGE', ''),
    ],
    tags: [], isDuplicate: false, missingFields: [],
  })

  // 3. 缺测·白度缺失
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260613-027',
    pulpBatch: 'PK-FJ-2026-06-042',
    fiberLength: { short: 17.8, medium: 61.5, long: 20.7, weightedAverage: 2.33 },
    whiteness: null, moistureContent: 5.62,
    sourceType: 'PURCHASE', sourceInfo: '供应商：福建青山纸业',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: 'PRECHECK_FAIL',
    microPhotos: [makeMicro(uid('mp'), '竹浆纤维 · 缺白度', 'brown', 400, now, op.name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 94.380, now, op.name, op.id)],
    auditLogs: [
      makeAudit(uid('a'), '采购入库登记', op, new Date(Date.now() - 86400000 * 6).toISOString(), undefined, 'DRAFT', '白度计故障暂缺'),
      makeAudit(uid('a'), '预检失败', op, new Date(Date.now() - 86400000 * 6).toISOString(), 'DRAFT', 'PRECHECK_FAIL', '缺测：白度'),
    ],
    tags: ['缺测'], isDuplicate: false, missingFields: ['whiteness'],
  })

  // 4. 缺测·三重缺测（退货复检）
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-RT-20260615-008',
    pulpBatch: 'PK-GD-2026-05-119',
    fiberLength: { short: NaN, medium: NaN, long: NaN },
    whiteness: null, moistureContent: null,
    sourceType: 'RETURNED', sourceInfo: '退货原因：质量异议 | 原供应商：广东肇庆纸业',
    operatorId: OPERATORS[2].id, operatorName: OPERATORS[2].name,
    responsiblePersonId: 'U007', responsiblePersonName: '孙丽萍',
    registeredAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'PRECHECK_FAIL',
    microPhotos: [], dryingRecords: [],
    auditLogs: [
      makeAudit(uid('a'), '退货复检登记', OPERATORS[2], new Date(Date.now() - 86400000 * 4).toISOString(), undefined, 'DRAFT', '待补测纤维/白度/含水率'),
      makeAudit(uid('a'), '预检失败', OPERATORS[2], new Date(Date.now() - 86400000 * 4).toISOString(), 'DRAFT', 'PRECHECK_FAIL', '缺测：纤维分布、白度、含水率'),
    ],
    tags: ['缺测', '退货复检'], isDuplicate: false, missingFields: ['fiberLength.short', 'fiberLength.medium', 'fiberLength.long', 'whiteness', 'moistureContent'],
  })

  // 5. 重复样本
  const dupId = samples[0].id
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260610-001',
    pulpBatch: 'PK-HT-2026-06-088',
    fiberLength: { short: 18.5, medium: 62.3, long: 19.2, weightedAverage: 2.29 },
    whiteness: 84.7, moistureContent: 5.48,
    sourceType: 'PURCHASE', sourceInfo: '供应商：山东华泰纸业 | 合同号：HT-2026-0612',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    status: 'PRECHECK_FAIL',
    microPhotos: [], dryingRecords: [],
    auditLogs: [
      makeAudit(uid('a'), '重复登记', op, new Date(Date.now() - 86400000 * 9).toISOString(), undefined, 'DRAFT', '操作员误重复录入'),
      makeAudit(uid('a'), '预检失败', op, new Date(Date.now() - 86400000 * 9).toISOString(), 'DRAFT', 'PRECHECK_FAIL', '与库中样本编号重复'),
    ],
    tags: ['重复样本'], isDuplicate: true, duplicateOfSampleId: dupId, missingFields: [],
  })

  // 6. 冲突组A：标准105℃烘干，判读合格
  const conflictBatch = 'PK-CT-2026-06-055'
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260608-019-A',
    pulpBatch: conflictBatch,
    fiberLength: { short: 15.2, medium: 64.8, long: 20.0, weightedAverage: 2.34 },
    whiteness: 83.5, moistureContent: 6.48,
    sourceType: 'PURCHASE', sourceInfo: '供应商：福建青山纸业 | 合同号：CT-2026-001',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    status: 'JUDGED_PASS',
    microPhotos: [makeMicro(uid('mp'), '竹浆纤维 · 标准烘干', 'brown', 400, now, op.name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 93.520, new Date(Date.now() - 86400000 * 12).toISOString(), op.name, op.id)],
    auditLogs: [
      makeAudit(uid('a'), '采购入库登记', op, new Date(Date.now() - 86400000 * 12).toISOString(), undefined, 'DRAFT', '竹浆·标准烘干条件平行样A'),
      makeAudit(uid('a'), '预检通过', op, new Date(Date.now() - 86400000 * 12).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '提交判读', op, new Date(Date.now() - 86400000 * 11).toISOString(), 'PRECHECK_PASS', 'PENDING_JUDGE', ''),
      makeAudit(uid('a'), '判读合格', chief, new Date(Date.now() - 86400000 * 10).toISOString(), 'PENDING_JUDGE', 'JUDGED_PASS', '标准条件下检测合格'),
    ],
    judgeConclusion: 'PASS', judgeRemark: '标准烘干条件下合格', judgeBy: chief.name,
    judgeAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    tags: ['冲突组A'], isDuplicate: false, missingFields: [],
  })

  // 7. 冲突组B：130℃高温烘干，判读冲突→退回复判
  const groupAIndex = samples.length - 1
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260608-019-B',
    pulpBatch: conflictBatch,
    fiberLength: { short: 15.2, medium: 64.8, long: 20.0, weightedAverage: 2.34 },
    whiteness: 83.5, moistureContent: 5.35,
    sourceType: 'PURCHASE', sourceInfo: '供应商：福建青山纸业 | 平行样B · 快速烘干法',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    status: 'RETURNED_FOR_REVIEW',
    microPhotos: [makeMicro(uid('mp'), '竹浆纤维 · 快速烘干', 'light', 400, now, op.name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[2], 100.000, 94.650, new Date(Date.now() - 86400000 * 12).toISOString(), op.name, op.id)],
    auditLogs: [
      makeAudit(uid('a'), '平行样登记', op, new Date(Date.now() - 86400000 * 12).toISOString(), undefined, 'DRAFT', '竹浆·快速烘干130℃平行样B'),
      makeAudit(uid('a'), '预检通过', op, new Date(Date.now() - 86400000 * 12).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '提交判读', op, new Date(Date.now() - 86400000 * 11).toISOString(), 'PRECHECK_PASS', 'PENDING_JUDGE', ''),
      makeAudit(uid('a'), '判读冲突', chief, new Date(Date.now() - 86400000 * 9).toISOString(), 'PENDING_JUDGE', 'RETURNED_FOR_REVIEW', '同批次不同烘干条件含水率差异1.13pp，需复判'),
    ],
    judgeConclusion: 'CONFLICT', judgeRemark: '与标准烘干样差异较大，需确认', judgeBy: chief.name,
    judgeAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    tags: ['冲突组B', '退回复判'], isDuplicate: false,
    conflictWithSampleId: samples[groupAIndex].id,
    missingFields: [],
  })

  // 8. 锁定·审计样本
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PD-20260605-007',
    pulpBatch: 'PD-YA-2026-06-007',
    fiberLength: { short: 20.3, medium: 60.1, long: 19.6, weightedAverage: 2.21 },
    whiteness: 82.9, moistureContent: 5.53,
    sourceType: 'PRODUCTION', sourceInfo: '车间：二号硫酸盐浆车间 | 审计抽查样',
    operatorId: 'U006', operatorName: '赵明辉',
    responsiblePersonId: 'U006', responsiblePersonName: '赵明辉',
    registeredAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    status: 'LOCKED',
    microPhotos: [makeMicro(uid('mp'), '审计封存样', 'brown', 400, now, '赵明辉')],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 94.470, new Date(Date.now() - 86400000 * 15).toISOString(), '赵明辉', 'U006')],
    auditLogs: [
      makeAudit(uid('a'), '生产取样', { id: 'U006', name: '赵明辉', role: '主管' }, new Date(Date.now() - 86400000 * 15).toISOString(), undefined, 'DRAFT', '审计抽查'),
      makeAudit(uid('a'), '预检通过', { id: 'U006', name: '赵明辉', role: '主管' }, new Date(Date.now() - 86400000 * 15).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '判读合格', chief, new Date(Date.now() - 86400000 * 14).toISOString(), 'PRECHECK_PASS', 'JUDGED_PASS', ''),
      makeAudit(uid('a'), '审计锁定', chief, new Date(Date.now() - 86400000 * 3).toISOString(), 'JUDGED_PASS', 'LOCKED', '季度审计封存，不得修改'),
    ],
    judgeConclusion: 'PASS', judgeRemark: '生产质量正常', judgeBy: chief.name,
    judgeAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    tags: ['锁定', '审计'], isDuplicate: false, missingFields: [],
  })

  // 9. 退回复判
  samples.push({
    id: uid('sample'),
    sampleCode: 'S-PK-20260603-051',
    pulpBatch: 'PK-JX-2026-06-076',
    fiberLength: { short: 25.8, medium: 56.2, long: 18.0, weightedAverage: 2.05 },
    whiteness: 78.4, moistureContent: 6.12,
    sourceType: 'PURCHASE', sourceInfo: '供应商：江西纸业 | 合同号：JX-2026-034',
    operatorId: op.id, operatorName: op.name,
    responsiblePersonId: qc.id, responsiblePersonName: qc.name,
    registeredAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    status: 'RETURNED_FOR_REVIEW',
    microPhotos: [makeMicro(uid('mp'), '不合格退回复检', 'brown', 400, now, op.name)],
    dryingRecords: [makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100.000, 93.880, new Date(Date.now() - 86400000 * 18).toISOString(), op.name, op.id)],
    auditLogs: [
      makeAudit(uid('a'), '采购入库登记', op, new Date(Date.now() - 86400000 * 18).toISOString(), undefined, 'DRAFT', ''),
      makeAudit(uid('a'), '预检通过', op, new Date(Date.now() - 86400000 * 18).toISOString(), 'DRAFT', 'PRECHECK_PASS', ''),
      makeAudit(uid('a'), '提交判读', op, new Date(Date.now() - 86400000 * 17).toISOString(), 'PRECHECK_PASS', 'PENDING_JUDGE', ''),
      makeAudit(uid('a'), '判读不合格', chief, new Date(Date.now() - 86400000 * 16).toISOString(), 'PENDING_JUDGE', 'JUDGED_FAIL', '白度偏低，短纤维比例偏高'),
      makeAudit(uid('a'), '质控总监打回复判', { id: 'U002', name: '李娜', role: '总监' }, new Date(Date.now() - 86400000 * 2).toISOString(), 'JUDGED_FAIL', 'RETURNED_FOR_REVIEW', '供应商申诉，需重新检验确认'),
    ],
    judgeConclusion: 'FAIL', judgeRemark: '白度偏低，短纤维比例偏高', judgeBy: chief.name,
    judgeAt: new Date(Date.now() - 86400000 * 16).toISOString(),
    tags: ['退回复判'], isDuplicate: false, missingFields: [],
  })

  return samples
}

/* ============== 数据持久化 ============== */

function migrateAuditFields(sample) {
  if (!sample.auditLogs || !Array.isArray(sample.auditLogs)) return sample
  sample.auditLogs = sample.auditLogs.map(log => {
    const migrated = { ...log }
    if (migrated.at !== undefined && migrated.timestamp === undefined) {
      migrated.timestamp = migrated.at
      delete migrated.at
    }
    if (migrated.remark !== undefined && migrated.note === undefined) {
      migrated.note = migrated.remark
      delete migrated.remark
    }
    return migrated
  })
  return sample
}

function readSamples() {
  if (samplesCache) return samplesCache
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    const seeds = buildSeedSamples()
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeds, null, 2), 'utf-8')
    samplesCache = seeds
    return seeds
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    const migrated = Array.isArray(parsed) ? parsed.map(migrateAuditFields) : parsed
    samplesCache = migrated
    return samplesCache
  } catch (e) {
    console.error('读取数据失败，重置为种子数据:', e.message)
    const seeds = buildSeedSamples()
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeds, null, 2), 'utf-8')
    samplesCache = seeds
    return seeds
  }
}

function writeSamples(list) {
  ensureDataDir()
  samplesCache = list
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8')
}

function readFilter() {
  if (filterCache) return filterCache
  ensureDataDir()
  const def = { keyword: '', status: 'ALL', sourceType: 'ALL', pulpBatch: '', hasIssues: 'ALL', judgeConclusion: 'ALL', page: 1, pageSize: 10 }
  if (!fs.existsSync(FILTER_FILE)) {
    filterCache = def
    return def
  }
  try {
    const raw = fs.readFileSync(FILTER_FILE, 'utf-8')
    filterCache = JSON.parse(raw)
    return filterCache
  } catch {
    filterCache = def
    return def
  }
}

function writeFilter(f) {
  ensureDataDir()
  const cur = readFilter()
  const merged = { ...cur, ...f }
  filterCache = merged
  fs.writeFileSync(FILTER_FILE, JSON.stringify(merged), 'utf-8')
}

function readDetail() {
  if (detailCache !== null) return detailCache
  ensureDataDir()
  if (!fs.existsSync(DETAIL_FILE)) return null
  const v = fs.readFileSync(DETAIL_FILE, 'utf-8').trim() || null
  detailCache = v
  return v
}

function writeDetail(id) {
  ensureDataDir()
  detailCache = id
  if (id) fs.writeFileSync(DETAIL_FILE, id, 'utf-8')
  else if (fs.existsSync(DETAIL_FILE)) fs.unlinkSync(DETAIL_FILE)
}

/* ================ 预检逻辑 ================ */

const WHITENESS_MIN = 30, WHITENESS_MAX = 100
const MOISTURE_MIN = 0, MOISTURE_MAX = 30

function parsePastedText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : /\s{2,}/
  const header = lines[0].split(sep).map(c => c.trim().toLowerCase())
  const hasHeader = header.some(h => /样本|sample|编号|code/.test(h))
  const start = hasHeader ? 1 : 0
  const rows = []
  for (let i = start; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim())
    rows.push({
      sampleCode: cells[0] || '', pulpBatch: cells[1] || '',
      fiberShort: cells[2] || '', fiberMedium: cells[3] || '', fiberLong: cells[4] || '',
      whiteness: cells[5] || '', moistureContent: cells[6] || '',
      sourceType: cells[7] || '', sourceInfo: cells[8] || '',
      operatorName: cells[9] || '', responsiblePersonName: cells[10] || '',
    })
  }
  return rows
}

function findMissingFields(r) {
  const miss = []
  if (!r.sampleCode) miss.push('sampleCode')
  if (!r.pulpBatch) miss.push('pulpBatch')
  if (!r.fiberShort) miss.push('fiberLength.short')
  if (!r.fiberMedium) miss.push('fiberLength.medium')
  if (!r.fiberLong) miss.push('fiberLength.long')
  if (!r.whiteness) miss.push('whiteness')
  if (!r.moistureContent) miss.push('moistureContent')
  if (!r.sourceType) miss.push('sourceType')
  if (!r.operatorName) miss.push('operatorName')
  if (!r.responsiblePersonName) miss.push('responsiblePersonName')
  return miss
}

function validateRows(rows) {
  return rows.map((r, idx) => {
    const errors = []
    const missing = findMissingFields(r)
    for (const f of missing) {
      errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: f, severity: 'ERROR', type: 'MISSING_FIELD', message: `字段 ${f} 缺测/未填写` })
    }
    let whiteness = null
    if (r.whiteness) {
      const v = Number(r.whiteness)
      if (!Number.isFinite(v)) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'whiteness', severity: 'ERROR', type: 'INVALID_FORMAT', message: `白度格式无效` })
      else if (v < WHITENESS_MIN || v > WHITENESS_MAX) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'whiteness', severity: 'WARNING', type: 'INVALID_RANGE', message: `白度超出范围` })
      else whiteness = v
    }
    let moisture = null
    if (r.moistureContent) {
      const v = Number(r.moistureContent)
      if (!Number.isFinite(v)) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'moistureContent', severity: 'ERROR', type: 'INVALID_FORMAT', message: `含水率格式无效` })
      else if (v < MOISTURE_MIN || v > MOISTURE_MAX) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'moistureContent', severity: 'WARNING', type: 'INVALID_RANGE', message: `含水率超出范围` })
      else moisture = v
    }
    let fiber = null
    if (r.fiberShort && r.fiberMedium && r.fiberLong) {
      const s = Number(r.fiberShort), m = Number(r.fiberMedium), l = Number(r.fiberLong)
      if (![s, m, l].every(n => Number.isFinite(n))) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'fiberLength', severity: 'ERROR', type: 'INVALID_FORMAT', message: '纤维长度分布应为数字' })
      else {
        const total = s + m + l
        if (Math.abs(total - 100) > 1) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'fiberLength', severity: 'WARNING', type: 'INVALID_RANGE', message: `纤维分布之和偏离100%` })
        const wa = s * 0.8 + m * 2.2 + l * 3.5
        fiber = { short: s, medium: m, long: l, weightedAverage: Number(wa.toFixed(2)) }
      }
    }
    let sourceType = null
    if (r.sourceType) {
      const s = r.sourceType.toUpperCase()
      if (['PURCHASE','PRODUCTION','RETURNED'].includes(s) || /采购|PURCHASE|PK/.test(s)) sourceType = 'PURCHASE'
      else if (/生产|PRODUCTION|PD/.test(s)) sourceType = 'PRODUCTION'
      else if (/退货|退回|RETURN|RT/.test(s)) sourceType = 'RETURNED'
      else errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'sourceType', severity: 'ERROR', type: 'INVALID_FORMAT', message: `来源类型无法识别` })
    }
    const operator = OPERATORS.find(o => o.name === r.operatorName) || OPERATORS.find(o => r.operatorName && o.name.includes(r.operatorName)) || null
    if (r.operatorName && !operator) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'operatorName', severity: 'WARNING', type: 'INVALID_FORMAT', message: `操作员不在系统名单` })
    const respNames = ['陈建国', '赵明辉', '孙丽萍', '张伟', '李娜', '王强', '刘芳']
    const respIds = ['U005', 'U006', 'U007', 'U001', 'U002', 'U003', 'U004']
    const rIdx = respNames.indexOf(r.responsiblePersonName)
    const responsible = rIdx >= 0 ? { id: respIds[rIdx], name: respNames[rIdx] } : null
    if (r.responsiblePersonName && !responsible) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'responsiblePersonName', severity: 'WARNING', type: 'INVALID_FORMAT', message: `责任人不在系统名单` })
    return { rowIndex: idx, row: r, missing, errors, parsed: { whiteness, moisture, fiber, sourceType, operator, responsible } }
  })
}

function runPrecheck(rows, existingSamples) {
  const validated = validateRows(rows)
  let allIssues = validated.flatMap(v => v.errors)
  const byCode = new Map()
  validated.forEach((v, i) => {
    if (!v.row.sampleCode) return
    if (!byCode.has(v.row.sampleCode)) byCode.set(v.row.sampleCode, [])
    byCode.get(v.row.sampleCode).push(i)
  })
  const duplicateGroups = []
  byCode.forEach((indexes, code) => {
    if (indexes.length > 1) {
      duplicateGroups.push([code, ...indexes.map(i => `行${i + 1}`)])
      indexes.forEach(i => {
        allIssues.push({ rowIndex: validated[i].rowIndex, sampleCode: code, field: 'sampleCode', severity: 'ERROR', type: 'DUPLICATE', message: `与本组其它行样本编号重复（共 ${indexes.length} 条）` })
      })
    } else {
      const exist = existingSamples.find(s => s.sampleCode === code)
      if (exist) {
        duplicateGroups.push([code, `行${indexes[0] + 1}`, `已存在`])
        allIssues.push({ rowIndex: validated[indexes[0]].rowIndex, sampleCode: code, field: 'sampleCode', severity: 'WARNING', type: 'DUPLICATE', message: `样本编号已存在于库中（${exist.status}）` })
      }
    }
  })
  const byBatch = new Map()
  validated.forEach((v, i) => {
    if (!v.row.pulpBatch) return
    if (!byBatch.has(v.row.pulpBatch)) byBatch.set(v.row.pulpBatch, [])
    byBatch.get(v.row.pulpBatch).push({ row: i, moisture: v.parsed.moisture })
  })
  const conflictGroups = []
  byBatch.forEach((items, batch) => {
    if (items.length < 2) return
    const moistures = items.map(i => i.moisture).filter(m => m != null)
    if (moistures.length >= 2) {
      const span = Math.max(...moistures) - Math.min(...moistures)
      if (span >= 1.5) {
        conflictGroups.push([batch, `跨度 ${span.toFixed(2)}pp`, ...items.map(it => `行${it.row + 1}`)])
        items.forEach(it => {
          allIssues.push({ rowIndex: validated[it.row].rowIndex, sampleCode: validated[it.row].row.sampleCode, field: 'moistureContent', severity: 'WARNING', type: 'CONFLICT_BATCH', message: `批次 ${batch} 内含水率跨度 ${span.toFixed(2)}pp` })
        })
      }
    }
  })
  const missingFieldSummary = {}
  validated.forEach(v => v.missing.forEach(f => { missingFieldSummary[f] = (missingFieldSummary[f] || 0) + 1 }))
  const passRows = validated.filter(v => v.errors.filter(e => e.severity === 'ERROR').length === 0).length
  return {
    totalRows: rows.length, passRows,
    issues: allIssues.sort((a, b) => {
      const rank = { ERROR: 0, WARNING: 1, INFO: 2 }
      return rank[a.severity] - rank[b.severity] || a.rowIndex - b.rowIndex
    }),
    duplicateGroups, conflictGroups, missingFieldSummary,
  }
}

function convertValidatedToSamples(validated, existing) {
  const now = nowIso()
  return validated.map(v => {
    const defOp = OPERATORS[0]
    const defResp = { id: 'U005', name: '陈建国' }
    const op = v.parsed.operator || defOp
    const resp = v.parsed.responsible || defResp
    const sourceType = v.parsed.sourceType || 'PURCHASE'
    const allErrors = v.errors
    const hasError = allErrors.some(e => e.severity === 'ERROR')
    let status = 'PRECHECK_PASS'
    if (hasError || v.missing.length > 0) status = 'PRECHECK_FAIL'
    let isDuplicate = false
    let duplicateOfSampleId = undefined
    const dup = existing.find(s => s.sampleCode === v.row.sampleCode)
    if (dup) { isDuplicate = true; duplicateOfSampleId = dup.id; status = 'PRECHECK_FAIL' }
    const missingFields = [...v.missing]
    const fiber = v.parsed.fiber || { short: NaN, medium: NaN, long: NaN }
    const sample = {
      id: uid('sample'),
      sampleCode: v.row.sampleCode || `AUTO-${Date.now()}-${v.rowIndex}`,
      pulpBatch: v.row.pulpBatch || `UNKNOWN-${v.rowIndex}`,
      fiberLength: fiber,
      whiteness: v.parsed.whiteness,
      moistureContent: v.parsed.moisture,
      sourceType,
      sourceInfo: v.row.sourceInfo || '—',
      operatorId: op.id, operatorName: op.name,
      responsiblePersonId: resp.id, responsiblePersonName: resp.name,
      registeredAt: now, status,
      microPhotos: [],
      dryingRecords: v.parsed.moisture != null ? [
        makeDrying(uid('dr'), DRYING_CONDITIONS[0], 100,
          Number((100 * (1 - v.parsed.moisture / 100)).toFixed(3)),
          now, op.name, op.id),
      ] : [],
      auditLogs: [
        makeAudit(uid('a'), '批量导入登记', op, now, undefined, 'DRAFT', `导入行 #${v.rowIndex + 1}`),
        makeAudit(uid('a'), hasError ? '预检失败' : '预检通过', op, now, 'DRAFT', status,
          [v.missing.length && `缺测字段 ${v.missing.length} 个`, isDuplicate && '与库中样本重复'].filter(Boolean).join('；') || '预检完成'),
      ],
      tags: isDuplicate ? ['重复样本'] : v.missing.length ? ['缺测'] : [],
      isDuplicate, duplicateOfSampleId,
      conflictWithSampleId: undefined,
      missingFields,
    }
    return sample
  })
}

/* ================ CRUD ================ */

function listSamples(filter, samples) {
  let list = [...samples]
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    list = list.filter(s =>
      s.sampleCode.toLowerCase().includes(kw) || s.pulpBatch.toLowerCase().includes(kw) ||
      s.sourceInfo.toLowerCase().includes(kw) || s.operatorName.includes(kw) ||
      s.responsiblePersonName.includes(kw))
  }
  if (filter.status !== 'ALL') list = list.filter(s => s.status === filter.status)
  if (filter.sourceType !== 'ALL') list = list.filter(s => s.sourceType === filter.sourceType)
  if (filter.pulpBatch) list = list.filter(s => s.pulpBatch.toLowerCase().includes(filter.pulpBatch.toLowerCase()))
  if (filter.hasIssues !== 'ALL') {
    const has = (s) => s.missingFields.length > 0 || !!s.isDuplicate || !!s.conflictWithSampleId
    list = filter.hasIssues === 'YES' ? list.filter(has) : list.filter(s => !has(s))
  }
  if (filter.judgeConclusion !== 'ALL') list = list.filter(s => s.judgeConclusion === filter.judgeConclusion)
  const total = list.length
  const page = Math.max(1, filter.page)
  const size = Math.max(1, filter.pageSize)
  const start = (page - 1) * size
  return { items: list.slice(start, start + size), total }
}

function getConflictGroup(sample, samples) {
  const group = [sample]
  if (sample.conflictWithSampleId) {
    const other = samples.find(s => s.id === sample.conflictWithSampleId)
    if (other) group.push(other)
  }
  samples.forEach(s => {
    if (s.id !== sample.id && s.pulpBatch === sample.pulpBatch && !group.find(g => g.id === s.id)) group.push(s)
  })
  return group
}

function changeStatus(id, nextStatus, note, samples, operatorName = '张伟', operatorId = 'U001') {
  return samples.map(s => {
    if (s.id !== id) return s
    const log = makeAudit(uid('a'), `状态变更→${nextStatus}`, { id: operatorId, name: operatorName, role: '操作员' }, nowIso(), s.status, nextStatus, note)
    return { ...s, status: nextStatus, auditLogs: [...s.auditLogs, log] }
  })
}

function judgeSample(id, conclusion, remark, samples, by = '李娜') {
  const now = nowIso()
  return samples.map(s => {
    if (s.id !== id) return s
    const nextStatus = conclusion === 'PASS' ? 'JUDGED_PASS' : conclusion === 'FAIL' ? 'JUDGED_FAIL' : 'RETURNED_FOR_REVIEW'
    const log = makeAudit(uid('a'), `判读结论：${conclusion}`, { id: 'U002', name: by, role: '主管' }, now, s.status, nextStatus, remark)
    return { ...s, judgeConclusion: conclusion, judgeRemark: remark, judgeBy: by, judgeAt: now, status: nextStatus, auditLogs: [...s.auditLogs, log] }
  })
}

function addDryingRecord(sampleId, rec, samples) {
  return samples.map(s => {
    if (s.id !== sampleId) return s
    const mc = moistureFromWeights(rec.wetWeightG, rec.dryWeightG)
    const r = { ...rec, id: uid('dr'), moistureContent: mc, recordedAt: nowIso() }
    return {
      ...s, moistureContent: s.moistureContent ?? mc,
      dryingRecords: [...s.dryingRecords, r],
      auditLogs: [...s.auditLogs, makeAudit(uid('a'), '新增烘干称重记录', { id: rec.operatorId, name: rec.operatorName, role: '化验员' }, nowIso(), s.status, s.status, `${rec.conditionName} 含水率 ${mc.toFixed(2)}%`)],
    }
  })
}

function addMicroPhoto(sampleId, photo, samples) {
  return samples.map(s => {
    if (s.id !== sampleId) return s
    const now = nowIso()
    const p = { ...photo, id: uid('mp'), capturedAt: now }
    const op = { id: photo.capturedBy ? 'U' + Math.abs(photo.capturedBy.charCodeAt(0)).toString().padStart(3, '0').slice(0, 3) : s.operatorId || 'U001', name: photo.capturedBy || s.operatorName || '张伟', role: '质检员' }
    const auditNote = `上传显微照片：${photo.label || '未命名'}${photo.magnification ? '（' + photo.magnification + '）' : ''}`
    return {
      ...s,
      microPhotos: [...s.microPhotos, p],
      auditLogs: [...s.auditLogs, makeAudit(uid('a'), '上传显微照片', op, now, s.status, s.status, auditNote)],
    }
  })
}

function exportPreview(samples) {
  return samples.map(s => ({
    样本编号: s.sampleCode, 纸浆批号: s.pulpBatch,
    短纤维_: s.fiberLength.short, 中纤维_: s.fiberLength.medium, 长纤维_: s.fiberLength.long,
    加权平均_mm: s.fiberLength.weightedAverage ?? '',
    白度_: s.whiteness ?? '', 含水率_: s.moistureContent ?? '',
    来源: ({ PURCHASE: '采购', PRODUCTION: '生产', RETURNED: '退货' })[s.sourceType],
    来源详情: s.sourceInfo, 录入人: s.operatorName, 责任人: s.responsiblePersonName,
    登记时间: s.registeredAt, 状态: s.status, 判读结论: s.judgeConclusion ?? '',
    判读人: s.judgeBy ?? '', 判读时间: s.judgeAt ?? '',
    烘干记录数: s.dryingRecords.length, 显微照片数: s.microPhotos.length,
    缺测字段: s.missingFields.join(','), 重复样本: s.isDuplicate ? '是' : '否',
    冲突关联: s.conflictWithSampleId ? samples.find(x => x.id === s.conflictWithSampleId)?.sampleCode ?? s.conflictWithSampleId : '',
  }))
}

/* ================ Express 路由 ================ */

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 预检
app.post('/api/precheck', (req, res) => {
  const { text } = req.body
  const rows = parsePastedText(text || '')
  const samples = readSamples()
  const result = runPrecheck(rows, samples)
  res.json({ success: true, data: result, rows })
})

// 确认导入
app.post('/api/import', (req, res) => {
  const { text } = req.body
  const rows = parsePastedText(text || '')
  const validated = validateRows(rows)
  const existing = readSamples()
  const newSamples = convertValidatedToSamples(validated, existing)
  const all = [...newSamples, ...existing]
  writeSamples(all)
  res.json({ success: true, added: newSamples.length, samples: newSamples })
})

// 列表
app.get('/api/samples', (req, res) => {
  const filter = readFilter()
  const samples = readSamples()
  const { items, total } = listSamples(filter, samples)
  res.json({ success: true, items, total, filter })
})

// 全部样本
app.get('/api/samples/all', (req, res) => {
  res.json({ success: true, samples: readSamples() })
})

// 单条详情
app.get('/api/samples/:id', (req, res) => {
  const samples = readSamples()
  const s = samples.find(x => x.id === req.params.id)
  if (!s) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, sample: s })
})

// 冲突组
app.get('/api/samples/:id/conflict-group', (req, res) => {
  const samples = readSamples()
  const s = samples.find(x => x.id === req.params.id)
  if (!s) return res.status(404).json({ success: false, error: 'Not found' })
  const group = getConflictGroup(s, samples)
  res.json({ success: true, group })
})

// 状态变更
app.post('/api/samples/:id/status', (req, res) => {
  const { status, note, operatorName, operatorId } = req.body
  const samples = readSamples()
  const updated = changeStatus(req.params.id, status, note || '', samples, operatorName, operatorId)
  writeSamples(updated)
  const s = updated.find(x => x.id === req.params.id)
  res.json({ success: true, sample: s })
})

// 判读
app.post('/api/samples/:id/judge', (req, res) => {
  const { conclusion, remark, by } = req.body
  const samples = readSamples()
  const updated = judgeSample(req.params.id, conclusion, remark || '', samples, by)
  writeSamples(updated)
  const s = updated.find(x => x.id === req.params.id)
  res.json({ success: true, sample: s })
})

// 新增烘干记录
app.post('/api/samples/:id/drying', (req, res) => {
  const samples = readSamples()
  const updated = addDryingRecord(req.params.id, req.body, samples)
  writeSamples(updated)
  const s = updated.find(x => x.id === req.params.id)
  res.json({ success: true, sample: s })
})

// 新增显微照片
app.post('/api/samples/:id/photo', (req, res) => {
  const samples = readSamples()
  const updated = addMicroPhoto(req.params.id, req.body, samples)
  writeSamples(updated)
  const s = updated.find(x => x.id === req.params.id)
  res.json({ success: true, sample: s })
})

// 筛选状态
app.get('/api/filter', (req, res) => {
  res.json({ success: true, filter: readFilter() })
})
app.post('/api/filter', (req, res) => {
  writeFilter(req.body)
  res.json({ success: true, filter: readFilter() })
})

// 激活详情
app.get('/api/active-detail', (req, res) => {
  res.json({ success: true, id: readDetail() })
})
app.post('/api/active-detail', (req, res) => {
  writeDetail(req.body.id || null)
  res.json({ success: true, id: readDetail() })
})

// 导出预览
app.get('/api/export', (req, res) => {
  const samples = readSamples()
  const rows = exportPreview(samples)
  res.json({ success: true, rows, count: rows.length })
})

// 重置
app.post('/api/reset', (req, res) => {
  samplesCache = null
  filterCache = null
  detailCache = null
  if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE)
  if (fs.existsSync(FILTER_FILE)) fs.unlinkSync(FILTER_FILE)
  if (fs.existsSync(DETAIL_FILE)) fs.unlinkSync(DETAIL_FILE)
  const seeds = readSamples()
  res.json({ success: true, samples: seeds, count: seeds.length })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: nowIso(), sampleCount: readSamples().length })
})

const PORT = Number(process.env.PORT) || 4010
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================')
  console.log('🚀 纸浆纤维质检后端 API 已启动')
  console.log(`   地址: http://localhost:${PORT}`)
  console.log(`   数据目录: ${DATA_DIR}`)
  console.log(`   样本数量: ${readSamples().length}`)
  console.log('========================================\n')
})

module.exports = app
