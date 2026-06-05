import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { ApplicationStatus, InspectionResult } from '@prisma/client'

const createApplicationSchema = z.object({
  merchantId: z.string(),
  shopUnitId: z.string(),
  projectName: z.string(),
  constructionStart: z.string().datetime(),
  constructionEnd: z.string().datetime(),
  estimatedCost: z.number().optional(),
  projectScope: z.string(),
  responsiblePersons: z.array(z.object({
    name: z.string(),
    role: z.string(),
    phone: z.string(),
    email: z.string().optional()
  })).optional()
})

const checkTimeConflictSchema = z.object({
  shopUnitId: z.string(),
  constructionStart: z.string().datetime(),
  constructionEnd: z.string().datetime(),
  excludeApplicationId: z.string().optional()
})

const investmentReviewSchema = z.object({
  investmentManagerId: z.string(),
  drawings: z.array(z.object({
    name: z.string(),
    type: z.enum(['FLOOR_PLAN', 'FIRE_PLAN', 'ELECTRICAL_PLAN', 'CONSTRUCTION_DRAWING', 'CERTIFICATE', 'OTHER']),
    fileUrl: z.string(),
    description: z.string().optional()
  })).optional()
})

const engineerInspectionSchema = z.object({
  handlerId: z.string(),
  result: z.enum(['PASSED', 'REJECTED', 'NEEDS_RECTIFICATION', 'DRAWINGS_MISSING', 'TIME_CONFLICT']),
  remarks: z.string().optional()
})

const fireInspectionSchema = z.object({
  handlerId: z.string(),
  result: z.enum(['PASSED', 'REJECTED', 'NEEDS_RECTIFICATION']),
  remarks: z.string().optional(),
  rectificationDeadline: z.string().datetime().optional(),
  rectificationRequirements: z.string().optional()
})

const archiveSchema = z.object({
  handlerId: z.string()
})

