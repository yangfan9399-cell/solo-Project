import { inMemoryDB } from './inMemoryDB'

let usePrisma = false
let prisma: any = null

try {
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
  usePrisma = true
} catch (e) {
  console.log('⚠️  Prisma 不可用，使用内存数据存储')
  usePrisma = false
}

export async function testPrisma() {
  if (!prisma) return false
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    console.log('⚠️  Prisma 数据库连接失败，使用内存数据存储')
    return false
  }
}

async function init() {
  if (usePrisma) {
    const ok = await testPrisma()
    if (!ok) {
      usePrisma = false
    }
  }
}

let initialized = false
async function ensureInitialized() {
  if (!initialized) {
    await init()
    initialized = true
  }
}

function toPlain(obj: any) {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(toPlain)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [k, v] of Object.entries(obj)) {
      if (v instanceof Date) {
        result[k] = v.toISOString()
      } else if (typeof v === 'object' && v !== null) {
        result[k] = toPlain(v)
      } else {
        result[k] = v
      }
    }
    return result
  }
  return obj
}

export async function findRecords(params: any = {}) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const { page = 1, pageSize = 10, status, abnormalType, deptName, isAbnormal, keyword } = params
    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (abnormalType && abnormalType !== 'all') where.abnormalType = abnormalType
    if (deptName && deptName !== 'all') where.deptName = deptName
    if (isAbnormal !== undefined && isAbnormal !== 'all') {
      where.isAbnormal = isAbnormal === 'true'
    }
    if (keyword) {
      where.OR = [
        { recordNo: { contains: keyword } },
        { patientName: { contains: keyword } },
        { consumableName: { contains: keyword } }
      ]
    }
    const [data, total] = await Promise.all([
      prisma.consumableRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          currentHandler: true,
          reviewNodes: { orderBy: { nodeOrder: 'asc' } },
          _count: { select: { attachments: true, reviewNodes: true } }
        }
      }),
      prisma.consumableRecord.count({ where })
    ])
    return {
      data: toPlain(data),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
  return inMemoryDB.findRecords(params)
}

export async function findRecordById(id: number) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const record = await prisma.consumableRecord.findUnique({
      where: { id: Number(id) },
      include: {
        currentHandler: true,
        reviewNodes: {
          orderBy: { nodeOrder: 'asc' },
          include: {
            operator: true,
            attachments: true,
            fieldDiffs: true
          }
        },
        attachments: true,
        fieldDiffs: true
      }
    })
    return toPlain(record)
  }
  return inMemoryDB.findRecordById(id)
}

export async function acceptRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: {
          status: 'ACCEPTED',
          currentHandlerId: data.handlerId,
          acceptTime: new Date(),
          updatedAt: new Date()
        }
      })
      await tx.reviewNode.updateMany({
        where: { recordId: Number(id), nodeType: 'ACCEPTANCE', nodeStatus: 'PENDING' },
        data: {
          nodeStatus: 'COMPLETED',
          operatorId: data.operatorId,
          operatorName: data.operatorName,
          content: data.content || '已受理',
          basis: data.basis || null,
          completedAt: new Date()
        }
      })
      await tx.reviewNode.upsert({
        where: { id: -1 },
        create: {
          recordId: Number(id),
          nodeType: 'PROCESSING',
          nodeStatus: 'PENDING',
          nodeName: '处理节点',
          nodeOrder: 2,
          handlerId: data.handlerId,
          handlerName: data.handlerName
        },
        update: {}
      })
      return record
    })
    return toPlain(result)
  }
  return inMemoryDB.acceptRecord(id, data)
}

export async function processRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: {
          status: 'PENDING_REVIEW',
          processTime: new Date(),
          isAbnormal: !!data.isAbnormal,
          abnormalType: data.abnormalType || null,
          abnormalReason: data.abnormalReason || null,
          blockingReason: data.isAbnormal ? data.blockingReason || null : null,
          remedialPath: data.isAbnormal ? data.remedialPath || null : null,
          currentHandlerId: 3,
          updatedAt: new Date()
        }
      })
      const nodes = await tx.reviewNode.findMany({
        where: { recordId: Number(id) },
        orderBy: { nodeOrder: 'asc' }
      })
      const currentNode = nodes.find(
        (n: any) => (n.nodeType === 'PROCESSING' || n.nodeType === 'REPROCESS') && n.nodeStatus === 'PENDING'
      )
      if (currentNode) {
        await tx.reviewNode.update({
          where: { id: currentNode.id },
          data: {
            nodeStatus: 'COMPLETED',
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            content: data.content || '处理完成',
            basis: data.basis || null,
            blockingReason: data.isAbnormal ? data.blockingReason || null : null,
            remedialPath: data.isAbnormal ? data.remedialPath || null : null,
            completedAt: new Date()
          }
        })
      }
      const reviewNode = nodes.find((n: any) => n.nodeType === 'REVIEW')
      if (reviewNode) {
        await tx.reviewNode.update({
          where: { id: reviewNode.id },
          data: { nodeStatus: 'PENDING', handlerId: 3, handlerName: '王主任' }
        })
      } else {
        const maxOrder = nodes.length > 0 ? Math.max(...nodes.map((n: any) => n.nodeOrder)) : 0
        await tx.reviewNode.create({
          data: {
            recordId: Number(id),
            nodeType: 'REVIEW',
            nodeStatus: 'PENDING',
            nodeName: '复核节点',
            nodeOrder: maxOrder + 1,
            handlerId: 3,
            handlerName: '王主任'
          }
        })
      }
      return record
    })
    return toPlain(result)
  }
  return inMemoryDB.processRecord(id, data)
}

