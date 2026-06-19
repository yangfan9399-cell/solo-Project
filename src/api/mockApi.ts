import type {
  FiberSample, ImportRow, PrecheckResult, PrecheckIssue,
  FiberStatus, FilterState, DryingRecord, MicroPhoto
} from '../types'
import { buildSeedSamples, uidFn, nowFn, makeAudit, OPERATORS, DRYING_CONDITIONS, makeDrying, makeMicro, moistureFromWeights } from '../data/seed'

const STORAGE_KEY = 'pulp_fiber_workbench_v1'
const FILTER_KEY = 'pulp_fiber_filter_v1'
const DETAIL_KEY = 'pulp_fiber_active_detail_v1'
const SEED_FLAG_KEY = 'pulp_fiber_seeded_v1'

function readStore(): FiberSample[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeStore(samples: FiberSample[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples))
}

export function ensureSeed(): FiberSample[] {
  if (!localStorage.getItem(SEED_FLAG_KEY)) {
    const seeds = buildSeedSamples()
    writeStore(seeds)
    localStorage.setItem(SEED_FLAG_KEY, '1')
    return seeds
  }
  return readStore()
}

export function resetAllData(): FiberSample[] {
  localStorage.removeItem(SEED_FLAG_KEY)
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(FILTER_KEY)
  localStorage.removeItem(DETAIL_KEY)
  return ensureSeed()
}

export function saveFilter(f: Partial<FilterState>) {
  const cur = loadFilter()
  localStorage.setItem(FILTER_KEY, JSON.stringify({ ...cur, ...f }))
}

export function loadFilter(): FilterState {
  try {
    const raw = localStorage.getItem(FILTER_KEY)
    if (!raw) throw 0
    return JSON.parse(raw) as FilterState
  } catch {
    return {
      keyword: '',
      status: 'ALL',
      sourceType: 'ALL',
      pulpBatch: '',
      hasIssues: 'ALL',
      judgeConclusion: 'ALL',
      page: 1,
      pageSize: 10,
    }
  }
}

export function saveActiveDetail(id: string | null) {
  if (id) localStorage.setItem(DETAIL_KEY, id)
  else localStorage.removeItem(DETAIL_KEY)
}

export function loadActiveDetail(): string | null {
  return localStorage.getItem(DETAIL_KEY)
}

/* ---------------- 字段与值域校验 ---------------- */

const WHITENESS_MIN = 30
const WHITENESS_MAX = 100
const MOISTURE_MIN = 0
const MOISTURE_MAX = 30

export function parsePastedText(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : /\s{2,}/

  const rows: ImportRow[] = []
  const header = lines[0].split(sep).map(c => c.trim().toLowerCase())
  const hasHeader = header.some(h => /样本|sample|编号|code/.test(h))
  const start = hasHeader ? 1 : 0

  for (let i = start; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim())
    const r: ImportRow = {
      sampleCode: cells[0] || '',
      pulpBatch: cells[1] || '',
      fiberShort: cells[2] || '',
      fiberMedium: cells[3] || '',
      fiberLong: cells[4] || '',
      whiteness: cells[5] || '',
      moistureContent: cells[6] || '',
      sourceType: cells[7] || '',
      sourceInfo: cells[8] || '',
      operatorName: cells[9] || '',
      responsiblePersonName: cells[10] || '',
    }
    rows.push(r)
  }
  return rows
}

