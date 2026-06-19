import type { FiberSample, DryingRecord, MicroPhoto, AuditLog } from '../types'

export const DRYING_CONDITIONS = [
  { id: 'COND_STD_105', name: '标准烘干 105℃ 2h', temperatureC: 105, durationMin: 120 },
  { id: 'COND_LOW_80', name: '低温烘干 80℃ 4h', temperatureC: 80, durationMin: 240 },
  { id: 'COND_HIGH_130', name: '高温烘干 130℃ 45min', temperatureC: 130, durationMin: 45 },
]

export const OPERATORS = [
  { id: 'U001', name: '张伟', role: '质检员' },
  { id: 'U002', name: '李娜', role: '质检主管' },
  { id: 'U003', name: '王强', role: '化验员' },
  { id: 'U004', name: '刘芳', role: '技术工程师' },
]

export const RESPONSIBLES = [
  { id: 'U005', name: '陈建国', role: '采购经理' },
  { id: 'U006', name: '赵明辉', role: '生产厂长' },
  { id: 'U007', name: '孙丽萍', role: '质控总监' },
]

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

function moistureFromWeights(wet: number, dry: number): number {
  return Number((((wet - dry) / wet) * 100).toFixed(2))
}

function makeMicro(id: string, caption: string, mag: string, when: string, by: string): MicroPhoto {
  const n = parseInt(id.slice(-1)) % 9 + 1
  const hues = [30, 180, 210, 270, 330]
  const h = hues[parseInt(id.slice(-1)) % hues.length]
  const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
      <defs>
        <radialGradient id='g' cx='50%' cy='50%'>
          <stop offset='0%' stop-color='hsl(${h}, 35%, 85%)'/>
          <stop offset='100%' stop-color='hsl(${h}, 40%, 55%)'/>
        </radialGradient>
      </defs>
      <rect width='400' height='300' fill='url(#g)'/>
      ${Array.from({ length: 30 + n * 3 }).map((_, i) => {
        const x = (i * 41 + 13) % 380 + 10
        const y = (i * 73 + 27) % 280 + 10
        const len = 30 + (i % 6) * 22
        const rot = (i * 37) % 180 - 90
        return `<rect x='${x}' y='${y}' width='${len}' height='${2 + (i % 3)}' 
          fill='hsla(${h}, 60%, ${25 + i % 20}%, 0.75)' 
          transform='rotate(${rot} ${x} ${y})' opacity='0.85'/>`
      }).join('')}
      <text x='20' y='25' font-family='monospace' font-size='12' fill='white' opacity='0.8'>${caption}</text>
      <text x='20' y='285' font-family='monospace' font-size='11' fill='white' opacity='0.7'>${mag}  ·  ${new Date(when).toLocaleString('zh-CN')}</text>
    </svg>`
  )}`
  return { id, url: svg, caption, magnification: mag, capturedAt: when, capturedBy: by }
}

function makeDrying(
  id: string,
  cond: typeof DRYING_CONDITIONS[number],
  wet: number,
  dry: number,
  when: string,
  opName: string,
  opId: string,
  notes?: string
): DryingRecord {
  return {
    id,
    conditionId: cond.id,
    conditionName: cond.name,
    temperatureC: cond.temperatureC,
    durationMin: cond.durationMin,
    wetWeightG: wet,
    dryWeightG: dry,
    moistureContent: moistureFromWeights(wet, dry),
    operatorId: opId,
    operatorName: opName,
    recordedAt: when,
    notes,
  }
}

function makeAudit(id: string, action: string, op: typeof OPERATORS[number], ts: string, from?: any, to?: any, note?: string): AuditLog {
  return { id, action, operatorId: op.id, operatorName: op.name, timestamp: ts, fromStatus: from, toStatus: to, note }
}

