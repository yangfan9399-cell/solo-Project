import { Router, type Request, type Response } from 'express'
import { rollbackDrafts } from '../../src/api/data/rollback-drafts.js'
import { packages } from '../../src/api/data/packages.js'
import { versions } from '../../src/api/data/versions.js'
import { auditLogs } from '../../src/api/data/audit-logs.js'
import { ReleaseStatus } from '../../src/shared/types.js'
import type { RollbackDraft, AuditLog } from '../../src/shared/types.js'

const router = Router({ mergeParams: true })

router.get('/:id/rollback-draft', (req: Request, res: Response): void => {
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

    const draft = rollbackDrafts.find(
      (r) => r.packageId === id && r.status !== 'cancelled',
    )

    if (!draft) {
      res.status(404).json({
        success: false,
        error: 'Rollback draft not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: draft,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rollback draft',
    })
  }
})

router.post('/:id/generate-rollback-draft', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { operator, reason, targetVersion } = req.body as {
      operator?: string
      reason?: string
      targetVersion?: string
    }

    const pkg = packages.find((p) => p.id === id)

    if (!pkg) {
      res.status(404).json({
        success: false,
        error: 'Package not found',
      })
      return
    }

    const existingDraft = rollbackDrafts.find(
      (r) => r.packageId === id && r.status === 'draft',
    )

    if (existingDraft) {
      res.status(400).json({
        success: false,
        error: 'Draft already exists for this package',
      })
      return
    }

    const now = new Date().toISOString()
    const prevVersions = versions
      .filter((v) => v.packageId === id && v.status === ReleaseStatus.published)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const rollbackVer = targetVersion || (prevVersions.length > 1
      ? prevVersions[1].version
      : pkg.currentVersion.replace(/(\d+)$/, (m) => String(parseInt(m) - 1)))

    const affectedCount = pkg.affectedSampleCount || pkg.sampleCount || 50
    const baseDuration = Math.max(15, Math.min(120, Math.round(affectedCount * 0.8)))

    const generatedSteps = [
      {
        id: `gen-step-${Date.now()}-1`,
        order: 1,
        title: '回滚前数据快照备份',
        description: `对 ${pkg.name} 当前版本 ${pkg.currentVersion} 的所有评估数据、模型参数、配置文件进行完整快照备份，确保回滚失败时可完整恢复。`,
        estimatedDuration: 25,
        status: 'pending' as const,
      },
      {
        id: `gen-step-${Date.now()}-2`,
        order: 2,
        title: '暂停相关任务队列',
        description: `暂停 ${pkg.dimension} 维度的所有新任务处理，锁定写入操作，避免回滚过程中产生数据不一致。`,
        estimatedDuration: 8,
        status: 'pending' as const,
      },
      {
        id: `gen-step-${Date.now()}-3`,
        order: 3,
        title: `模型版本切换至 ${rollbackVer}`,
        description: `将生产环境的模型版本从当前 ${pkg.currentVersion} 切换至目标版本 ${rollbackVer}，同步更新配置中心和缓存。`,
        estimatedDuration: 15,
        status: 'pending' as const,
      },
      {
        id: `gen-step-${Date.now()}-4`,
        order: 4,
        title: `受影响样本批量重算`,
        description: `对 ${pkg.currentVersion} 发布后处理过的约 ${affectedCount} 个样本，使用 ${rollbackVer} 模型重新评估计算。`,
        estimatedDuration: baseDuration,
        status: 'pending' as const,
      },
      {
        id: `gen-step-${Date.now()}-5`,
        order: 5,
        title: '数据一致性抽样校验',
        description: '随机抽取10%样本进行人工比对校验，确认回滚后数据与历史记录一致，无异常波动。',
        estimatedDuration: 25,
        status: 'pending' as const,
      },
      {
        id: `gen-step-${Date.now()}-6`,
        order: 6,
        title: '恢复服务并通知相关方',
        description: '恢复任务队列正常运行，通过邮件和站内信通知考古研究员、数据管理员回滚完成，同步更新发布看板状态。',
        estimatedDuration: 12,
        status: 'pending' as const,
      },
    ]

    const newDraft = {
      id: `rb-gen-${Date.now()}`,
      packageId: id,
      targetVersion: pkg.currentVersion,
      rollbackVersion: rollbackVer,
      reason: reason || `自动生成的回滚草案：从 ${pkg.currentVersion} 回退至 ${rollbackVer}，基于历史版本稳定性评估。`,
      steps: generatedSteps,
      status: 'draft' as const,
      createdBy: operator || '系统自动生成',
      createdAt: now,
    }

    rollbackDrafts.push(newDraft)

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      packageId: id,
      action: '回滚草案创建',
      description: `自动生成 ${pkg.name} 回滚草案（${pkg.currentVersion} → ${rollbackVer}）`,
      operator: operator || '系统',
      timestamp: now,
      details: {
        rollbackId: newDraft.id,
        targetVersion: rollbackVer,
        reason: newDraft.reason,
        stepsCount: generatedSteps.length,
      },
    }
    auditLogs.push(auditLog)

    res.status(201).json({
      success: true,
      data: newDraft,
      message: 'Rollback draft generated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate rollback draft',
    })
  }
})

router.post('/:id/rollback', (req: Request, res: Response): void => {
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

    if (pkg.status !== ReleaseStatus.published) {
      res.status(400).json({
        success: false,
        error: 'Only published packages can be rolled back',
      })
      return
    }

    const draftIndex = rollbackDrafts.findIndex(
      (r) => r.packageId === id && r.status === 'draft',
    )

    if (draftIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'No approved rollback draft found',
      })
      return
    }

    const draft = rollbackDrafts[draftIndex]
    const now = new Date().toISOString()

    const updatedDraft: RollbackDraft = {
      ...draft,
      status: 'executing',
      steps: draft.steps.map((step) => ({
        ...step,
        status: 'in_progress' as const,
      })),
    }
    rollbackDrafts[draftIndex] = updatedDraft

    const updatedPackage = {
      ...pkg,
      status: ReleaseStatus.rolled_back,
      currentVersion: draft.rollbackVersion,
      updatedAt: now,
    }
    packages[pkgIndex] = updatedPackage

    const versionIndex = versions.findIndex(
      (v) => v.packageId === id && v.version === pkg.currentVersion,
    )
    if (versionIndex !== -1) {
      versions[versionIndex] = {
        ...versions[versionIndex],
        status: ReleaseStatus.rolled_back,
      }
    }

    const auditLog: AuditLog = {
      id: `log-${Date.now()}`,
      packageId: id,
      action: '执行回滚',
      description: `${pkg.name} 从 ${pkg.currentVersion} 回滚至 ${draft.rollbackVersion}`,
      operator: operator || '系统',
      timestamp: now,
      details: {
        fromVersion: pkg.currentVersion,
        toVersion: draft.rollbackVersion,
        rollbackId: draft.id,
      },
    }
    auditLogs.push(auditLog)

    res.status(200).json({
      success: true,
      data: {
        package: updatedPackage,
        rollbackDraft: updatedDraft,
      },
      message: 'Rollback initiated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute rollback',
    })
  }
})

export default router
