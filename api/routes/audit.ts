import { Router, type Request, type Response } from 'express'
import { auditLogs } from '../../src/api/data/audit-logs.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const packageId = req.query.packageId as string
    const action = req.query.action as string
    const operator = req.query.operator as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    let result = [...auditLogs]

    if (packageId) {
      result = result.filter((log) => log.packageId === packageId)
    }

    if (action) {
      result = result.filter((log) => log.action === action)
    }

    if (operator) {
      result = result.filter((log) => log.operator.includes(operator))
    }

    if (startDate) {
      result = result.filter((log) => log.timestamp >= startDate)
    }

    if (endDate) {
      result = result.filter((log) => log.timestamp <= endDate)
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const total = result.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedResult = result.slice(startIndex, endIndex)

    res.status(200).json({
      success: true,
      data: {
        logs: paginatedResult,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    })
  }
})

export default router
