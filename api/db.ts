import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { computeSpecimenStatus, computeImpact, type Thresholds, type Specimen, type ImpactResult } from './thresholdEngine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, 'data')
const DB_PATH = join(DATA_DIR, 'store.json')
const TMP_PATH = join(DATA_DIR, 'store.json.tmp')

let saveQueue: Promise<void> = Promise.resolve()
let saveRetryCount = 0
const MAX_SAVE_RETRIES = 3

interface Store {
  rules: RuleRow[]
  specimens: SpecimenRow[]
  approvals: ApprovalRow[]
  releaseHistory: ReleaseHistoryRow[]
  rollbackDrafts: RollbackDraftRow[]
}

interface RuleRow {
  id: string
  name: string
  version: string
  thresholds: string
  status: 'published' | 'draft'
  created_at: string
  published_at: string | null
}

interface SpecimenRow {
  id: string
  code: string
  collection_point: string
  season: string
  altitude: number
  substrate: number
  spore_density: number
  humidity_exposure: number
  current_status: string
  linked_specimen_id: string | null
}

interface ApprovalRow {
  id: string
  rule_id: string
  rule_name_snapshot: string
  rule_version_snapshot: string
  reason: string
  status: string
  submitted_at: string
  reviewed_at: string | null
  review_comment: string | null
  impact_summary: string
  threshold_diff: string
}

interface ReleaseHistoryRow {
  id: string
  rule_id: string
  rule_name_snapshot: string
  version: string
  published_at: string
  change_summary: string
  approval_id: string
}

interface RollbackDraftRow {
  id: string
  target_rule_id: string
  target_version: string
  status: string
  impact_summary: string
  created_at: string
}

let store: Store

function loadStore(): Store {
  if (existsSync(DB_PATH)) {
    try {
      const raw = readFileSync(DB_PATH, 'utf-8')
      if (!raw.trim()) {
        console.warn('[DB] Empty store file found, re-seeding...')
        return seedData()
      }
      const parsed = JSON.parse(raw)
      if (!parsed.rules || !parsed.specimens || !parsed.approvals || !parsed.releaseHistory || !parsed.rollbackDrafts) {
        console.warn('[DB] Corrupted store structure detected, re-seeding...')
        return seedData()
      }
      // Migration: ensure ApprovalRow has rule_name_snapshot and rule_version_snapshot
      parsed.approvals = parsed.approvals.map((a: any) => ({
        rule_name_snapshot: '',
        rule_version_snapshot: '',
        ...a,
      }))
      // Migration: ensure ReleaseHistoryRow has rule_name_snapshot
      parsed.releaseHistory = parsed.releaseHistory.map((r: any) => ({
        rule_name_snapshot: '',
        ...r,
      }))
      return parsed
    } catch (e) {
      console.error('[DB] Failed to parse store file, re-seeding from backup/seed:', (e as Error).message)
      if (existsSync(TMP_PATH)) {
        try {
          const tmpRaw = readFileSync(TMP_PATH, 'utf-8')
          const tmpParsed = JSON.parse(tmpRaw)
          if (tmpParsed.rules && tmpParsed.specimens && tmpParsed.approvals) {
            console.warn('[DB] Recovered from tmp file')
            tmpParsed.approvals = tmpParsed.approvals.map((a: any) => ({
              rule_name_snapshot: '',
              rule_version_snapshot: '',
              ...a,
            }))
            tmpParsed.releaseHistory = (tmpParsed.releaseHistory || []).map((r: any) => ({
              rule_name_snapshot: '',
              ...r,
            }))
            return tmpParsed
          }
        } catch (e2) {
          console.warn('[DB] Tmp file also unreadable:', (e2 as Error).message)
        }
      }
      return seedData()
    }
  }
  return seedData()
}

function doSaveStoreSync(): void {
  mkdirSync(DATA_DIR, { recursive: true })
  const content = JSON.stringify(store, null, 2)
  writeFileSync(TMP_PATH, content, 'utf-8')
  renameSync(TMP_PATH, DB_PATH)
}

function saveStore(): void {
  saveQueue = saveQueue.then(async () => {
    for (let attempt = 0; attempt < MAX_SAVE_RETRIES; attempt++) {
      try {
        doSaveStoreSync()
        saveRetryCount = 0
        return
      } catch (e) {
        saveRetryCount++
        console.warn(`[DB] Save attempt ${attempt + 1}/${MAX_SAVE_RETRIES} failed:`, (e as Error).message)
        if (attempt < MAX_SAVE_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 50 * (attempt + 1)))
        }
      }
    }
    console.error('[DB] All save attempts failed! Data may be inconsistent.')
  }).catch(e => {
    console.error('[DB] Save queue fatal error:', (e as Error).message)
  })
}