function findMissingFields(r: ImportRow): string[] {
  const miss: string[] = []
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

export interface ValidatedRow {
  rowIndex: number
  row: ImportRow
  missing: string[]
  errors: PrecheckIssue[]
  parsed: {
    whiteness: number | null
    moisture: number | null
    fiber: { short: number; medium: number; long: number; weightedAverage?: number } | null
    sourceType: FiberSample['sourceType'] | null
    operator: typeof OPERATORS[number] | null
    responsible: { id: string; name: string } | null
  }
}

export function validateRows(rows: ImportRow[]): ValidatedRow[] {
  return rows.map((r, idx) => {
    const errors: PrecheckIssue[] = []
    const missing = findMissingFields(r)

    for (const f of missing) {
      errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: f, severity: 'ERROR', type: 'MISSING_FIELD', message: `字段 ${f} 缺测/未填写` })
    }

    let whiteness: number | null = null
    if (r.whiteness) {
      const v = Number(r.whiteness)
      if (!Number.isFinite(v)) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'whiteness', severity: 'ERROR', type: 'INVALID_FORMAT', message: `白度 "${r.whiteness}" 格式无效，应为数字` })
      else if (v < WHITENESS_MIN || v > WHITENESS_MAX) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'whiteness', severity: 'WARNING', type: 'INVALID_RANGE', message: `白度 ${v} 超出合理范围 [${WHITENESS_MIN}, ${WHITENESS_MAX}]` })
      else whiteness = v
    }

    let moisture: number | null = null
    if (r.moistureContent) {
      const v = Number(r.moistureContent)
      if (!Number.isFinite(v)) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'moistureContent', severity: 'ERROR', type: 'INVALID_FORMAT', message: `含水率 "${r.moistureContent}" 格式无效` })
      else if (v < MOISTURE_MIN || v > MOISTURE_MAX) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'moistureContent', severity: 'WARNING', type: 'INVALID_RANGE', message: `含水率 ${v} 超出合理范围 [${MOISTURE_MIN}, ${MOISTURE_MAX}]` })
      else moisture = v
    }

    let fiber: ValidatedRow['parsed']['fiber'] = null
    if (r.fiberShort && r.fiberMedium && r.fiberLong) {
      const s = Number(r.fiberShort), m = Number(r.fiberMedium), l = Number(r.fiberLong)
      if (![s, m, l].every(n => Number.isFinite(n))) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'fiberLength', severity: 'ERROR', type: 'INVALID_FORMAT', message: '纤维长度分布应为数字' })
      else {
        const total = s + m + l
        if (Math.abs(total - 100) > 1) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'fiberLength', severity: 'WARNING', type: 'INVALID_RANGE', message: `纤维分布之和 = ${total.toFixed(2)}%，偏离 100%` })
        const wa = s * 0.8 + m * 2.2 + l * 3.5
        fiber = { short: s, medium: m, long: l, weightedAverage: Number(wa.toFixed(2)) }
      }
    }

    let sourceType: FiberSample['sourceType'] | null = null
    if (r.sourceType) {
      const s = r.sourceType.toUpperCase()
      if (s === 'PURCHASE' || s === 'PRODUCTION' || s === 'RETURNED' || /采购|PURCHASE|PK/.test(s)) sourceType = 'PURCHASE'
      else if (/生产|PRODUCTION|PD/.test(s)) sourceType = 'PRODUCTION'
      else if (/退货|退回|RETURN|RT/.test(s)) sourceType = 'RETURNED'
      else errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'sourceType', severity: 'ERROR', type: 'INVALID_FORMAT', message: `来源类型 "${r.sourceType}" 无法识别，应为 PURCHASE/PRODUCTION/RETURNED` })
    }

    const operator = OPERATORS.find(o => o.name === r.operatorName) || OPERATORS.find(o => r.operatorName && o.name.includes(r.operatorName)) || null
    if (r.operatorName && !operator) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'operatorName', severity: 'WARNING', type: 'INVALID_FORMAT', message: `操作员 "${r.operatorName}" 不在系统名单，将使用默认` })

    const responsibleNames = ['陈建国', '赵明辉', '孙丽萍', '张伟', '李娜', '王强', '刘芳']
    const responsibleIds = ['U005', 'U006', 'U007', 'U001', 'U002', 'U003', 'U004']
    const rIdx = responsibleNames.indexOf(r.responsiblePersonName)
    const responsible = rIdx >= 0 ? { id: responsibleIds[rIdx], name: responsibleNames[rIdx] } : null
    if (r.responsiblePersonName && !responsible) errors.push({ rowIndex: idx, sampleCode: r.sampleCode, field: 'responsiblePersonName', severity: 'WARNING', type: 'INVALID_FORMAT', message: `责任人 "${r.responsiblePersonName}" 不在系统名单，将使用默认` })

    return {
      rowIndex: idx,
      row: r,
      missing,
      errors,
      parsed: { whiteness, moisture, fiber, sourceType, operator, responsible },
    }
  })
}