/**
 * 预置 9 条种子数据，覆盖以下场景：
 *  1. 正常 · 判读合格
 *  2. 正常 · 待判读
 *  3. 缺测 · 白度缺失
 *  4. 缺测 · 纤维长度分布 & 含水率双重缺失
 *  5. 重复样本 · 与样本1同批次同编号
 *  6. 冲突 · 同批次不同烘干条件判读差异
 *  7. 冲突（配对）· 同批次不同烘干条件
 *  8. 锁定 · 质检审核中
 *  9. 退回复判 · 原判读合格被打回
 */
export function buildSeedSamples(): FiberSample[] {
  const [u1, u2, u3, u4] = OPERATORS
  const [c1, c2, c3] = DRYING_CONDITIONS
  const [r1, r2, r3] = RESPONSIBLES

  const sample1: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PK-20260610-001',
    pulpBatch: 'PK-SW-2026-06-083',
    fiberLength: { short: 18.5, medium: 57.2, long: 24.3, weightedAverage: 2.38 },
    whiteness: 84.7,
    moistureContent: moistureFromWeights(10.243, 9.682),
    sourceType: 'PURCHASE',
    sourceInfo: '供应商：山东华泰纸业 | 合同号：HT-2026-0184 | 到货日期：2026-06-10',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r1.id, responsiblePersonName: r1.name,
    registeredAt: daysAgo(10),
    judgeConclusion: 'PASS',
    judgeRemark: '纤维长度分布均衡，白度达标，含水率在合理范围，准予入库。',
    judgeBy: u2.name, judgeAt: daysAgo(8),
    status: 'JUDGED_PASS',
    microPhotos: [
      makeMicro('mp_001a', '主视面 · 纤维形态', '×400 光学显微镜', daysAgo(9), u3.name),
      makeMicro('mp_001b', '次视面 · 杂质检测', '×600 荧光显微镜', daysAgo(9), u3.name),
    ],
    dryingRecords: [
      makeDrying('dr_001a', c1, 10.243, 9.682, daysAgo(9), u3.name, u3.id, '使用标准烘干流程'),
    ],
    auditLogs: [
      makeAudit('a001', '登记入库', u1, daysAgo(10), undefined, 'DRAFT', '录入 1 条样本信息'),
      makeAudit('a002', '预检通过', u1, daysAgo(10), 'DRAFT', 'PRECHECK_PASS', '全部字段校验通过'),
      makeAudit('a003', '提交判读', u1, daysAgo(9), 'PRECHECK_PASS', 'PENDING_JUDGE'),
      makeAudit('a004', '判读完成', u2, daysAgo(8), 'PENDING_JUDGE', 'JUDGED_PASS', '准予入库'),
    ],
    tags: ['针叶木浆', 'A级'],
    missingFields: [],
  }

  const sample2: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PD-20260612-014',
    pulpBatch: 'PD-HW-2026-06-042',
    fiberLength: { short: 12.1, medium: 64.8, long: 23.1, weightedAverage: 1.75 },
    whiteness: 81.2,
    moistureContent: moistureFromWeights(9.872, 9.315),
    sourceType: 'PRODUCTION',
    sourceInfo: '车间：一号蒸煮车间 | 班次：乙班 | 工段：漂白段 03',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r2.id, responsiblePersonName: r2.name,
    registeredAt: daysAgo(3),
    status: 'PENDING_JUDGE',
    microPhotos: [
      makeMicro('mp_002a', '纤维形态 ×400', '×400 光学显微镜', daysAgo(3), u3.name),
    ],
    dryingRecords: [
      makeDrying('dr_002a', c1, 9.872, 9.315, daysAgo(3), u3.name, u3.id),
    ],
    auditLogs: [
      makeAudit('a011', '登记入库', u1, daysAgo(3), undefined, 'DRAFT'),
      makeAudit('a012', '预检通过', u1, daysAgo(3), 'DRAFT', 'PRECHECK_PASS'),
      makeAudit('a013', '提交判读', u1, daysAgo(3), 'PRECHECK_PASS', 'PENDING_JUDGE'),
    ],
    tags: ['阔叶木浆', '生产样'],
    missingFields: [],
  }

  const sample3: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PK-20260614-007',
    pulpBatch: 'PK-SW-2026-06-112',
    fiberLength: { short: 16.0, medium: 58.5, long: 25.5, weightedAverage: 2.41 },
    whiteness: null,
    moistureContent: moistureFromWeights(10.001, 9.421),
    sourceType: 'PURCHASE',
    sourceInfo: '供应商：山东太阳纸业 | 合同号：HT-2026-0201',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r1.id, responsiblePersonName: r1.name,
    registeredAt: daysAgo(1),
    status: 'PRECHECK_FAIL',
    microPhotos: [],
    dryingRecords: [
      makeDrying('dr_003a', c1, 10.001, 9.421, daysAgo(1), u3.name, u3.id),
    ],
    auditLogs: [
      makeAudit('a021', '登记入库', u1, daysAgo(1), undefined, 'DRAFT'),
      makeAudit('a022', '预检失败', u1, daysAgo(1), 'DRAFT', 'PRECHECK_FAIL', '白度值缺失'),
    ],
    tags: ['针叶木浆', '缺测'],
    missingFields: ['whiteness'],
  }

  const sample4: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-RT-20260613-022',
    pulpBatch: 'PD-HW-2026-05-198',
    fiberLength: { short: NaN, medium: NaN, long: NaN },
    whiteness: null,
    moistureContent: null,
    sourceType: 'RETURNED',
    sourceInfo: '原入库：批次 198 | 退货原因：客户投诉纸品发脆 | 退货单号：RT-2026-027',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r3.id, responsiblePersonName: r3.name,
    registeredAt: hoursAgo(8),
    status: 'PRECHECK_FAIL',
    microPhotos: [],
    dryingRecords: [],
    auditLogs: [
      makeAudit('a031', '登记入库', u1, hoursAgo(8), undefined, 'DRAFT'),
      makeAudit('a032', '预检失败', u1, hoursAgo(8), 'DRAFT', 'PRECHECK_FAIL', '纤维分布、白度、含水率均缺测'),
    ],
    tags: ['退货', '多字段缺测'],
    missingFields: ['fiberLength.short', 'fiberLength.medium', 'fiberLength.long', 'whiteness', 'moistureContent'],
  }

  const sample5: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PK-20260610-001',
    pulpBatch: 'PK-SW-2026-06-083',
    fiberLength: { short: 18.5, medium: 57.2, long: 24.3, weightedAverage: 2.38 },
    whiteness: 84.7,
    moistureContent: moistureFromWeights(10.243, 9.682),
    sourceType: 'PURCHASE',
    sourceInfo: '供应商：山东华泰纸业 | 合同号：HT-2026-0184',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r1.id, responsiblePersonName: r1.name,
    registeredAt: hoursAgo(2),
    isDuplicate: true,
    duplicateOfSampleId: sample1.id,
    status: 'PRECHECK_FAIL',
    microPhotos: [],
    dryingRecords: [
      makeDrying('dr_005a', c1, 10.243, 9.682, hoursAgo(2), u3.name, u3.id),
    ],
    auditLogs: [
      makeAudit('a041', '登记入库', u1, hoursAgo(2), undefined, 'DRAFT'),
      makeAudit('a042', '预检失败', u1, hoursAgo(2), 'DRAFT', 'PRECHECK_FAIL', `样本编号重复：与 ${sample1.sampleCode} 冲突`),
    ],
    tags: ['重复样本'],
    missingFields: [],
  }

  // 场景 6 & 7：同批次，不同烘干条件，判读冲突
  const sample6: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PK-20260608-019-A',
    pulpBatch: 'PK-CT-2026-06-055',
    fiberLength: { short: 21.3, medium: 54.1, long: 24.6, weightedAverage: 2.10 },
    whiteness: 83.5,
    moistureContent: moistureFromWeights(10.500, 9.820),
    sourceType: 'PURCHASE',
    sourceInfo: '供应商：福建青山纸业 | 合同号：HT-2026-0167 | 竹浆',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r1.id, responsiblePersonName: r1.name,
    registeredAt: daysAgo(5),
    judgeConclusion: 'PASS',
    judgeRemark: '含水率 6.48%，符合 ≤7% 标准。',
    judgeBy: u2.name, judgeAt: daysAgo(4),
    status: 'JUDGED_PASS',
    conflictWithSampleId: undefined,
    microPhotos: [
      makeMicro('mp_006a', '竹浆纤维 · 标准烘干', '×400 光学显微镜', daysAgo(5), u3.name),
    ],
    dryingRecords: [
      makeDrying('dr_006a', c1, 10.500, 9.820, daysAgo(5), u3.name, u3.id, '标准条件：105℃ 2h'),
    ],
    auditLogs: [
      makeAudit('a051', '登记入库', u1, daysAgo(5), undefined, 'DRAFT'),
      makeAudit('a052', '预检通过', u1, daysAgo(5), 'DRAFT', 'PRECHECK_PASS'),
      makeAudit('a053', '提交判读', u1, daysAgo(5), 'PRECHECK_PASS', 'PENDING_JUDGE'),
      makeAudit('a054', '判读完成', u2, daysAgo(4), 'PENDING_JUDGE', 'JUDGED_PASS', '含水率 6.48% 在允许范围'),
    ],
    tags: ['竹浆', '冲突组-055-A'],
    missingFields: [],
  }

  const sample7: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PK-20260608-019-B',
    pulpBatch: 'PK-CT-2026-06-055',
    fiberLength: { short: 21.3, medium: 54.1, long: 24.6, weightedAverage: 2.10 },
    whiteness: 83.5,
    moistureContent: moistureFromWeights(10.500, 9.701),
    sourceType: 'PURCHASE',
    sourceInfo: '供应商：福建青山纸业 | 合同号：HT-2026-0167 | 竹浆 · 平行样',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r1.id, responsiblePersonName: r1.name,
    registeredAt: daysAgo(5),
    judgeConclusion: 'CONFLICT',
    judgeRemark: `高温 130℃ 烘干含水率 ${moistureFromWeights(10.500, 9.701).toFixed(2)}%，与标准样 ${sample6.dryingRecords[0].moistureContent.toFixed(2)}% 偏差 ${Math.abs(moistureFromWeights(10.500, 9.701) - sample6.dryingRecords[0].moistureContent).toFixed(2)}pp，触发判读冲突。`,
    judgeBy: u2.name, judgeAt: daysAgo(4),
    status: 'RETURNED_FOR_REVIEW',
    conflictWithSampleId: sample6.id,
    microPhotos: [
      makeMicro('mp_007a', '竹浆纤维 · 高温烘干', '×400 光学显微镜', daysAgo(5), u4.name),
    ],
    dryingRecords: [
      makeDrying('dr_007a', c3, 10.500, 9.701, daysAgo(5), u4.name, u4.id, '高温条件：130℃ 45min  ·  与标准样差异显著'),
    ],
    auditLogs: [
      makeAudit('a061', '登记入库', u1, daysAgo(5), undefined, 'DRAFT'),
      makeAudit('a062', '预检通过', u1, daysAgo(5), 'DRAFT', 'PRECHECK_PASS'),
      makeAudit('a063', '提交判读', u1, daysAgo(5), 'PRECHECK_PASS', 'PENDING_JUDGE'),
      makeAudit('a064', '判读冲突', u2, daysAgo(4), 'PENDING_JUDGE', 'RETURNED_FOR_REVIEW', `与 ${sample6.sampleCode} 同批次，含水率判定差异超阈值`),
    ],
    tags: ['竹浆', '冲突组-055-B', '烘干差异'],
    missingFields: [],
  }
  sample6.conflictWithSampleId = sample7.id

  const sample8: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-PD-20260605-031',
    pulpBatch: 'PD-SW-2026-06-005',
    fiberLength: { short: 15.2, medium: 60.1, long: 24.7, weightedAverage: 2.25 },
    whiteness: 82.9,
    moistureContent: moistureFromWeights(10.120, 9.560),
    sourceType: 'PRODUCTION',
    sourceInfo: '车间：二号硫酸盐浆车间 | 工段：洗涤筛选',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r2.id, responsiblePersonName: r2.name,
    registeredAt: daysAgo(15),
    judgeConclusion: 'PASS',
    judgeRemark: '全部指标达标。',
    judgeBy: u2.name, judgeAt: daysAgo(12),
    status: 'LOCKED',
    microPhotos: [
      makeMicro('mp_008a', '木浆纤维 · 扫描电镜', '×800 SEM', daysAgo(15), u3.name),
    ],
    dryingRecords: [
      makeDrying('dr_008a', c1, 10.120, 9.560, daysAgo(15), u3.name, u3.id),
    ],
    auditLogs: [
      makeAudit('a071', '登记入库', u1, daysAgo(15), undefined, 'DRAFT'),
      makeAudit('a072', '预检通过', u1, daysAgo(15), 'DRAFT', 'PRECHECK_PASS'),
      makeAudit('a073', '提交判读', u1, daysAgo(14), 'PRECHECK_PASS', 'PENDING_JUDGE'),
      makeAudit('a074', '判读完成', u2, daysAgo(12), 'PENDING_JUDGE', 'JUDGED_PASS'),
      makeAudit('a075', '锁定归档', r3, daysAgo(6), 'JUDGED_PASS', 'LOCKED', '年度质量审计样本，锁定保护'),
    ],
    tags: ['针叶木浆', '审计锁定'],
    missingFields: [],
  }

  const sample9: FiberSample = {
    id: uid('sample'),
    sampleCode: 'S-RT-20260611-009',
    pulpBatch: 'PD-HW-2026-05-155',
    fiberLength: { short: 13.8, medium: 61.5, long: 24.7, weightedAverage: 1.82 },
    whiteness: 79.4,
    moistureContent: moistureFromWeights(10.330, 9.705),
    sourceType: 'RETURNED',
    sourceInfo: '原入库批次 155 | 客户：华东出版社 | 异议：纸张白度不达标',
    operatorId: u1.id, operatorName: u1.name,
    responsiblePersonId: r3.id, responsiblePersonName: r3.name,
    registeredAt: daysAgo(7),
    judgeConclusion: 'FAIL',
    judgeRemark: '初判：白度 79.4 低于合同要求 ≥80，判不合格。但供应商对测量方法提出异议，现退回重测。',
    judgeBy: u2.name, judgeAt: daysAgo(6),
    status: 'RETURNED_FOR_REVIEW',
    microPhotos: [
      makeMicro('mp_009a', '漂白浆纤维 · 荧光检查', '×500 荧光', daysAgo(7), u4.name),
    ],
    dryingRecords: [
      makeDrying('dr_009a', c2, 10.330, 9.705, daysAgo(7), u4.name, u4.id, '低温 80℃ 4h，减少纤维热解'),
    ],
    auditLogs: [
      makeAudit('a081', '登记入库', u1, daysAgo(7), undefined, 'DRAFT'),
      makeAudit('a082', '预检通过', u1, daysAgo(7), 'DRAFT', 'PRECHECK_PASS'),
      makeAudit('a083', '提交判读', u1, daysAgo(6), 'PRECHECK_PASS', 'PENDING_JUDGE'),
      makeAudit('a084', '判读完成', u2, daysAgo(6), 'PENDING_JUDGE', 'JUDGED_FAIL', '白度不达标'),
      makeAudit('a085', '退回复判', r3, daysAgo(2), 'JUDGED_FAIL', 'RETURNED_FOR_REVIEW', '供应商异议，重新进行白度与烘干对比测试'),
    ],
    tags: ['阔叶木浆', '退回复判', '白度争议'],
    missingFields: [],
  }

  return [sample1, sample2, sample3, sample4, sample5, sample6, sample7, sample8, sample9]
}

export function uidFn(prefix = 'id') { return uid(prefix) }
export function nowFn() { return now() }
export { daysAgo, hoursAgo, makeDrying, makeMicro, makeAudit, moistureFromWeights }
