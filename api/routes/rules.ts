import { Router, type Request, type Response } from 'express'
import * as store from '../store.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const data = store.getAllRules()
  res.json({ success: true, data })
})

router.post('/', (req: Request, res: Response) => {
  const { name, minValue, maxValue, threshold } = req.body
  if (!name || threshold == null) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const result = store.createRule(name, minValue || 0, maxValue || 999999, threshold)
  res.json({ success: true, data: result })
})

router.put('/:id', (req: Request, res: Response) => {
  const result = store.updateRule(req.params.id, req.body)
  if (!result) {
    res.status(404).json({ success: false, error: '规则不存在' })
    return
  }
  res.json({ success: true, data: result })
})

router.get('/:id/versions', (req: Request, res: Response) => {
  const data = store.getRuleVersions(req.params.id)
  res.json({ success: true, data })
})

export default router