export function initDb(): void {
  mkdirSync(DATA_DIR, { recursive: true })
  store = loadStore()
  try {
    doSaveStoreSync()
  } catch (e) {
    console.warn('[DB] Initial save failed, continuing with in-memory store:', (e as Error).message)
  }
}

export function getRules(): RuleRow[] {
  return store.rules
}

export function getRuleById(id: string): RuleRow | undefined {
  return store.rules.find(r => r.id === id)
}

export function getDraftRule(): RuleRow | undefined {
  return store.rules.find(r => r.status === 'draft')
}

export function getLatestPublishedRule(): RuleRow | undefined {
  const published = store.rules
    .filter(r => r.status === 'published')
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
  return published[0]
}

export function updateDraftRule(thresholds: object, name?: string): RuleRow {
  const draft = store.rules.find(r => r.status === 'draft')
  if (!draft) throw new Error('No draft rule found')
  draft.thresholds = JSON.stringify(thresholds)
  if (name) draft.name = name

  const published = getLatestPublishedRule()
  if (published) {
    const pubThresholds: Thresholds = JSON.parse(published.thresholds)
    for (const s of store.specimens) {
      s.current_status = computeSpecimenStatus(s, pubThresholds)
    }
  }

  saveStore()
  return draft
}

export function getSpecimens(): SpecimenRow[] {
  return store.specimens
}

export function updateSpecimenStatuses(thresholds: Thresholds): void {
  for (const s of store.specimens) {
    s.current_status = computeSpecimenStatus(s, thresholds)
  }
  saveStore()
}

export function getApprovals(): ApprovalRow[] {
  return store.approvals
}

export function createApproval(
  ruleId: string,
  ruleNameSnapshot: string,
  ruleVersionSnapshot: string,
  reason: string,
  impactSummary: object,
  thresholdDiff: object,
): ApprovalRow {
  const approval: ApprovalRow = {
    id: crypto.randomUUID(),
    rule_id: ruleId,
    rule_name_snapshot: ruleNameSnapshot,
    rule_version_snapshot: ruleVersionSnapshot,
    reason,
    status: 'pending',
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    review_comment: null,
    impact_summary: JSON.stringify(impactSummary),
    threshold_diff: JSON.stringify(thresholdDiff),
  }
  store.approvals.push(approval)
  saveStore()
  return approval
}

export function getApprovalById(id: string): ApprovalRow | undefined {
  return store.approvals.find(a => a.id === id)
}

export function approveApproval(id: string, comment: string): ApprovalRow {
  const approval = store.approvals.find(a => a.id === id)
  if (!approval) throw new Error('Approval not found')
  approval.status = 'approved'
  approval.reviewed_at = new Date().toISOString()
  approval.review_comment = comment || ''
  saveStore()
  return approval
}

export function rejectApproval(id: string, comment: string): ApprovalRow {
  const approval = store.approvals.find(a => a.id === id)
  if (!approval) throw new Error('Approval not found')
  approval.status = 'rejected'
  approval.reviewed_at = new Date().toISOString()
  approval.review_comment = comment || ''
  saveStore()
  return approval
}

export function publishDraftRule(): RuleRow {
  const draft = store.rules.find(r => r.status === 'draft')
  if (!draft) throw new Error('No draft rule found')

  const now = new Date().toISOString()
  const newRule: RuleRow = {
    id: crypto.randomUUID(),
    name: draft.name,
    version: draft.version,
    thresholds: draft.thresholds,
    status: 'published',
    created_at: draft.created_at,
    published_at: now,
  }
  store.rules.push(newRule)
  saveStore()
  return newRule
}

export function addReleaseHistory(ruleId: string, ruleNameSnapshot: string, version: string, changeSummary: string, approvalId: string): ReleaseHistoryRow {
  const entry: ReleaseHistoryRow = {
    id: crypto.randomUUID(),
    rule_id: ruleId,
    rule_name_snapshot: ruleNameSnapshot,
    version,
    published_at: new Date().toISOString(),
    change_summary: changeSummary,
    approval_id: approvalId,
  }
  store.releaseHistory.push(entry)
  saveStore()
  return entry
}

export function getReleaseHistory(): ReleaseHistoryRow[] {
  return store.releaseHistory
}

