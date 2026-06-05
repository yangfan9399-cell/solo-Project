import prisma from '~/server/utils/prisma'
import { RequisitionStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { reviewerId, reviewOpinion } = body

  if (!id || !reviewerId) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { department: true, supplyBatch: true }
  })

  if (!requisition) {
    throw createError({ statusCode: 404, message: '领用记录不存在' })
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId }
  })

  if (!reviewer || reviewer.departmentId !== requisition.departmentId) {
    throw createError({ statusCode: 403, message: '复核人科室与申请科室不符' })
  }

  if (requisition.supplyBatchId && requisition.actualQuantity) {
    await prisma.supplyBatch.update({
      where: { id: requisition.supplyBatchId },
      data: {
        quantity: {
          increment: requisition.actualQuantity
        }
      }
    })
  }

  const updated = await prisma.requisition.update({
    where: { id },
    data: {
      status: RequisitionStatus.RETURNED,
      reviewerId,
      reviewOpinion
    },
    include: {
      supply: true,
      supplyBatch: true,
      department: true,
      nurse: true,
      warehouseAdmin: true,
      reviewer: true
    }
  })

  await prisma.requisitionHistory.create({
    data: {
      requisitionId: id,
      status: RequisitionStatus.RETURNED,
      operatorId: reviewerId,
      remark: reviewOpinion || '退回申请'
    }
  })

  return updated
})
