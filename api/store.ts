import { v4 as uuidv4 } from 'uuid'

interface AnomalyRecord {
  id: string
  sensor_code: string
  tower_position: string
  pre_calibration: number
  post_calibration: number
  deviation: number
  threshold: number
  handler: string
  review_opinion: string | null
  status: string
  closed_reason: string | null
  closed_type: string | null
  created_at: string
  updated_at: string
}

interface RetestRecord {
  id: string
  anomaly_id: string
  pre_calibration: number
  post_calibration: number
  deviation: number
  retester: string
  created_at: string
}

interface ThresholdRuleRecord {
  id: string
  name: string
  min_value: number
  max_value: number
  threshold: number
  version: number
  is_active: number
  created_at: string
}

interface StatusTransitionRecord {
  id: string
  anomaly_id: string
  from_status: string
  to_status: string
  operator: string
  comment: string | null
  created_at: string
}

interface CloseAuditRecord {
  id: string
  anomaly_id: string
  closed_type: string
  reason: string
  operator: string
  created_at: string
}

const anomalies: AnomalyRecord[] = []
const retestRecords: RetestRecord[] = []
const thresholdRules: ThresholdRuleRecord[] = []
const statusTransitions: StatusTransitionRecord[] = []
const closeAudits: CloseAuditRecord[] = []

export function classifyStatus(pre: number, post: number, threshold: number): string {
  const deviation = Math.abs(post - pre)
  if (post < pre && deviation > threshold * 0.5) return 'retest_needed'
  if (deviation > threshold) return 'threshold_exceeded'
  return 'normal'
}

export function getAllAnomalies() { return anomalies }
export function getAnomalyById(id: string) { return anomalies.find(a => a.id === id) }

export function createAnomaly(data: Omit<AnomalyRecord, 'id' | 'deviation' | 'status' | 'closed_reason' | 'closed_type' | 'created_at' | 'updated_at'>) {
  const id = uuidv4()
  const deviation = Math.abs(data.post_calibration - data.pre_calibration)
  let status = classifyStatus(data.pre_calibration, data.post_calibration, data.threshold)
  if (status !== 'normal' && !data.review_opinion) {
    status = 'review_missing'
  }
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const record: AnomalyRecord = {
    ...data,
    id,
    deviation,
    status,
    closed_reason: null,
    closed_type: null,
    created_at: now,
    updated_at: now,
  }
  anomalies.push(record)

  statusTransitions.push({
    id: uuidv4(),
    anomaly_id: id,
    from_status: 'none',
    to_status: status,
    operator: data.handler,
    comment: '创建异常记录',
    created_at: now,
  })

  return record
}

export function updateAnomaly(id: string, data: Partial<AnomalyRecord>) {
  const idx = anomalies.findIndex(a => a.id === id)
  if (idx === -1) return null

  const existing = anomalies[idx]
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const newPre = data.pre_calibration ?? existing.pre_calibration
  const newPost = data.post_calibration ?? existing.post_calibration
  const newThreshold = data.threshold ?? existing.threshold
  const deviation = Math.abs(newPost - newPre)
  let newStatus = classifyStatus(newPre, newPost, newThreshold)
  if (newStatus !== 'normal' && !data.review_opinion && !existing.review_opinion) {
    newStatus = 'review_missing'
  }

  const updated: AnomalyRecord = {
    ...existing,
    sensor_code: data.sensor_code ?? existing.sensor_code,
    tower_position: data.tower_position ?? existing.tower_position,
    pre_calibration: newPre,
    post_calibration: newPost,
    deviation,
    threshold: newThreshold,
    handler: data.handler ?? existing.handler,
    review_opinion: data.review_opinion ?? existing.review_opinion,
    status: newStatus,
    updated_at: now,
  }
  anomalies[idx] = updated

  if (newStatus !== existing.status) {
    statusTransitions.push({
      id: uuidv4(),
      anomaly_id: id,
      from_status: existing.status,
      to_status: newStatus,
      operator: data.handler ?? existing.handler,
      comment: '更新校准数据',
      created_at: now,
    })
  }

  return updated
}

