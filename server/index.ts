import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// GET /api/recalls - 召回列表
app.get('/api/recalls', async (req, res) => {
  const status = req.query.status as string

  const where: any = {}
  if (status && status !== 'ALL') {
    where.status = status
  }

  const recalls = await prisma.recall.findMany({
    where,
    include: {
      publisher: {
        select: { name: true, role: true }
      },
      batches: {
        include: {
          drugBatch: {
            include: {
              drug: true
            }
          }
        }
      },
      _count: {
        select: {
          stores: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const stats = await prisma.recall.groupBy({
    by: ['status'],
    _count: true,
  })

  res.json({ recalls, stats })
})

// POST /api/recalls - 发布召回
app.post('/api/recalls', async (req, res) => {
  const { title, description, reason, level, publisherId, batchIds, storeIds, expectedQuantity } = req.body

  try {
    const recall = await prisma.recall.create({
      data: {
        title,
        description,
        reason,
        level,
        status: 'PUBLISHED',
        publisherId,
        batches: {
          create: batchIds.map((batchId: string) => ({
            drugBatchId: batchId,
            expectedQuantity: expectedQuantity || 0,
          })),
        },
        stores: {
          create: storeIds.map((storeId: string) => ({
            storeId,
            status: 'UNREAD',
          })),
        },
        history: {
          create: {
            action: '发布召回',
            detail: '质量经办人发布召回通知',
            actorId: publisherId,
          },
        },
      },
      include: {
        batches: true,
        stores: true,
      },
    })
    res.status(201).json(recall)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '发布失败' })
  }
})

// GET /api/recalls/:id - 召回详情
app.get('/api/recalls/:id', async (req, res) => {
  const { id } = req.params

  const recall = await prisma.recall.findUnique({
    where: { id },
    include: {
      publisher: {
        select: { name: true, role: true }
      },
      closer: {
        select: { name: true, role: true }
      },
      batches: {
        include: {
          drugBatch: {
            include: {
              drug: true
            }
          }
        }
      },
      stores: {
        include: {
          store: true,
          confirmedBy: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      recoveries: {
        include: {
          store: true,
          batch: true,
          notedBy: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      history: {
        include: {
          actor: {
            select: { name: true, role: true }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
    },
  })

  if (!recall) {
    return res.status(404).json({ error: 'Recall not found' })
  }

  const stats = {
    totalStores: recall.stores.length,
    unreadCount: recall.stores.filter((s: any) => s.status === 'UNREAD').length,
    readCount: recall.stores.filter((s: any) => s.status === 'READ').length,
    offShelfCount: recall.stores.filter((s: any) => s.status === 'OFF_SHELF').length,
    recoveredCount: recall.stores.filter((s: any) => s.status === 'RECOVERED').length,
    mismatchCount: recall.stores.filter((s: any) => s.status === 'BATCH_MISMATCH').length,
    totalRecoveryExpected: recall.recoveries.reduce((sum: number, r: any) => sum + r.expectedQty, 0),
    totalRecoveryActual: recall.recoveries.reduce((sum: number, r: any) => sum + r.actualQty, 0),
    totalDifference: recall.recoveries.reduce((sum: number, r: any) => sum + r.difference, 0),
  }

  res.json({ recall, stats })
})

// PATCH /api/recalls/:id - 更新召回状态（关闭/追责）
app.patch('/api/recalls/:id', async (req, res) => {
  const { id } = req.params
  const { status, closerId, closeNote, action, actorId, detail } = req.body

  try {
    if (status === 'CLOSED' || status === 'INVESTIGATING') {
      const recall = await prisma.recall.findUnique({
        where: { id },
        include: { stores: true },
      })

      if (!recall) {
        return res.status(404).json({ error: 'Recall not found' })
      }

      const hasUnread = recall.stores.some((s: any) => s.status === 'UNREAD')
      if (hasUnread) {
        return res.status(400).json({
          error: '门店未读，禁止关闭召回',
          code: 'UNREAD_STORES_EXIST'
        })
      }

      const updated = await prisma.recall.update({
        where: { id },
        data: {
          status,
          closedAt: new Date(),
          closerId,
          closeNote,
          history: {
            create: {
              action: action || (status === 'CLOSED' ? '关闭召回' : '启动追责'),
              detail: detail || closeNote || '',
              actorId: actorId || closerId,
            },
          },
        },
        include: { history: true },
      })
      return res.json(updated)
    }

    const updated = await prisma.recall.update({
      where: { id },
      data: { status },
    })
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '更新失败' })
  }
})

// POST /api/recalls/:id/store-action - 门店操作（已读/下架/批号不匹配）
app.post('/api/recalls/:id/store-action', async (req, res) => {
  const { id } = req.params
  const { storeId, action, confirmedById, offShelfPhoto, mismatchNote } = req.body

  try {
    const storeRecall = await prisma.storeRecall.findUnique({
      where: {
        recallId_storeId: {
          recallId: id,
          storeId,
        },
      },
    })

    if (!storeRecall) {
      return res.status(404).json({ error: 'Store recall not found' })
    }

    let updateData: any = {}

    if (action === 'read') {
      updateData.status = 'READ'
      updateData.readAt = new Date()
      updateData.confirmedById = confirmedById
    } else if (action === 'offShelf') {
      updateData.status = 'OFF_SHELF'
      updateData.offShelfAt = new Date()
      updateData.offShelfPhoto = offShelfPhoto || 'placeholder.jpg'
      updateData.confirmedById = confirmedById
    } else if (action === 'mismatch') {
      updateData.status = 'BATCH_MISMATCH'
      updateData.mismatchNote = mismatchNote
      updateData.confirmedById = confirmedById
    }

    const updated = await prisma.storeRecall.update({
      where: {
        recallId_storeId: {
          recallId: id,
          storeId,
        },
      },
      data: updateData,
      include: { store: true },
    })

    if (action !== 'read') {
      await prisma.recallHistory.create({
        data: {
          recallId: id,
          action: action === 'offShelf' ? '门店下架确认' : '批号不匹配',
          detail: action === 'offShelf'
            ? `${updated.store.name} 已完成下架`
            : `${updated.store.name} 批号不匹配：${mismatchNote || ''}`,
          actorId: confirmedById,
        },
      })
    }

    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '操作失败' })
  }
})

// POST /api/recalls/:id/recovery - 登记回收
app.post('/api/recalls/:id/recovery', async (req, res) => {
  const { id } = req.params
  const { storeId, batchId, expectedQty, actualQty, notedById, note } = req.body

  try {
    const difference = actualQty - expectedQty

    const recovery = await prisma.recallRecovery.create({
      data: {
        recallId: id,
        storeId,
        batchId,
        expectedQty,
        actualQty,
        difference,
        notedById,
        note,
      },
      include: {
        store: true,
        batch: {
          include: { drug: true }
        },
      },
    })

    await prisma.storeRecall.update({
      where: {
        recallId_storeId: {
          recallId: id,
          storeId,
        },
      },
      data: { status: 'RECOVERED' },
    })

    await prisma.recallHistory.create({
      data: {
        recallId: id,
        action: '回收登记',
        detail: `${recovery.store.name} 回收 ${recovery.batch.drug.name} ${recovery.batch.batchNumber}：预期${expectedQty}盒，实际${actualQty}盒，差异${difference}盒`,
        actorId: notedById,
      },
    })

    res.status(201).json(recovery)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '登记失败' })
  }
})

// GET /api/stores - 门店列表
app.get('/api/stores', async (req, res) => {
  const stores = await prisma.store.findMany({
    orderBy: { code: 'asc' },
  })
  res.json(stores)
})

// GET /api/drugs - 药品列表
app.get('/api/drugs', async (req, res) => {
  const includeBatches = req.query.includeBatches === 'true'

  const drugs = await prisma.drug.findMany({
    include: includeBatches ? {
      batches: {
        orderBy: { productionDate: 'desc' },
      }
    } : undefined,
    orderBy: { name: 'asc' },
  })
  res.json(drugs)
})

// GET /api/analytics - 复盘统计
app.get('/api/analytics', async (req, res) => {
  const recalls = await prisma.recall.findMany({
    where: {
      status: {
        in: ['CLOSED', 'INVESTIGATING', 'RECOVERING', 'IN_PROGRESS', 'PUBLISHED'],
      },
    },
    include: {
      batches: {
        include: {
          drugBatch: {
            include: { drug: true },
          },
        },
      },
      stores: {
        include: { store: true },
      },
      recoveries: true,
    },
  })

  // 1. 汇总统计
  const summary = {
    total: recalls.length,
    closed: recalls.filter((r: any) => r.status === 'CLOSED').length,
    inProgress: recalls.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'PUBLISHED').length,
    recovering: recalls.filter((r: any) => r.status === 'RECOVERING').length,
    investigating: recalls.filter((r: any) => r.status === 'INVESTIGATING').length,
  }

  // 2. 按区域统计（召回涉及门店的区域分布）
  const regionMap: Record<string, number> = {}
  recalls.forEach((recall: any) => {
    const regions = new Set(recall.stores.map((s: any) => s.store.region))
    regions.forEach((region: any) => {
      regionMap[region] = (regionMap[region] || 0) + 1
    })
  })
  const byRegion = Object.entries(regionMap).map(([region, count]) => ({ region, count }))

  // 3. 按药品类别统计
  const categoryMap: Record<string, number> = {}
  recalls.forEach((recall: any) => {
    const categories = new Set(recall.batches.map((b: any) => b.drugBatch.drug.category))
    categories.forEach((cat: any) => {
      categoryMap[cat] = (categoryMap[cat] || 0) + 1
    })
  })
  const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }))

  // 4. 触达时长分布（从发布到门店首次读取的时间，按小时分桶）
  const touchHoursList: number[] = []
  recalls.forEach((recall: any) => {
    recall.stores.forEach((storeRecall: any) => {
      if (storeRecall.readAt) {
        const touchHours = (new Date(storeRecall.readAt).getTime() - new Date(recall.createdAt).getTime()) / (1000 * 60 * 60)
        touchHoursList.push(touchHours)
      }
    })
  })

  function bucketTouchHours(hours: number): string {
    if (hours < 1) return '0-1小时'
    if (hours < 4) return '1-4小时'
    if (hours < 12) return '4-12小时'
    if (hours < 24) return '12-24小时'
    if (hours < 48) return '24-48小时'
    return '48小时以上'
  }

  const touchBucketMap: Record<string, number> = {}
  touchHoursList.forEach((h) => {
    const bucket = bucketTouchHours(h)
    touchBucketMap[bucket] = (touchBucketMap[bucket] || 0) + 1
  })
  const touchBuckets = ['0-1小时', '1-4小时', '4-12小时', '12-24小时', '24-48小时', '48小时以上']
  const reachDuration = touchBuckets.map((bucket) => ({
    bucket,
    count: touchBucketMap[bucket] || 0,
  }))

  const avgReachDuration = touchHoursList.length > 0
    ? touchHoursList.reduce((a, b) => a + b, 0) / touchHoursList.length
    : 0

  // 5. 回收数量差异分布
  function bucketDiffQty(diff: number): string {
    const absDiff = Math.abs(diff)
    if (absDiff === 0) return '无差异'
    if (absDiff <= 5) return '轻微差异(1-5盒)'
    if (absDiff <= 20) return '中等差异(6-20盒)'
    return '严重差异(20盒以上)'
  }

  const diffBucketMap: Record<string, number> = {}
  let totalDifference = 0
  recalls.forEach((recall: any) => {
    recall.recoveries.forEach((recovery: any) => {
      const bucket = bucketDiffQty(recovery.difference)
      diffBucketMap[bucket] = (diffBucketMap[bucket] || 0) + 1
      totalDifference += recovery.difference
    })
  })
  const diffBuckets = ['无差异', '轻微差异(1-5盒)', '中等差异(6-20盒)', '严重差异(20盒以上)']
  const quantityDifference = diffBuckets.map((bucket) => ({
    bucket,
    count: diffBucketMap[bucket] || 0,
  }))

  // 6. 按召回级别统计
  const levelMap: Record<string, number> = {}
  recalls.forEach((recall: any) => {
    levelMap[recall.level] = (levelMap[recall.level] || 0) + 1
  })
  const byLevel = Object.entries(levelMap).map(([level, count]) => ({ level, count }))

  res.json({
    summary,
    byRegion,
    byCategory,
    reachDuration,
    quantityDifference,
    byLevel,
    avgReachDuration,
    totalDifference,
  })
})

// GET /api/users - 用户列表
app.get('/api/users', async (req, res) => {
  const role = req.query.role as string
  const where: any = {}
  if (role) {
    where.role = role
  }
  const users = await prisma.user.findMany({
    where,
    include: {
      store: {
        select: { name: true, code: true, region: true }
      }
    },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// GET /api/health - 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
