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

const ROLES = {
  APPLICANT: 'APPLICANT',
  PROCESSOR: 'PROCESSOR',
  REVIEWER: 'REVIEWER',
  ARCHIVIST: 'ARCHIVIST'
}

const STATUS = {
  PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  REPROCESSING: 'REPROCESSING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEW_PASSED: 'REVIEW_PASSED',
  REVIEW_REJECTED: 'REVIEW_REJECTED',
  ARCHIVED: 'ARCHIVED'
}

async function validateRecordState(recordId: number, operation: string, operatorRole: string) {
  const record = await findRecordById(recordId)
  if (!record) throw new Error('记录不存在')
  
  if (record.status === STATUS.ARCHIVED) {
    throw new Error('记录已归档，处于只读状态，不允许任何修改操作')
  }
  
  let allowed = false
  let requiredStatuses: string[] = []
  
  switch (operation) {
    case 'accept':
      requiredStatuses = [STATUS.PENDING_ACCEPTANCE]
      allowed = operatorRole === ROLES.PROCESSOR
      if (!allowed) throw new Error('只有处理人(耗材科)可以执行受理操作')
      break
    case 'process':
      requiredStatuses = [STATUS.ACCEPTED, STATUS.REPROCESSING, STATUS.PROCESSING]
      allowed = operatorRole === ROLES.PROCESSOR
      if (!allowed) throw new Error('只有处理人(耗材科)可以执行处理操作')
      break
    case 'review':
      requiredStatuses = [STATUS.PENDING_REVIEW]
      allowed = operatorRole === ROLES.REVIEWER
      if (!allowed) throw new Error('只有复核人(医务科)可以执行复核操作')
      break
    case 'archive':
      requiredStatuses = [STATUS.REVIEW_PASSED]
      allowed = operatorRole === ROLES.ARCHIVIST
      if (!allowed) throw new Error('只有归档人(病案室)可以执行归档操作')
      break
    case 'supplement':
      requiredStatuses = [STATUS.ACCEPTED, STATUS.PROCESSING, STATUS.REPROCESSING, STATUS.PENDING_REVIEW, STATUS.REVIEW_PASSED, STATUS.REVIEW_REJECTED]
      allowed = operatorRole === ROLES.APPLICANT || operatorRole === ROLES.PROCESSOR
      if (!allowed) throw new Error('只有申请人或处理人可以补充材料')
      break
    case 'reprocess':
      requiredStatuses = [STATUS.REVIEW_REJECTED, STATUS.REVIEW_PASSED]
      allowed = operatorRole === ROLES.REVIEWER || operatorRole === ROLES.PROCESSOR || (operatorRole === ROLES.ARCHIVIST && record.status === STATUS.REVIEW_PASSED)
      if (!allowed) throw new Error('只有复核人、处理人或归档复核人(退回补证)可以启动重新处理')
      break
    default:
      throw new Error('未知操作类型')
  }
  
  if (!requiredStatuses.includes(record.status)) {
    throw new Error(`当前状态(${record.status})不允许${operation}操作，允许的状态: ${requiredStatuses.join(', ')}`)
  }
  
  return record
}

async function getCurrentUser(operatorId: number) {
  const users = await getUsers()
  return users.find((u: any) => u.id === operatorId)
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
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'accept', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('记录已归档，不允许修改')
      if (current.status !== 'PENDING_ACCEPTANCE') throw new Error('当前状态不允许受理')
      
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
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'process', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('记录已归档，不允许修改')
      if (!['ACCEPTED', 'REPROCESSING', 'PROCESSING'].includes(current.status)) {
        throw new Error('当前状态不允许处理')
      }
      
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
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'review', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('记录已归档，不允许修改')
      if (current.status !== 'PENDING_REVIEW') throw new Error('当前状态不允许复核')
      
      const status = data.passed ? 'REVIEW_PASSED' : 'REPROCESSING'
      const recordData: any = {
        status,
        reviewTime: new Date(),
        reviewBasis: data.basis || null,
        conclusion: data.conclusion || null,
        blockingReason: data.passed ? null : data.blockingReason || null,
        remedialPath: data.passed ? null : data.remedialPath || null,
        currentHandlerId: data.passed ? 4 : 2,
        updatedAt: new Date()
      }
      if (!data.passed) {
        recordData.version = { increment: 1 }
        recordData.isAbnormal = true
        recordData.abnormalType = 'REPROCESS'
      }
      const record = await tx.consumableRecord.update({
        where: { id: Number(id) },
        data: recordData
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
      } else {
        const maxOrder = nodes.length > 0 ? Math.max(...nodes.map((n: any) => n.nodeOrder)) : 0
        await tx.reviewNode.create({
          data: {
            recordId: Number(id),
            nodeType: 'REPROCESS',
            nodeStatus: 'PENDING',
            nodeName: '重新处理节点',
            nodeOrder: maxOrder + 1,
            handlerId: 2,
            handlerName: '李护士',
            content: data.content || '复核退回，需重新处理',
            blockingReason: data.blockingReason || null,
            remedialPath: data.remedialPath || null
          }
        })
      }
      return record
    })
    return toPlain(result)
  }
  return inMemoryDB.reviewRecord(id, data)
}

export async function archiveRecord(id: number, data: any) {
  await ensureInitialized()
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'archive', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('记录已归档，不允许重复归档')
      if (current.status !== 'REVIEW_PASSED') throw new Error('当前状态不允许归档')
      
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
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'supplement', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('已归档记录不能补充材料')
      
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
  
  const operator = await getCurrentUser(data.operatorId)
  if (!operator) throw new Error('操作用户不存在')
  await validateRecordState(id, 'reprocess', operator.role)
  
  if (usePrisma && prisma) {
    const result = await prisma.$transaction(async (tx: any) => {
      const current = await tx.consumableRecord.findUnique({ where: { id: Number(id) } })
      if (!current) throw new Error('记录不存在')
      if (current.status === 'ARCHIVED') throw new Error('已归档记录需先申请重新开启')
      if (!['REVIEW_REJECTED', 'REVIEW_PASSED'].includes(current.status)) {
        throw new Error('当前状态不允许重新处理')
      }
      
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
    const [total, statusStats, normalCount, abnormalCount, archivedCount, deptStats, todayRecords] = await Promise.all([
      prisma.consumableRecord.count(),
      prisma.consumableRecord.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } }
      }),
      prisma.consumableRecord.count({ where: { isAbnormal: false } }),
      prisma.consumableRecord.count({ where: { isAbnormal: true } }),
      prisma.consumableRecord.count({ where: { status: 'ARCHIVED' } }),
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
        archived: archivedCount,
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
      abnormalTypeStats: abnormalByType.filter((t: any) => t.abnormalType).map((t: any) => ({
        abnormalType: t.abnormalType,
        _count: t._count.abnormalType
      })),
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
