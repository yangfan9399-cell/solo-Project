import { Router, type Request, type Response } from 'express'
import * as store from '../store.js'

const router = Router()

router.get('/:anomalyId', (req: Request, res: Response) => {
  const data = store.getRetestRecords(req.params.anomalyId)
  res.json({ success: true, data })
})

router.post('/', (req: Request, res: Response) => {
  const { anomalyId, preCalibration, postCalibration, retester } = req.body
  if (!anomalyId || preCalibration == null || postCalibration == null || !retester) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const result = store.createRetestRecord(anomalyId, preCalibration, postCalibration, retester)
  if (!result) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }
  res.json({ success: true, data: result })
})

export default router
