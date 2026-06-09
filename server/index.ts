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
        in: ['CLOSED', 'INVESTIGATING', 'RECOVERING', 'IN_PROGRESS'],
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

  const byRegion: Record<string, any> = {}
  const byCategory: Record<string, any> = {}
  const touchTimeData: any[] = []
  const differenceData: any[] = []

  recalls.forEach((recall: any) => {
    recall.stores.forEach((storeRecall: any) => {
      const region = storeRecall.store.region

      if (!byRegion[region]) {
        byRegion[region] = {
          region,
          totalRecalls: 0,
          totalStores: 0,
          unreadCount: 0,
          mismatchCount: 0,
          avgTouchHours: 0,
          totalTouchHours: 0,
          touchCount: 0,
        }
      }
      byRegion[region].totalStores++
      if (storeRecall.status === 'UNREAD') byRegion[region].unreadCount++
      if (storeRecall.status === 'BATCH_MISMATCH') byRegion[region].mismatchCount++

      if (storeRecall.readAt) {
        const touchHours = (new Date(storeRecall.readAt).getTime() - new Date(recall.createdAt).getTime()) / (1000 * 60 * 60)
        byRegion[region].totalTouchHours += touchHours
        byRegion[region].touchCount++
      }
    })

    const categories = new Set(recall.batches.map((b: any) => b.drugBatch.drug.category))
    categories.forEach((cat: any) => {
      if (!byCategory[cat]) {
        byCategory[cat] = {
          category: cat,
          recallCount: 0,
          totalBatches: 0,
        }
      }
      byCategory[cat].recallCount++
      byCategory[cat].totalBatches += recall.batches.filter(
        (b: any) => b.drugBatch.drug.category === cat
      ).length
    })

    recall.stores.forEach((storeRecall: any) => {
      if (storeRecall.readAt) {
        const touchHours = (new Date(storeRecall.readAt).getTime() - new Date(recall.createdAt).getTime()) / (1000 * 60 * 60)
        touchTimeData.push({
          recallId: recall.id,
          recallTitle: recall.title,
          store: storeRecall.store.name,
          region: storeRecall.store.region,
          touchHours: Math.round(touchHours * 10) / 10,
        })
      }
    })

    recall.recoveries.forEach((recovery: any) => {
      if (recovery.difference !== 0) {
        differenceData.push({
          recallId: recall.id,
          recallTitle: recall.title,
          storeId: recovery.storeId,
          expectedQty: recovery.expectedQty,
          actualQty: recovery.actualQty,
          difference: recovery.difference,
          note: recovery.note,
        })
      }
    })
  })

  Object.keys(byRegion).forEach((region) => {
    if (byRegion[region].touchCount > 0) {
      byRegion[region].avgTouchHours = Math.round(
        (byRegion[region].totalTouchHours / byRegion[region].touchCount) * 10
      ) / 10
    }
    byRegion[region].totalRecalls = recalls.filter((r: any) =>
      r.stores.some((s: any) => s.store.region === region)
    ).length
  })

  const summary = {
    totalRecalls: recalls.length,
    closedRecalls: recalls.filter((r: any) => r.status === 'CLOSED').length,
    inProgressRecalls: recalls.filter((r: any) => r.status === 'IN_PROGRESS').length,
    recoveringRecalls: recalls.filter((r: any) => r.status === 'RECOVERING').length,
    investigatingRecalls: recalls.filter((r: any) => r.status === 'INVESTIGATING').length,
    totalStores: recalls.reduce((sum: number, r: any) => sum + r.stores.length, 0),
    totalRecoveries: recalls.reduce((sum: number, r: any) => sum + r.recoveries.length, 0),
    totalDifferenceQty: recalls.reduce(
      (sum: number, r: any) => sum + r.recoveries.reduce((s: number, rec: any) => s + Math.abs(rec.difference), 0),
      0
    ),
  }

  res.json({
    summary,
    byRegion: Object.values(byRegion),
    byCategory: Object.values(byCategory),
    touchTimeData: touchTimeData.sort((a, b) => b.touchHours - a.touchHours),
    differenceData: differenceData.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)),
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
