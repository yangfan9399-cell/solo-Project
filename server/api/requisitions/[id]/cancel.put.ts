import prisma from '~/server/utils/prisma'
import { RequisitionStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { operatorId, remark } = body

  if (!id || !operatorId) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { department: true }
  })

  if (!requisition) {
    throw createError({ statusCode: 404, message: '领用记录不存在' })
  }

  if (requisition.status !== RequisitionStatus.PENDING) {
    throw createError({ statusCode: 400, message: '仅待处理状态可撤回' })
  }

  const operator = await prisma.user.findUnique({
    where: { id: operatorId }
  })

  if (!operator || operator.departmentId !== requisition.departmentId) {
    throw createError({ statusCode: 403, message: '无权限撤回该申请' })
  }

  const updated = await prisma.requisition.update({
    where: { id },
    data: {
      status: RequisitionStatus.CANCELLED
    },
    include: {
      supply: true,
      supplyBatch: true,
      department: true,
      nurse: true
    }
  })

  await prisma.requisitionHistory.create({
    data: {
      requisitionId: id,
      status: RequisitionStatus.CANCELLED,
      operatorId,
      remark: remark || '撤回申请'
    }
  })

  return updated
})