export function getRollbackDrafts(): RollbackDraftRow[] {
  return store.rollbackDrafts
}

export function createRollbackDraft(targetRuleId: string, targetVersion: string, impactSummary: object): RollbackDraftRow {
  const draft: RollbackDraftRow = {
    id: crypto.randomUUID(),
    target_rule_id: targetRuleId,
    target_version: targetVersion,
    status: 'draft',
    impact_summary: JSON.stringify(impactSummary),
    created_at: new Date().toISOString(),
  }
  store.rollbackDrafts.push(draft)
  saveStore()
  return draft
}

export function getRollbackDraftById(id: string): RollbackDraftRow | undefined {
  return store.rollbackDrafts.find(d => d.id === id)
}

export function updateRollbackDraftStatus(id: string, status: string): RollbackDraftRow {
  const draft = store.rollbackDrafts.find(d => d.id === id)
  if (!draft) throw new Error('Rollback draft not found')
  draft.status = status
  saveStore()
  return draft
}

export function addPublishedRule(name: string, version: string, thresholds: string): RuleRow {
  const now = new Date().toISOString()
  const rule: RuleRow = {
    id: crypto.randomUUID(),
    name,
    version,
    thresholds,
    status: 'published',
    created_at: now,
    published_at: now,
  }
  store.rules.push(rule)
  saveStore()
  return rule
}