export async function reviewRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const status = data.passed ? 'REVIEW_PASSED' : 'REVIEW_REJECTED'
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: {
          status,
          reviewTime: new Date(),
          reviewBasis: data.basis || null,
          conclusion: data.conclusion || null,
          blockingReason: data.passed ? null : data.blockingReason || null,
          remedialPath: data.passed ? null : data.remedialPath || null,
          currentHandlerId: data.passed ? 4 : 2,
          updatedAt: new Date()
        }
      })
      const nodes = await tx.reviewNode.findMany({
        where: { recordId: Number(id) },
        orderBy: { nodeOrder: 'asc' }
      })
      const reviewNode = nodes.find((n: any) => n.nodeType === 'REVIEW' && n.nodeStatus === 'PENDING')
      if (reviewNode) {
        await tx.reviewNode.update({
          where: { id: reviewNode.id },
          data: {
            nodeStatus: data.passed ? 'COMPLETED' : 'REJECTED',
            operatorId: data.operatorId,
            operatorName: data.operatorName,
            content: data.content || (data.passed ? '复核通过' : '复核退回'),
            basis: data.basis || null,
            blockingReason: data.passed ? null : data.blockingReason || null,
            remedialPath: data.passed ? null : data.remedialPath || null,
            completedAt: new Date()
          }
        })
        if (data.fieldDiffs && data.fieldDiffs.length > 0) {
          for (const diff of data.fieldDiffs) {
            await tx.fieldDiff.create({
              data: {
                recordId: Number(id),
                nodeId: reviewNode.id,
                fieldName: diff.fieldName,
                fieldLabel: diff.fieldLabel,
                oldValue: diff.oldValue || null,
                newValue: diff.newValue || null,
                diffType: diff.diffType,
                changedBy: data.operatorName
              }
            })
          }
        }
      }
      if (data.passed) {
        const archiveNode = nodes.find((n: any) => n.nodeType === 'ARCHIVE')
        const maxOrder = nodes.length > 0 ? Math.max(...nodes.map((n: any) => n.nodeOrder)) : 0
        if (archiveNode) {
          await tx.reviewNode.update({
            where: { id: archiveNode.id },
            data: { nodeStatus: 'PENDING', handlerId: 4, handlerName: '赵档案' }
          })
        } else {
          await tx.reviewNode.create({
            data: {
              recordId: Number(id),
              nodeType: 'ARCHIVE',
              nodeStatus: 'PENDING',
              nodeName: '归档节点',
              nodeOrder: maxOrder + 1,
              handlerId: 4,
              handlerName: '赵档案'
            }
          })
        }
      }
      return record
    })
    return toPlain(result)
  }
  return inMemoryDB.reviewRecord(id, data)
}

export async function archiveRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: {
          status: 'ARCHIVED',
          archiveTime: new Date(),
          updatedAt: new Date()
        }
      })
      await tx.reviewNode.updateMany({
        where: { recordId: Number(id), nodeType: 'ARCHIVE', nodeStatus: 'PENDING' },
        data: {
          nodeStatus: 'COMPLETED',
          operatorId: data.operatorId,
          operatorName: data.operatorName,
          content: data.content || '已归档',
          basis: data.basis || null,
          completedAt: new Date()
        }
      })
      return record
    })
    return toPlain(result)
  }
  return inMemoryDB.archiveRecord(id, data)
}