export function runPrecheck(rows: ImportRow[], existingSamples: FiberSample[]): PrecheckResult {
  const validated = validateRows(rows)
  let allIssues: PrecheckIssue[] = validated.flatMap(v => v.errors)

  const byCode = new Map<string, number[]>()
  validated.forEach((v, i) => {
    if (!v.row.sampleCode) return
    if (!byCode.has(v.row.sampleCode)) byCode.set(v.row.sampleCode, [])
    byCode.get(v.row.sampleCode)!.push(i)
  })

  const duplicateGroups: string[][] = []
  byCode.forEach((indexes, code) => {
    if (indexes.length > 1) {
      duplicateGroups.push([code, ...indexes.map(i => `行${i + 1}`)])
      indexes.forEach(i => {
        allIssues.push({ rowIndex: validated[i].rowIndex, sampleCode: code, field: 'sampleCode', severity: 'ERROR', type: 'DUPLICATE', message: `与本组其它行样本编号重复（共 ${indexes.length} 条）` })
      })
    } else {
      const exist = existingSamples.find(s => s.sampleCode === code)
      if (exist) {
        duplicateGroups.push([code, `行${indexes[0] + 1}`, `已存在：${exist.id.slice(0, 10)}`])
        allIssues.push({ rowIndex: validated[indexes[0]].rowIndex, sampleCode: code, field: 'sampleCode', severity: 'WARNING', type: 'DUPLICATE', message: `样本编号 ${code} 已存在于库中（${exist.status}）` })
      }
    }
  })

  const byBatch = new Map<string, { row: number; moisture: number | null }[]>()
  validated.forEach((v, i) => {
    if (!v.row.pulpBatch) return
    if (!byBatch.has(v.row.pulpBatch)) byBatch.set(v.row.pulpBatch, [])
    byBatch.get(v.row.pulpBatch)!.push({ row: i, moisture: v.parsed.moisture })
  })
  const conflictGroups: string[][] = []
  byBatch.forEach((items, batch) => {
    if (items.length < 2) return
    const moistures = items.map(i => i.moisture).filter((m): m is number => m != null)
    if (moistures.length >= 2) {
      const span = Math.max(...moistures) - Math.min(...moistures)
      if (span >= 1.5) {
        conflictGroups.push([batch, `跨度 ${span.toFixed(2)}pp`, ...items.map(it => `行${it.row + 1}`)])
        items.forEach(it => {
          allIssues.push({ rowIndex: validated[it.row].rowIndex, sampleCode: validated[it.row].row.sampleCode, field: 'moistureContent', severity: 'WARNING', type: 'CONFLICT_BATCH', message: `批次 ${batch} 内含水率跨度 ${span.toFixed(2)}pp，可能存在烘干条件差异` })
        })
      }
    }
  })

  const missingFieldSummary: Record<string, number> = {}
  validated.forEach(v => v.missing.forEach(f => { missingFieldSummary[f] = (missingFieldSummary[f] || 0) + 1 }))

  const passRows = validated.filter(v => v.errors.filter(e => e.severity === 'ERROR').length === 0).length

  return {
    totalRows: rows.length,
    passRows,
    issues: allIssues.sort((a, b) => {
      const rank = { ERROR: 0, WARNING: 1, INFO: 2 } as const
      return rank[a.severity] - rank[b.severity] || a.rowIndex - b.rowIndex
    }),
    duplicateGroups,
    conflictGroups,
    missingFieldSummary,
  }
}

