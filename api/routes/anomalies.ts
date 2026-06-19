import { Router, type Request, type Response } from 'express'
import * as store from '../store.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  let result = store.getAllAnomalies()
  const { status, search, sort = 'created_at', order = 'desc' } = req.query

  if (status) {
    result = result.filter(a => a.status === status)
  }
  if (search) {
    const s = String(search).toLowerCase()
    result = result.filter(a => a.sensor_code.toLowerCase().includes(s) || a.tower_position.toLowerCase().includes(s))
  }

  const allowedSorts: Record<string, string> = { created_at: 'created_at', deviation: 'deviation', sensor_code: 'sensor_code', status: 'status', updated_at: 'updated_at' }
  const sortKey = allowedSorts[sort as string] || 'created_at'
  const sortOrder = order === 'asc' ? 1 : -1
  result.sort((a: any, b: any) => {
    if (a[sortKey] < b[sortKey]) return -1 * sortOrder
    if (a[sortKey] > b[sortKey]) return 1 * sortOrder
    return 0
  })

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response) => {
  const row = store.getAnomalyById(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response) => {
  const { sensorCode, towerPosition, preCalibration, postCalibration, threshold, handler, reviewOpinion } = req.body
  if (!sensorCode || !towerPosition || preCalibration == null || postCalibration == null || !threshold || !handler) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const record = store.createAnomaly({
    sensor_code: sensorCode,
    tower_position: towerPosition,
    pre_calibration: preCalibration,
    post_calibration: postCalibration,
    threshold,
    handler,
    review_opinion: reviewOpinion || null,
  })
  res.json({ success: true, data: record })
})

router.put('/:id', (req: Request, res: Response) => {
  const result = store.updateAnomaly(req.params.id, req.body)
  if (!result) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }
  res.json({ success: true, data: result })
})

router.put('/:id/close', (req: Request, res: Response) => {
  const { closedType, closedReason, operator } = req.body
  if (!closedType || !closedReason || !operator) {
    res.status(400).json({ success: false, error: '缺少关闭类型、原因或操作人' })
    return
  }
  const result = store.closeAnomaly(req.params.id, closedType, closedReason, operator)
  if (!result) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }
  res.json({ success: true, data: result })
})

router.put('/:id/review', (req: Request, res: Response) => {
  const { reviewOpinion, approved, operator } = req.body
  if (!operator) {
    res.status(400).json({ success: false, error: '缺少操作人' })
    return
  }
  const result = store.reviewAnomalyRecord(req.params.id, reviewOpinion, approved, operator)
  if (!result) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }
  res.json({ success: true, data: result })
})

export default router
