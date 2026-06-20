import { Router, type Request, type Response } from 'express'
import { packages } from '../../src/api/data/packages.js'
import { versions } from '../../src/api/data/versions.js'
import { auditLogs } from '../../src/api/data/audit-logs.js'
import { ReleaseStatus } from '../../src/shared/types.js'
import type { ReleasePackage, VersionRecord, AuditLog } from '../../src/shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string
    const dimension = req.query.dimension as string

    let result = [...packages]

    if (status) {
      result = result.filter((pkg) => pkg.status === status)
    }

    if (dimension) {
      result = result.filter((pkg) => pkg.dimension === dimension)
    }

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch packages',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const pkg = packages.find((p) => p.id === id)

    if (!pkg) {
      res.status(404).json({
        success: false,
        error: 'Package not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: pkg,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch package',
    })
  }
})

router.post('/:id/publish', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { operator } = req.body as { operator?: string }
    const pkgIndex = packages.findIndex((p) => p.id === id)

    if (pkgIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Package not found',
      })
      return
    }

    const pkg = packages[pkgIndex]

    if (pkg.status === ReleaseStatus.published) {
      res.status(400).json({
        success: false,
        error: 'Package is already published',
      })
      return
    }

    if (pkg.status === ReleaseStatus.blocked) {
      res.status(400).json({
        success: false,
        error: 'Package is blocked, resolve blockers first',
      })
      return
    }

    const now = new Date().toISOString()

    const updatedPackage: ReleasePackage = {
      ...pkg,
      status: ReleaseStatus.published,
      currentVersion: pkg.nextVersion,
      publishedAt: now,
      updatedAt: now,
    }
    packages[pkgIndex] = updatedPackage

    const pendingVersion = versions.find(
      (v) => v.packageId === id && v.version === pkg.nextVersion,
    )
    if (pendingVersion) {
      const versionIndex = versions.findIndex((v) => v.id === pendingVersion.id)
      versions[versionIndex] = {
        ...pendingVersion,
        status: ReleaseStatus.published,
      }
    }

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      packageId: id,
      action: '版本发布',
      description: `${pkg.name} ${pkg.nextVersion} 正式发布`,
      operator: operator || '系统',
      timestamp: now,
      details: {
        fromVersion: pkg.currentVersion,
        toVersion: pkg.nextVersion,
        affectedSamples: pkg.affectedSampleCount,
      },
    }
    auditLogs.push(auditLog)

    res.status(200).json({
      success: true,
      data: updatedPackage,
      message: 'Package published successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to publish package',
    })
  }
})

export default router