export function convertValidatedToSamples(validated: ValidatedRow[], existing: FiberSample[]): FiberSample[] {
  const now = nowFn()
  return validated.map(v => {
    const defOp = OPERATORS[0]
    const defResp = { id: 'U005', name: '陈建国' }
    const op = v.parsed.operator || defOp
    const resp = v.parsed.responsible || defResp
    const sourceType = v.parsed.sourceType || 'PURCHASE'
    const allErrors = v.errors
    const hasError = allErrors.some(e => e.severity === 'ERROR')

    let status: FiberStatus = 'PRECHECK_PASS'
    if (hasError || v.missing.length > 0) status = 'PRECHECK_FAIL'

    let isDuplicate = false
    let duplicateOfSampleId: string | undefined
    const dup = existing.find(s => s.sampleCode === v.row.sampleCode)
    if (dup) { isDuplicate = true; duplicateOfSampleId = dup.id; status = 'PRECHECK_FAIL' }

    const conflicts = validated.filter((o, oi) => oi !== v.rowIndex && o.row.pulpBatch === v.row.pulpBatch && v.row.pulpBatch)
    let conflictWithSampleId: string | undefined
    if (conflicts.length > 0 && v.parsed.moisture != null) {
      const existConflict = existing.find(s => s.pulpBatch === v.row.pulpBatch && s.dryingRecords.length > 0)
      if (existConflict) conflictWithSampleId = existConflict.id
    }

    const missingFields = [...v.missing]
    if (!v.row.sampleCode && !missingFields.includes('sampleCode')) missingFields.push('sampleCode')

    const fiber = v.parsed.fiber || { short: NaN, medium: NaN, long: NaN }
    const sample: FiberSample = {
      id: uidFn('sample'),
      sampleCode: v.row.sampleCode || `AUTO-${Date.now()}-${v.rowIndex}`,
      pulpBatch: v.row.pulpBatch || `UNKNOWN-${v.rowIndex}`,
      fiberLength: fiber,
      whiteness: v.parsed.whiteness,
      moistureContent: v.parsed.moisture,
      sourceType,
      sourceInfo: v.row.sourceInfo || '—',
      operatorId: op.id,
      operatorName: op.name,
      responsiblePersonId: resp.id,
      responsiblePersonName: resp.name,
      registeredAt: now,
      status,
      microPhotos: [],
      dryingRecords: v.parsed.moisture != null ? [
        makeDrying(
          uidFn('dr'), DRYING_CONDITIONS[0],
          Number((100).toFixed(3)),
          Number((100 * (1 - v.parsed.moisture / 100)).toFixed(3)),
          now, op.name, op.id
        ),
      ] : [],
      auditLogs: [
        makeAudit(uidFn('a'), '批量导入登记', op, now, undefined, 'DRAFT', `导入行 #${v.rowIndex + 1}`),
        makeAudit(uidFn('a'), hasError ? '预检失败' : '预检通过', op, now, 'DRAFT', status,
          [
            v.missing.length && `缺测字段 ${v.missing.length} 个`,
            isDuplicate && '与库中样本重复',
            allErrors.filter(e => e.severity === 'WARNING').length && `警告 ${allErrors.filter(e => e.severity === 'WARNING').length} 条`
          ].filter(Boolean).join('；') || '预检完成'
        ),
      ],
      tags: isDuplicate ? ['重复样本'] : v.missing.length ? ['缺测'] : [],
      isDuplicate,
      duplicateOfSampleId,
      conflictWithSampleId,
      missingFields,
    }
    return sample
  })
}

/* ---------------- CRUD ---------------- */

export function listSamples(filter: FilterState, samples: FiberSample[]) {
  let list = [...samples]
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    list = list.filter(s =>
      s.sampleCode.toLowerCase().includes(kw) ||
      s.pulpBatch.toLowerCase().includes(kw) ||
      s.sourceInfo.toLowerCase().includes(kw) ||
      s.operatorName.includes(kw) ||
      s.responsiblePersonName.includes(kw)
    )
  }
  if (filter.status !== 'ALL') list = list.filter(s => s.status === filter.status)
  if (filter.sourceType !== 'ALL') list = list.filter(s => s.sourceType === filter.sourceType)
  if (filter.pulpBatch) list = list.filter(s => s.pulpBatch.toLowerCase().includes(filter.pulpBatch.toLowerCase()))
  if (filter.hasIssues !== 'ALL') {
    const has = (s: FiberSample) => s.missingFields.length > 0 || !!s.isDuplicate || !!s.conflictWithSampleId
    list = filter.hasIssues === 'YES' ? list.filter(has) : list.filter(s => !has(s))
  }
  if (filter.judgeConclusion !== 'ALL') list = list.filter(s => s.judgeConclusion === filter.judgeConclusion)

  const total = list.length
  const page = Math.max(1, filter.page)
  const size = Math.max(1, filter.pageSize)
  const start = (page - 1) * size
  return { items: list.slice(start, start + size), total }
}

export function getSample(id: string, samples: FiberSample[]): FiberSample | undefined {
  return samples.find(s => s.id === id)
}

export function getConflictGroup(sample: FiberSample, samples: FiberSample[]): FiberSample[] {
  const group = [sample]
  if (sample.conflictWithSampleId) {
    const other = samples.find(s => s.id === sample.conflictWithSampleId)
    if (other) group.push(other)
  }
  samples.forEach(s => {
    if (s.id !== sample.id && s.pulpBatch === sample.pulpBatch && !group.find(g => g.id === s.id)) {
      group.push(s)
    }
  })
  return group
}

export function addSamples(newOnes: FiberSample[], existing: FiberSample[]): FiberSample[] {
  return [...newOnes, ...existing]
}

export function updateSample(id: string, patch: Partial<FiberSample>, samples: FiberSample[]): FiberSample[] {
  return samples.map(s => s.id === id ? { ...s, ...patch } : s)
}

