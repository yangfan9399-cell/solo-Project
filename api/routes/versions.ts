import { Router, type Request, type Response } from 'express'
import { versions } from '../../src/api/data/versions.js'
import { packages } from '../../src/api/data/packages.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const packageId = req.query.packageId as string
    const status = req.query.status as string

    let result = [...versions]

    if (packageId) {
      result = result.filter((v) => v.packageId === packageId)
    }

    if (status) {
      result = result.filter((v) => v.status === status)
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const resultWithPackageName = result.map((v) => {
      const pkg = packages.find((p) => p.id === v.packageId)
      return {
        ...v,
        packageName: pkg?.name || '',
      }
    })

    res.status(200).json({
      success: true,
      data: resultWithPackageName,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch versions',
    })
  }
})

export default router