export function closeAnomaly(id: string, closedType: string, closedReason: string, operator: string) {
  const idx = anomalies.findIndex(a => a.id === id)
  if (idx === -1) return null

  const existing = anomalies[idx]
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  anomalies[idx] = {
    ...existing,
    status: 'closed',
    closed_type: closedType,
    closed_reason: closedReason,
    updated_at: now,
  }

  statusTransitions.push({
    id: uuidv4(),
    anomaly_id: id,
    from_status: existing.status,
    to_status: 'closed',
    operator,
    comment: `关闭异常：${closedReason}`,
    created_at: now,
  })

  closeAudits.push({
    id: uuidv4(),
    anomaly_id: id,
    closed_type: closedType,
    reason: closedReason,
    operator,
    created_at: now,
  })

  return anomalies[idx]
}

export function reviewAnomalyRecord(id: string, reviewOpinion: string, approved: boolean, operator: string) {
  const idx = anomalies.findIndex(a => a.id === id)
  if (idx === -1) return null

  const existing = anomalies[idx]
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const newStatus = approved ? 'closed' : 'retest_needed'

  if (approved) {
    anomalies[idx] = {
      ...existing,
      review_opinion: reviewOpinion || '复核通过',
      status: 'closed',
      closed_type: 'fixed',
      closed_reason: '复核通过',
      updated_at: now,
    }

    closeAudits.push({
      id: uuidv4(),
      anomaly_id: id,
      closed_type: 'fixed',
      reason: reviewOpinion || '复核通过',
      operator,
      created_at: now,
    })
  } else {
    anomalies[idx] = {
      ...existing,
      review_opinion: reviewOpinion || '复核驳回，需复测',
      status: 'retest_needed',
      updated_at: now,
    }
  }

  statusTransitions.push({
    id: uuidv4(),
    anomaly_id: id,
    from_status: existing.status,
    to_status: newStatus,
    operator,
    comment: approved ? '复核通过' : '复核驳回',
    created_at: now,
  })

  return anomalies[idx]
}

export function getRetestRecords(anomalyId: string) {
  return retestRecords.filter(r => r.anomaly_id === anomalyId)
}

export function createRetestRecord(anomalyId: string, preCalibration: number, postCalibration: number, retester: string) {
  const anomaly = anomalies.find(a => a.id === anomalyId)
  if (!anomaly) return null

  const id = uuidv4()
  const deviation = Math.abs(postCalibration - preCalibration)
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  retestRecords.push({
    id,
    anomaly_id: anomalyId,
    pre_calibration: preCalibration,
    post_calibration: postCalibration,
    deviation,
    retester,
    created_at: now,
  })

  let newStatus: string
  if (deviation > anomaly.threshold) {
    newStatus = 'threshold_exceeded'
  } else if (postCalibration < preCalibration && deviation > anomaly.threshold * 0.5) {
    newStatus = 'retest_needed'
  } else {
    newStatus = 'normal'
  }
  if (!anomaly.review_opinion) {
    newStatus = 'review_missing'
  }

  const oldStatus = anomaly.status
  const idx = anomalies.findIndex(a => a.id === anomalyId)
  anomalies[idx] = {
    ...anomaly,
    status: newStatus,
    pre_calibration: preCalibration,
    post_calibration: postCalibration,
    deviation,
    updated_at: now,
  }

  const transitionComment = `复测提交（偏差 ${deviation}，阈值 ${anomaly.threshold}）${oldStatus !== newStatus ? `，状态变更` : ''}`
  statusTransitions.push({
    id: uuidv4(),
    anomaly_id: anomalyId,
    from_status: oldStatus,
    to_status: newStatus,
    operator: retester,
    comment: transitionComment,
    created_at: now,
  })

  return retestRecords[retestRecords.length - 1]
}

export function getAllRules() { return thresholdRules }

export function createRule(name: string, minValue: number, maxValue: number, threshold: number) {
  const existing = thresholdRules.filter(r => r.name === name)
  const version = existing.length > 0 ? Math.max(...existing.map(r => r.version)) + 1 : 1

  for (const r of thresholdRules) {
    if (r.name === name && r.is_active) {
      r.is_active = 0
    }
  }

  const id = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const record: ThresholdRuleRecord = {
    id,
    name,
    min_value: minValue,
    max_value: maxValue,
    threshold,
    version,
    is_active: 1,
    created_at: now,
  }
  thresholdRules.push(record)
  return record
}