export async function supplementRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const nodes = await tx.reviewNode.findMany({
        where: { recordId: Number(id) },
        orderBy: { nodeOrder: 'asc' }
      })
      const maxOrder = nodes.length > 0 ? Math.max(...nodes.map((n: any) => n.nodeOrder)) : 0
      const supplementNode = await tx.reviewNode.create({
        data: {
          recordId: Number(id),
          nodeType: 'SUPPLEMENT',
          nodeStatus: 'COMPLETED',
          nodeName: '补证节点',
          nodeOrder: maxOrder + 1,
          operatorId: data.operatorId,
          operatorName: data.operatorName,
          handlerId: data.operatorId,
          handlerName: data.operatorName,
          content: data.content || '补充材料',
          completedAt: new Date()
        }
      })
      if (data.attachments && data.attachments.length > 0) {
        for (const att of data.attachments) {
          await tx.attachment.create({
            data: {
              recordId: Number(id),
              nodeId: supplementNode.id,
              fileName: att.fileName,
              fileType: att.fileType,
              fileUrl: att.fileUrl,
              version: att.version || 1,
              uploadedBy: data.operatorName,
              isEvidence: att.isEvidence || false
            }
          })
        }
      }
      await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: { updatedAt: new Date() }
      })
      return { success: true, data: toPlain(supplementNode) }
    })
    return result
  }
  return inMemoryDB.supplementRecord(id, data)
}

export async function reprocessRecord(id: number, data: any) {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: {
          status: 'REPROCESSING',
          currentHandlerId: data.handlerId,
          isAbnormal: true,
          abnormalType: 'REPROCESS',
          abnormalReason: data.reason || '重新处理',
          version: { increment: 1 },
          updatedAt: new Date()
        }
      })
      const nodes = await tx.reviewNode.findMany({
        where: { recordId: Number(id) },
        orderBy: { nodeOrder: 'asc' }
      })
      const maxOrder = nodes.length > 0 ? Math.max(...nodes.map((n: any) => n.nodeOrder)) : 0
      await tx.reviewNode.create({
        data: {
          recordId: Number(id),
          nodeType: 'REPROCESS',
          nodeStatus: 'PENDING',
          nodeName: '重新处理节点',
          nodeOrder: maxOrder + 1,
          handlerId: data.handlerId,
          handlerName: data.handlerName,
          content: data.content || '重新处理',
          basis: data.reason || null
        }
      })
      return toPlain(record)
    })
    return result
  }
  return inMemoryDB.reprocessRecord(id, data)
}

export async function getStats() {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const [total, statusStats, normalCount, abnormalCount, deptStats, todayRecords] = await Promise.all([
      prisma.consumableRecord.count(),
      prisma.consumableRecord.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } }
      }),
      prisma.consumableRecord.count({ where: { isAbnormal: false } }),
      prisma.consumableRecord.count({ where: { isAbnormal: true } }),
      prisma.consumableRecord.groupBy({
        by: ['deptName'],
        _count: { deptName: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { deptName: 'desc' } }
      }),
      prisma.consumableRecord.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])
    const abnormalByType = await prisma.consumableRecord.groupBy({
      by: ['abnormalType'],
      _count: { abnormalType: true },
      where: { isAbnormal: true, abnormalType: { not: null } }
    })
    const totalAmountResult = await prisma.consumableRecord.aggregate({
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    })
    return {
      overview: {
        total,
        normal: normalCount,
        abnormal: abnormalCount,
        abnormalRate: total > 0 ? ((abnormalCount / total) * 100).toFixed(1) + '%' : '0%'
      },
      statusStats: statusStats.map((s: any) => ({ status: s.status, _count: s._count.status })),
      abnormalStats: {
        normal: normalCount,
        abnormal: abnormalCount,
        byType: abnormalByType.filter((t: any) => t.abnormalType).map((t: any) => ({
          type: t.abnormalType,
          count: t._count.abnormalType
        }))
      },
      deptStats: deptStats.map((d: any) => ({
        deptName: d.deptName,
        count: d._count.deptName,
        totalAmount: d._sum.totalAmount || 0
      })),
      today: {
        count: todayRecords._count.id || 0,
        amount: todayRecords._sum.totalAmount || 0
      },
      amount: {
        total: totalAmountResult._sum.totalAmount || 0,
        average: totalAmountResult._avg.totalAmount || 0
      }
    }
  }
  return inMemoryDB.getStats()
}

export async function getUsers() {
  await ensureInitialized()
  if (usePrisma && prisma) {
    const users = await prisma.user.findMany()
    return toPlain(users)
  }
  return inMemoryDB.users
}

export const dataService = {
  findRecords,
  findRecordById,
  acceptRecord,
  processRecord,
  reviewRecord,
  archiveRecord,
  supplementRecord,
  reprocessRecord,
  getStats,
  getUsers
}

export default dataService