function seedData(): Store {
  const ruleV10Id = crypto.randomUUID()
  const ruleV11Id = crypto.randomUUID()
  const ruleV20Id = crypto.randomUUID()

  const rules: RuleRow[] = [
    {
      id: ruleV10Id,
      name: '地衣标本采集阈值规则',
      version: 'v1.0',
      thresholds: JSON.stringify({
        altitude: { passMax: 3000, warnMax: 4500 },
        substrate: { passMax: 5, warnMax: 8 },
        sporeDensity: { passMax: 200, warnMax: 500 },
        humidityExposure: { passMax: 60, warnMax: 80 },
      }),
      status: 'published',
      created_at: '2025-03-15T06:00:00Z',
      published_at: '2025-03-15T08:00:00Z',
    },
    {
      id: ruleV11Id,
      name: '地衣标本采集阈值规则',
      version: 'v1.1',
      thresholds: JSON.stringify({
        altitude: { passMax: 2500, warnMax: 4000 },
        substrate: { passMax: 4, warnMax: 7 },
        sporeDensity: { passMax: 150, warnMax: 400 },
        humidityExposure: { passMax: 50, warnMax: 75 },
      }),
      status: 'published',
      created_at: '2025-08-20T08:00:00Z',
      published_at: '2025-08-20T10:00:00Z',
    },
    {
      id: ruleV20Id,
      name: '地衣标本采集阈值规则',
      version: 'v2.0',
      thresholds: JSON.stringify({
        altitude: { passMax: 2000, warnMax: 3500 },
        substrate: { passMax: 3, warnMax: 6 },
        sporeDensity: { passMax: 100, warnMax: 300 },
        humidityExposure: { passMax: 40, warnMax: 65 },
      }),
      status: 'draft',
      created_at: '2025-12-01T00:00:00Z',
      published_at: null,
    },
  ]

  const rawSpecimens = [
    { code: 'LIC-001', collection_point: '华山北峰', season: 'spring', altitude: 1800, substrate: 2.5, spore_density: 80, humidity_exposure: 30 },
    { code: 'LIC-002', collection_point: '华山北峰', season: 'autumn', altitude: 1850, substrate: 2.8, spore_density: 90, humidity_exposure: 35 },
    { code: 'LIC-003', collection_point: '秦岭太白山', season: 'summer', altitude: 3200, substrate: 5.5, spore_density: 250, humidity_exposure: 65 },
    { code: 'LIC-004', collection_point: '秦岭太白山', season: 'winter', altitude: 3100, substrate: 5.2, spore_density: 230, humidity_exposure: 60 },
    { code: 'LIC-005', collection_point: '黄山光明顶', season: 'spring', altitude: 2600, substrate: 4.5, spore_density: 160, humidity_exposure: 52 },
    { code: 'LIC-006', collection_point: '峨眉山金顶', season: 'summer', altitude: 2800, substrate: 4.8, spore_density: 180, humidity_exposure: 55 },
    { code: 'LIC-007', collection_point: '武夷山天游峰', season: 'autumn', altitude: 1500, substrate: 3.0, spore_density: 120, humidity_exposure: 45 },
    { code: 'LIC-008', collection_point: '长白山天池', season: 'winter', altitude: 3500, substrate: 6.0, spore_density: 350, humidity_exposure: 70 },
    { code: 'LIC-009', collection_point: '神农架', season: 'spring', altitude: 2200, substrate: 3.8, spore_density: 140, humidity_exposure: 48 },
    { code: 'LIC-010', collection_point: '神农架', season: 'summer', altitude: 2400, substrate: 4.2, spore_density: 155, humidity_exposure: 53 },
    { code: 'LIC-011', collection_point: '横断山脉', season: 'autumn', altitude: 4200, substrate: 7.5, spore_density: 450, humidity_exposure: 78 },
    { code: 'LIC-012', collection_point: '横断山脉', season: 'winter', altitude: 4100, substrate: 7.2, spore_density: 420, humidity_exposure: 76 },
    { code: 'LIC-013', collection_point: '天山博格达峰', season: 'summer', altitude: 3800, substrate: 6.5, spore_density: 380, humidity_exposure: 68 },
    { code: 'LIC-014', collection_point: '天山博格达峰', season: 'spring', altitude: 3700, substrate: 6.2, spore_density: 360, humidity_exposure: 66 },
    { code: 'LIC-015', collection_point: '喜马拉雅南坡', season: 'summer', altitude: 4800, substrate: 9.0, spore_density: 550, humidity_exposure: 85 },
  ]

  const v11Thresholds: Thresholds = {
    altitude: { passMax: 2500, warnMax: 4000 },
    substrate: { passMax: 4, warnMax: 7 },
    sporeDensity: { passMax: 150, warnMax: 400 },
    humidityExposure: { passMax: 50, warnMax: 75 },
  }

  const specimenIds: string[] = []
  const specimens: SpecimenRow[] = rawSpecimens.map(s => {
    const id = crypto.randomUUID()
    specimenIds.push(id)
    const specObj: Specimen = {
      id,
      code: s.code,
      collection_point: s.collection_point,
      season: s.season,
      altitude: s.altitude,
      substrate: s.substrate,
      spore_density: s.spore_density,
      humidity_exposure: s.humidity_exposure,
      current_status: 'pass',
      linked_specimen_id: null,
    }
    specObj.current_status = computeSpecimenStatus(specObj, v11Thresholds)
    return specObj
  })

  const crossSeasonPairs = [[0, 1], [2, 3], [12, 13]]
  for (const [i, j] of crossSeasonPairs) {
    specimens[i].linked_specimen_id = specimenIds[j]
    specimens[j].linked_specimen_id = specimenIds[i]
  }

  const approvalV10Id = crypto.randomUUID()
  const approvalV11Id = crypto.randomUUID()

  const approvals: ApprovalRow[] = [
    {
      id: approvalV10Id,
      rule_id: ruleV10Id,
      rule_name_snapshot: '地衣标本采集阈值规则 v1.0',
      rule_version_snapshot: 'v1.0',
      reason: '初始化地衣标本采集阈值规则体系',
      status: 'approved',
      submitted_at: '2025-03-14T10:00:00Z',
      reviewed_at: '2025-03-15T07:30:00Z',
      review_comment: '审核通过，阈值设定合理',
      impact_summary: JSON.stringify({ toWarn: 0, toBlock: 0, warnToBlock: 0, total: 0 }),
      threshold_diff: JSON.stringify({ from: null, to: 'v1.0' }),
    },
    {
      id: approvalV11Id,
      rule_id: ruleV11Id,
      rule_name_snapshot: '地衣标本采集阈值规则 v1.1',
      rule_version_snapshot: 'v1.1',
      reason: '根据最新研究成果收紧阈值参数',
      status: 'approved',
      submitted_at: '2025-08-18T09:00:00Z',
      reviewed_at: '2025-08-20T09:30:00Z',
      review_comment: '收紧合理，影响可控',
      impact_summary: JSON.stringify({ toWarn: 3, toBlock: 0, warnToBlock: 0, total: 3 }),
      threshold_diff: JSON.stringify({
        from: 'v1.0',
        to: 'v1.1',
        changes: {
          altitude: { passMax: '3000→2500', warnMax: '4500→4000' },
          substrate: { passMax: '5→4', warnMax: '8→7' },
          sporeDensity: { passMax: '200→150', warnMax: '500→400' },
          humidityExposure: { passMax: '60→50', warnMax: '80→75' },
        },
      }),
    },
  ]

  const releaseHistory: ReleaseHistoryRow[] = [
    {
      id: crypto.randomUUID(),
      rule_id: ruleV10Id,
      rule_name_snapshot: '地衣标本采集阈值规则 v1.0',
      version: 'v1.0',
      published_at: '2025-03-15T08:00:00Z',
      change_summary: '初始发布地衣标本采集阈值规则 v1.0',
      approval_id: approvalV10Id,
    },
    {
      id: crypto.randomUUID(),
      rule_id: ruleV11Id,
      rule_name_snapshot: '地衣标本采集阈值规则 v1.1',
      version: 'v1.1',
      published_at: '2025-08-20T10:00:00Z',
      change_summary: '收紧各维度阈值参数，提升标本质量标准',
      approval_id: approvalV11Id,
    },
  ]

  return { rules, specimens, approvals, releaseHistory, rollbackDrafts: [] }
}