export function updateRule(id: string, data: Partial<ThresholdRuleRecord>) {
  const existing = thresholdRules.find(r => r.id === id)
  if (!existing) return null

  const newMin = data.min_value ?? existing.min_value
  const newMax = data.max_value ?? existing.max_value
  const newThreshold = data.threshold ?? existing.threshold

  if (newMin === existing.min_value && newMax === existing.max_value && newThreshold === existing.threshold) {
    return existing
  }

  const versions = thresholdRules.filter(r => r.name === existing.name)
  const nextVersion = Math.max(...versions.map(r => r.version)) + 1
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const newId = uuidv4()

  for (const r of thresholdRules) {
    if (r.name === existing.name && r.is_active) {
      r.is_active = 0
    }
  }

  const record: ThresholdRuleRecord = {
    id: newId,
    name: existing.name,
    min_value: newMin,
    max_value: newMax,
    threshold: newThreshold,
    version: nextVersion,
    is_active: 1,
    created_at: now,
  }
  thresholdRules.push(record)
  return record
}

export function getRuleVersions(id: string) {
  const rule = thresholdRules.find(r => r.id === id)
  if (!rule) return []
  return thresholdRules.filter(r => r.name === rule.name).sort((a, b) => b.version - a.version)
}

export function getTransitions(anomalyId: string) {
  return statusTransitions.filter(t => t.anomaly_id === anomalyId).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function getAudits(anomalyId: string) {
  return closeAudits.filter(a => a.anomaly_id === anomalyId)
}

export function seedData() {
  if (anomalies.length > 0) return { message: '数据已存在', count: anomalies.length }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  thresholdRules.push(
    { id: uuidv4(), name: '风速传感器', min_value: 0, max_value: 50, threshold: 2.5, version: 1, is_active: 1, created_at: now },
    { id: uuidv4(), name: '风向传感器', min_value: 0, max_value: 360, threshold: 5.0, version: 1, is_active: 1, created_at: now },
    { id: uuidv4(), name: '温度传感器', min_value: -40, max_value: 85, threshold: 1.0, version: 1, is_active: 1, created_at: now },
  )

  const seeds: Omit<AnomalyRecord, 'id'>[] = [
    { sensor_code: 'WS-T01-001', tower_position: 'T01-A区', pre_calibration: 12.5, post_calibration: 13.8, deviation: 1.3, threshold: 2.5, handler: '张伟', review_opinion: null, status: 'normal', closed_reason: null, closed_type: null, created_at: '2026-06-18 09:15:00', updated_at: '2026-06-18 09:15:00' },
    { sensor_code: 'WS-T03-007', tower_position: 'T03-C区', pre_calibration: 15.2, post_calibration: 19.8, deviation: 4.6, threshold: 2.5, handler: '李明', review_opinion: null, status: 'review_missing', closed_reason: null, closed_type: null, created_at: '2026-06-18 10:30:00', updated_at: '2026-06-18 10:30:00' },
    { sensor_code: 'WD-T02-004', tower_position: 'T02-B区', pre_calibration: 180.0, post_calibration: 145.0, deviation: 35.0, threshold: 5.0, handler: '王芳', review_opinion: null, status: 'retest_needed', closed_reason: null, closed_type: null, created_at: '2026-06-17 14:20:00', updated_at: '2026-06-17 14:20:00' },
    { sensor_code: 'TP-T01-002', tower_position: 'T01-A区', pre_calibration: 25.0, post_calibration: 27.5, deviation: 2.5, threshold: 1.0, handler: '赵磊', review_opinion: '偏差超出阈值，需更换传感器', status: 'threshold_exceeded', closed_reason: null, closed_type: null, created_at: '2026-06-16 11:00:00', updated_at: '2026-06-17 08:30:00' },
    { sensor_code: 'WS-T04-010', tower_position: 'T04-D区', pre_calibration: 8.0, post_calibration: 8.5, deviation: 0.5, threshold: 2.5, handler: '张伟', review_opinion: '误报，实际正常', status: 'closed', closed_reason: '经复核确认偏差在可接受范围', closed_type: 'false_alarm', created_at: '2026-06-15 16:00:00', updated_at: '2026-06-16 09:00:00' },
    { sensor_code: 'WS-T02-005', tower_position: 'T02-B区', pre_calibration: 20.0, post_calibration: 20.3, deviation: 0.3, threshold: 2.5, handler: '李明', review_opinion: '与WS-T02-005上次上报重复', status: 'closed', closed_reason: '重复上报，原异常已处理', closed_type: 'duplicate', created_at: '2026-06-14 13:45:00', updated_at: '2026-06-15 10:20:00' },
    { sensor_code: 'WD-T05-012', tower_position: 'T05-E区', pre_calibration: 90.0, post_calibration: 60.0, deviation: 30.0, threshold: 5.0, handler: '王芳', review_opinion: '复核驳回，复测数据仍异常', status: 'retest_needed', closed_reason: null, closed_type: null, created_at: '2026-06-13 08:30:00', updated_at: '2026-06-18 15:00:00' },
    { sensor_code: 'TP-T03-008', tower_position: 'T03-C区', pre_calibration: 30.0, post_calibration: 32.0, deviation: 2.0, threshold: 1.0, handler: '赵磊', review_opinion: '已更换探头，恢复正常', status: 'closed', closed_reason: '已修复，更换温度探头', closed_type: 'fixed', created_at: '2026-06-12 10:00:00', updated_at: '2026-06-14 16:30:00' },
    { sensor_code: 'WS-T01-003', tower_position: 'T01-A区', pre_calibration: 18.0, post_calibration: 10.0, deviation: 8.0, threshold: 2.5, handler: '李明', review_opinion: null, status: 'review_missing', closed_reason: null, closed_type: null, created_at: '2026-06-19 07:45:00', updated_at: '2026-06-19 07:45:00' },
    { sensor_code: 'WD-T04-011', tower_position: 'T04-D区', pre_calibration: 270.0, post_calibration: 300.0, deviation: 30.0, threshold: 5.0, handler: '张伟', review_opinion: '待现场确认', status: 'threshold_exceeded', closed_reason: null, closed_type: null, created_at: '2026-06-19 11:20:00', updated_at: '2026-06-19 14:00:00' },
    { sensor_code: 'TP-T05-013', tower_position: 'T05-E区', pre_calibration: -5.0, post_calibration: -7.8, deviation: 2.8, threshold: 1.0, handler: '王芳', review_opinion: null, status: 'retest_needed', closed_reason: null, closed_type: null, created_at: '2026-06-19 15:30:00', updated_at: '2026-06-19 15:30:00' },
  ]

  for (const s of seeds) {
    const record: AnomalyRecord = { ...s, id: uuidv4() }
    anomalies.push(record)

    const transitionComment = record.status === 'normal' ? '风速传感器校准偏差正常'
      : record.status === 'review_missing' ? '超阈值缺少复核'
      : record.status === 'retest_needed' ? '读数反向漂移，需复测'
      : record.status === 'threshold_exceeded' ? '超阈值，已有复核意见'
      : '关闭'

    statusTransitions.push({
      id: uuidv4(),
      anomaly_id: record.id,
      from_status: 'none',
      to_status: record.status,
      operator: record.handler,
      comment: transitionComment,
      created_at: record.created_at,
    })

    if (record.status === 'closed') {
      closeAudits.push({
        id: uuidv4(),
        anomaly_id: record.id,
        closed_type: record.closed_type!,
        reason: record.closed_reason!,
        operator: record.handler,
        created_at: record.updated_at,
      })
    }

    if (record.sensor_code === 'WD-T05-012') {
      const rt1Id = uuidv4()
      retestRecords.push({ id: rt1Id, anomaly_id: record.id, pre_calibration: 90.0, post_calibration: 65.0, deviation: 25.0, retester: '赵磊', created_at: '2026-06-16 10:00:00' })
      statusTransitions.push({ id: uuidv4(), anomaly_id: record.id, from_status: 'threshold_exceeded', to_status: 'retest_needed', operator: '王芳', comment: '第一次复测仍异常', created_at: '2026-06-16 10:00:00' })

      const rt2Id = uuidv4()
      retestRecords.push({ id: rt2Id, anomaly_id: record.id, pre_calibration: 65.0, post_calibration: 55.0, deviation: 10.0, retester: '赵磊', created_at: '2026-06-18 15:00:00' })
      statusTransitions.push({ id: uuidv4(), anomaly_id: record.id, from_status: 'retest_needed', to_status: 'retest_needed', operator: '王芳', comment: '复核驳回，需再次复测', created_at: '2026-06-18 15:00:00' })
    }
  }

  return { message: '初始数据已创建', anomalyCount: anomalies.length, ruleCount: thresholdRules.length }
}