export function changeStatus(id: string, nextStatus: FiberStatus, note: string, samples: FiberSample[], operatorName = '张伟', operatorId = 'U001'): FiberSample[] {
  return samples.map(s => {
    if (s.id !== id) return s
    const log = makeAudit(uidFn('a'), `状态变更→${nextStatus}`, { id: operatorId, name: operatorName, role: '操作员' } as any, nowFn(), s.status, nextStatus, note)
    const hasMissing = s.missingFields.length > 0
    const canJudge = nextStatus === 'PENDING_JUDGE' && !hasMissing && s.status === 'PRECHECK_PASS'
    const force = nextStatus === 'PENDING_JUDGE'
    const actualNext: FiberStatus = force || canJudge ? nextStatus : nextStatus
    return { ...s, status: actualNext, auditLogs: [...s.auditLogs, log] }
  })
}

export function judgeSample(id: string, conclusion: 'PASS' | 'FAIL' | 'CONFLICT', remark: string, samples: FiberSample[], by = '李娜'): FiberSample[] {
  const now = nowFn()
  return samples.map(s => {
    if (s.id !== id) return s
    const nextStatus: FiberStatus =
      conclusion === 'PASS' ? 'JUDGED_PASS'
        : conclusion === 'FAIL' ? 'JUDGED_FAIL'
          : 'RETURNED_FOR_REVIEW'
    const log = makeAudit(uidFn('a'), `判读结论：${conclusion}`, { id: 'U002', name: by, role: '主管' } as any, now, s.status, nextStatus, remark)
    return {
      ...s,
      judgeConclusion: conclusion,
      judgeRemark: remark,
      judgeBy: by,
      judgeAt: now,
      status: nextStatus,
      auditLogs: [...s.auditLogs, log],
    }
  })
}

export function addDryingRecord(sampleId: string, rec: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>, samples: FiberSample[]): FiberSample[] {
  return samples.map(s => {
    if (s.id !== sampleId) return s
    const mc = moistureFromWeights(rec.wetWeightG, rec.dryWeightG)
    const r: DryingRecord = { ...rec, id: uidFn('dr'), moistureContent: mc, recordedAt: nowFn() }
    return {
      ...s,
      moistureContent: s.moistureContent ?? mc,
      dryingRecords: [...s.dryingRecords, r],
      auditLogs: [...s.auditLogs, makeAudit(uidFn('a'), '新增烘干称重记录', { id: rec.operatorId, name: rec.operatorName, role: '化验员' } as any, nowFn(), s.status, s.status, `${rec.conditionName} 含水率 ${mc.toFixed(2)}%`)],
    }
  })
}

export function addMicroPhoto(sampleId: string, photo: Omit<MicroPhoto, 'id' | 'capturedAt'>, samples: FiberSample[]): FiberSample[] {
  return samples.map(s => {
    if (s.id !== sampleId) return s
    const p: MicroPhoto = { ...photo, id: uidFn('mp'), capturedAt: nowFn() }
    return { ...s, microPhotos: [...s.microPhotos, p] }
  })
}

export function exportPreview(samples: FiberSample[]): any[] {
  return samples.map(s => ({
    样本编号: s.sampleCode,
    纸浆批号: s.pulpBatch,
    短纤维_: s.fiberLength.short,
    中纤维_: s.fiberLength.medium,
    长纤维_: s.fiberLength.long,
    加权平均_mm: s.fiberLength.weightedAverage ?? '',
    白度_: s.whiteness ?? '',
    含水率_: s.moistureContent ?? '',
    来源: { PURCHASE: '采购', PRODUCTION: '生产', RETURNED: '退货' }[s.sourceType],
    来源详情: s.sourceInfo,
    录入人: s.operatorName,
    责任人: s.responsiblePersonName,
    登记时间: s.registeredAt,
    状态: s.status,
    判读结论: s.judgeConclusion ?? '',
    判读人: s.judgeBy ?? '',
    判读时间: s.judgeAt ?? '',
    烘干记录数: s.dryingRecords.length,
    显微照片数: s.microPhotos.length,
    缺测字段: s.missingFields.join(','),
    重复样本: s.isDuplicate ? '是' : '否',
    冲突关联: s.conflictWithSampleId ? samples.find(x => x.id === s.conflictWithSampleId)?.sampleCode ?? s.conflictWithSampleId : '',
  }))
}

export { uidFn as uid, nowFn as now }