export interface ThresholdDiff {
  changedDimensions: string[]
  detail: Record<string, { passMax?: { from: number; to: number }; warnMax?: { from: number; to: number } }>
}

export function computeThresholdDiff(oldT: Thresholds, newT: Thresholds): ThresholdDiff {
  const dims: (keyof Thresholds)[] = ['altitude', 'substrate', 'sporeDensity', 'humidityExposure']
  const result: ThresholdDiff = { changedDimensions: [], detail: {} }
  for (const d of dims) {
    const oldD = oldT[d]
    const newD = newT[d]
    const detail: { passMax?: { from: number; to: number }; warnMax?: { from: number; to: number } } = {}
    if (oldD.passMax !== newD.passMax) {
      detail.passMax = { from: oldD.passMax, to: newD.passMax }
      if (!result.changedDimensions.includes(d)) result.changedDimensions.push(d)
    }
    if (oldD.warnMax !== newD.warnMax) {
      detail.warnMax = { from: oldD.warnMax, to: newD.warnMax }
      if (!result.changedDimensions.includes(d)) result.changedDimensions.push(d)
    }
    if (detail.passMax || detail.warnMax) {
      result.detail[d] = detail
    }
  }
  return result
}

export interface EnhancedImpactSummary {
  toWarn: number
  toBlock: number
  warnToBlock: number
  total: number
  crossSeasonAffected: number
  crossSeasonPairs: Array<{
    pairId: string
    specimens: Array<{
      code: string
      collection_point: string
      season: string
      oldStatus: string
      newStatus: string
      changedDimensions: string[]
    }>
  }>
  byDimension: Record<string, number>
}

export function computeEnhancedImpactSummary(impacts: ImpactResult[]): EnhancedImpactSummary {
  const summary: EnhancedImpactSummary = {
    toWarn: 0,
    toBlock: 0,
    warnToBlock: 0,
    total: impacts.length,
    crossSeasonAffected: 0,
    crossSeasonPairs: [],
    byDimension: {},
  }

  const pairMap = new Map<string, typeof summary.crossSeasonPairs[0]>()

  for (const imp of impacts) {
    if (imp.oldStatus === 'pass' && imp.newStatus === 'warn') summary.toWarn++
    else if (imp.oldStatus === 'pass' && imp.newStatus === 'block') summary.toBlock++
    else if (imp.oldStatus === 'warn' && imp.newStatus === 'block') summary.warnToBlock++

    for (const dim of imp.changedDimensions) {
      summary.byDimension[dim] = (summary.byDimension[dim] || 0) + 1
    }

    if (imp.isCrossSeason && imp.specimen.linked_specimen_id) {
      summary.crossSeasonAffected++
      const pairKey = [imp.specimen.id, imp.specimen.linked_specimen_id].sort().join('|')
      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, { pairId: pairKey, specimens: [] })
      }
      pairMap.get(pairKey)!.specimens.push({
        code: imp.specimen.code,
        collection_point: imp.specimen.collection_point,
        season: imp.specimen.season,
        oldStatus: imp.oldStatus,
        newStatus: imp.newStatus,
        changedDimensions: [...imp.changedDimensions],
      })
    }
  }

  summary.crossSeasonPairs = Array.from(pairMap.values())

  return summary
}

export function computeImpactFromRuleIds(oldRuleId: string, newRuleId: string): ImpactResult[] {
  const oldRule = store.rules.find(r => r.id === oldRuleId)
  const newRule = store.rules.find(r => r.id === newRuleId)
  if (!oldRule || !newRule) return []
  const oldT: Thresholds = JSON.parse(oldRule.thresholds)
  const newT: Thresholds = JSON.parse(newRule.thresholds)
  return computeImpact(store.specimens as unknown as Specimen[], oldT, newT)
}