export default async function applicationRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    return await prisma.application.findMany({
      include: {
        merchant: true,
        shopUnit: true,
        investmentManager: true,
        inspectionNodes: {
          orderBy: { nodeOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  })

  server.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.application.findUnique({
      where: { id },
      include: {
        merchant: true,
        shopUnit: true,
        investmentManager: true,
        drawings: {
          include: { uploadedBy: true }
        },
        inspectionNodes: {
          include: {
            handler: true,
            rectifications: true
          },
          orderBy: { nodeOrder: 'asc' }
        },
        responsiblePersons: true
      }
    })
  })

  server.post('/check-time-conflict', async (request) => {
    const data = checkTimeConflictSchema.parse(request.body)
    
    const conflictingApplications = await prisma.application.findMany({
      where: {
        shopUnitId: data.shopUnitId,
        id: data.excludeApplicationId ? { not: data.excludeApplicationId } : undefined,
        status: { notIn: ['ARCHIVED', 'DRAFT'] },
        AND: [
          { constructionStart: { lte: new Date(data.constructionEnd) } },
          { constructionEnd: { gte: new Date(data.constructionStart) } }
        ]
      },
      include: { merchant: true }
    })

    return {
      hasConflict: conflictingApplications.length > 0,
      conflictingApplications
    }
  })

  server.post('/', async (request) => {
    const data = createApplicationSchema.parse(request.body)

    const conflictCheck = await prisma.application.findMany({
      where: {
        shopUnitId: data.shopUnitId,
        status: { notIn: ['ARCHIVED', 'DRAFT'] },
        AND: [
          { constructionStart: { lte: new Date(data.constructionEnd) } },
          { constructionEnd: { gte: new Date(data.constructionStart) } }
        ]
      }
    })

    if (conflictCheck.length > 0) {
      return server.httpErrors.conflict('施工时间与现有申请冲突，请调整施工时段')
    }

    return await prisma.application.create({
      data: {
        merchantId: data.merchantId,
        shopUnitId: data.shopUnitId,
        projectName: data.projectName,
        constructionStart: new Date(data.constructionStart),
        constructionEnd: new Date(data.constructionEnd),
        estimatedCost: data.estimatedCost,
        projectScope: data.projectScope,
        status: ApplicationStatus.SUBMITTED,
        inspectionNodes: {
          create: [
            { nodeType: '投资主管审核', nodeOrder: 1 },
            { nodeType: '工程人员现场检查', nodeOrder: 2 },
            { nodeType: '消防复核', nodeOrder: 3 }
          ]
        },
        responsiblePersons: data.responsiblePersons ? {
          createMany: { data: data.responsiblePersons }
        } : undefined
      },
      include: {
        merchant: true,
        shopUnit: true,
        inspectionNodes: true
      }
    })
  })

  server.put('/:id/investment-review', async (request) => {
    const { id } = request.params as { id: string }
    const data = investmentReviewSchema.parse(request.body)

    const application = await prisma.application.findUnique({
      where: { id },
      include: { inspectionNodes: { orderBy: { nodeOrder: 'asc' } } }
    })

    if (!application) {
      return server.httpErrors.notFound('申请不存在')
    }

    if (application.status !== ApplicationStatus.SUBMITTED) {
      return server.httpErrors.badRequest('当前状态不可进行投资主管审核')
    }

    const firstNode = application.inspectionNodes[0]

    return await prisma.$transaction(async (tx) => {
      if (data.drawings && data.drawings.length > 0) {
        await tx.drawing.createMany({
          data: data.drawings.map(d => ({
            ...d,
            applicationId: id,
            uploadedById: data.investmentManagerId
          }))
        })
      }

      await tx.inspectionNode.update({
        where: { id: firstNode.id },
        data: {
          result: InspectionResult.PASSED,
          handlerId: data.investmentManagerId,
          handledAt: new Date(),
          remarks: '资料审核通过，施工时段确认'
        }
      })

      return await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.INVESTMENT_REVIEWED,
          investmentManagerId: data.investmentManagerId
        },
        include: {
          merchant: true,
          shopUnit: true,
          investmentManager: true,
          inspectionNodes: {
            include: {
              handler: true,
              rectifications: true
            },
            orderBy: { nodeOrder: 'asc' }
          },
          responsiblePersons: true,
          drawings: {
            include: { uploadedBy: true }
          }
        }
      })
    })
  })

  server.put('/:id/engineer-inspection', async (request) => {
    const { id } = request.params as { id: string }
    const data = engineerInspectionSchema.parse(request.body)

    const application = await prisma.application.findUnique({
      where: { id },
      include: { inspectionNodes: { orderBy: { nodeOrder: 'asc' } } }
    })

    if (!application) {
      return server.httpErrors.notFound('申请不存在')
    }

    if (application.status !== ApplicationStatus.INVESTMENT_REVIEWED) {
      return server.httpErrors.badRequest('当前状态不可进行工程人员检查')
    }

    if (data.result === 'TIME_CONFLICT') {
      return server.httpErrors.conflict('检测到施工时间冲突，请重新安排施工时段')
    }

    const secondNode = application.inspectionNodes.find(
      node => node.nodeType.includes('工程人员现场检查') && !node.result
    ) || application.inspectionNodes.find(
      node => node.nodeType.includes('工程人员现场检查')
    ) || application.inspectionNodes[1]

    return await prisma.$transaction(async (tx) => {
      await tx.inspectionNode.update({
        where: { id: secondNode.id },
        data: {
          result: data.result as InspectionResult,
          handlerId: data.handlerId,
          handledAt: new Date(),
          remarks: data.remarks
        }
      })

      let newStatus = ApplicationStatus.ENGINEER_INSPECTED

      if (data.result === 'PASSED') {
        newStatus = ApplicationStatus.ENGINEER_INSPECTED
      } else if (data.result === 'DRAWINGS_MISSING') {
        newStatus = ApplicationStatus.INVESTMENT_REVIEWED
        const maxNodeOrder = Math.max(...application!.inspectionNodes.map(n => n.nodeOrder))
        await tx.inspectionNode.create({
          data: {
            applicationId: id,
            nodeType: '工程人员现场检查（补图后）',
            nodeOrder: maxNodeOrder + 1,
            remarks: '补充图纸后重新进行工程检查'
          }
        })
      } else if (data.result === 'NEEDS_RECTIFICATION') {
        newStatus = ApplicationStatus.ENGINEER_INSPECTED
        await tx.rectification.create({
          data: {
            inspectionNodeId: secondNode.id,
            description: data.remarks || '需进行现场整改'
          }
        })
      } else if (data.result === 'REJECTED') {
        newStatus = ApplicationStatus.SUBMITTED
      }

      return await tx.application.update({
        where: { id },
        data: { status: newStatus },
        include: {
          merchant: true,
          shopUnit: true,
          investmentManager: true,
          inspectionNodes: {
            include: {
              handler: true,
              rectifications: true
            },
            orderBy: { nodeOrder: 'asc' }
          },
          responsiblePersons: true,
          drawings: {
            include: { uploadedBy: true }
          }
        }
      })
    })
  })

  server.put('/:id/fire-inspection', async (request) => {
    const { id } = request.params as { id: string }
    const data = fireInspectionSchema.parse(request.body)

    const application = await prisma.application.findUnique({
      where: { id },
      include: { inspectionNodes: { orderBy: { nodeOrder: 'asc' } } }
    })

    if (!application) {
      return server.httpErrors.notFound('申请不存在')
    }

    if (application.status !== ApplicationStatus.ENGINEER_INSPECTED) {
      return server.httpErrors.badRequest('当前状态不可进行消防复核')
    }

    const thirdNode = application.inspectionNodes.find(
      node => node.nodeType === '消防复核' && !node.result
    ) || application.inspectionNodes[2]

    return await prisma.$transaction(async (tx) => {
      await tx.inspectionNode.update({
        where: { id: thirdNode.id },
        data: {
          result: data.result as InspectionResult,
          handlerId: data.handlerId,
          handledAt: new Date(),
          remarks: data.remarks,
          rectificationDeadline: data.rectificationDeadline ? new Date(data.rectificationDeadline) : null,
          rectificationRequirements: data.rectificationRequirements
        }
      })

      if (data.result === 'NEEDS_RECTIFICATION') {
        const currentMaxNodeOrder = Math.max(...application.inspectionNodes.map(n => n.nodeOrder))
        await tx.inspectionNode.create({
          data: {
            applicationId: id,
            nodeType: '消防整改复核',
            nodeOrder: currentMaxNodeOrder + 1,
            rectificationRequirements: data.rectificationRequirements,
            rectificationDeadline: data.rectificationDeadline ? new Date(data.rectificationDeadline) : null
          }
        })

        await tx.rectification.create({
          data: {
            inspectionNodeId: thirdNode.id,
            description: data.rectificationRequirements || data.remarks || '需进行消防整改'
          }
        })
      }

      const newStatus = data.result === 'PASSED' 
        ? ApplicationStatus.FIRE_PASSED
        : data.result === 'REJECTED'
        ? ApplicationStatus.FIRE_REJECTED
        : ApplicationStatus.ENGINEER_INSPECTED

      return await tx.application.update({
        where: { id },
        data: { status: newStatus },
        include: {
          merchant: true,
          shopUnit: true,
          investmentManager: true,
          inspectionNodes: {
            include: {
              handler: true,
              rectifications: true
            },
            orderBy: { nodeOrder: 'asc' }
          },
          responsiblePersons: true,
          drawings: {
            include: { uploadedBy: true }
          }
        }
      })
    })
  })

  server.put('/:id/rectification-complete', async (request) => {
    const { id } = request.params as { id: string }
    const data = z.object({ handlerId: z.string(), nodeId: z.string() }).parse(request.body)

    const application = await prisma.application.findUnique({
      where: { id },
      include: { inspectionNodes: true }
    })

    if (!application) {
      return server.httpErrors.notFound('申请不存在')
    }

    const rectNode = application.inspectionNodes.find(n => n.id === data.nodeId)
    if (!rectNode) {
      return server.httpErrors.notFound('验收节点不存在')
    }

    const originalFireNode = application.inspectionNodes.find(
      n => n.result === 'NEEDS_RECTIFICATION' && n.nodeType === '消防复核'
    )

    return await prisma.$transaction(async (tx) => {
      if (originalFireNode) {
        await tx.rectification.updateMany({
          where: { inspectionNodeId: originalFireNode.id },
          data: { status: 'completed', completedAt: new Date() }
        })
      }

      await tx.inspectionNode.update({
        where: { id: data.nodeId },
        data: {
          result: InspectionResult.PASSED,
          handlerId: data.handlerId,
          handledAt: new Date(),
          remarks: '整改完成，消防复核通过'
        }
      })

      await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.FIRE_PASSED }
      })

      return await tx.application.findUnique({
        where: { id },
        include: {
          merchant: true,
          shopUnit: true,
          investmentManager: true,
          inspectionNodes: {
            include: {
              handler: true,
              rectifications: true
            },
            orderBy: { nodeOrder: 'asc' }
          },
          responsiblePersons: true,
          drawings: {
            include: { uploadedBy: true }
          }
        }
      })
    })
  })

  server.put('/:id/archive', async (request) => {
    const { id } = request.params as { id: string }
    const data = archiveSchema.parse(request.body)

    const application = await prisma.application.findUnique({
      where: { id },
      include: { inspectionNodes: true }
    })

    if (!application) {
      return server.httpErrors.notFound('申请不存在')
    }

    if (application.status !== ApplicationStatus.FIRE_PASSED) {
      return server.httpErrors.badRequest('只有消防验收通过的申请才能归档')
    }

    const maxNodeOrder = Math.max(...application.inspectionNodes.map(n => n.nodeOrder))

    return await prisma.$transaction(async (tx) => {
      await tx.inspectionNode.create({
        data: {
          applicationId: id,
          nodeType: '归档',
          nodeOrder: maxNodeOrder + 1,
          result: InspectionResult.PASSED,
          handlerId: data.handlerId,
          handledAt: new Date(),
          remarks: '档案整理完成，资料齐全，正式归档'
        }
      })

      return await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.ARCHIVED },
        include: {
          merchant: true,
          shopUnit: true,
          investmentManager: true,
          inspectionNodes: {
            include: {
              handler: true,
              rectifications: true
            },
            orderBy: { nodeOrder: 'asc' }
          },
          responsiblePersons: true,
          drawings: {
            include: { uploadedBy: true }
          }
        }
      })
    })
  })

  server.put('/:id/reschedule', async (request) => {
    const { id } = request.params as { id: string }
    const data = z.object({
      constructionStart: z.string().datetime(),
      constructionEnd: z.string().datetime()
    }).parse(request.body)

    const conflictCheck = await prisma.application.findMany({
      where: {
        shopUnitId: (await prisma.application.findUnique({ where: { id } }))?.shopUnitId,
        id: { not: id },
        status: { notIn: ['ARCHIVED', 'DRAFT'] },
        AND: [
          { constructionStart: { lte: new Date(data.constructionEnd) } },
          { constructionEnd: { gte: new Date(data.constructionStart) } }
        ]
      }
    })

    if (conflictCheck.length > 0) {
      return server.httpErrors.conflict('新的施工时间仍有冲突，请继续调整')
    }

    return await prisma.application.update({
      where: { id },
      data: {
        constructionStart: new Date(data.constructionStart),
        constructionEnd: new Date(data.constructionEnd)
      },
      include: {
        merchant: true,
        shopUnit: true
      }
    })
  })

  server.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.application.delete({ where: { id } })
  })
}
