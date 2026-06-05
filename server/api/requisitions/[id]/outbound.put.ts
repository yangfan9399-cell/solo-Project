import prisma from '~/server/utils/prisma'
import { RequisitionStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { warehouseAdminId, supplyBatchId, actualQuantity, outboundBasis } = body

  if (!id || !warehouseAdminId || !supplyBatchId || !actualQuantity) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const batch = await prisma.supplyBatch.findUnique({
    where: { id: supplyBatchId }
  })

  if (!batch) {
    throw createError({ statusCode: 404, message: '批次不存在' })
  }

  const now = new Date()
  if (batch.expiredAt < now) {
    throw createError({
      statusCode: 400,
      message: '该批次已过期，请更换批次或撤回申请'
    })
  }

  if (batch.quantity < actualQuantity) {
    throw createError({
      statusCode: 400,
      message: `库存不足，当前库存: ${batch.quantity}`
    })
  }

  const requisition = await prisma.requisition.update({
    where: { id },
    data: {
      status: RequisitionStatus.OUTBOUND,
      warehouseAdminId,
      supplyBatchId,
      actualQuantity,
      outboundBasis
    },
    include: {
      supply: true,
      supplyBatch: true,
      department: true,
      nurse: true,
      warehouseAdmin: true
    }
  })

  await prisma.supplyBatch.update({
    where: { id: supplyBatchId },
    data: {
      quantity: {
        decrement: actualQuantity
      }
    }
  })

  await prisma.requisitionHistory.create({
    data: {
      requisitionId: id,
      status: RequisitionStatus.OUTBOUND,
      operatorId: warehouseAdminId,
      remark: '确认出库'
    }
  })

  return requisition
})
