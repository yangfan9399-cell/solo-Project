import prisma from '~/server/utils/prisma'
import { RequisitionStatus, Role, InventoryChangeType } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { warehouseAdminId, supplyBatchId, actualQuantity, outboundBasis } = body

  if (!id || !warehouseAdminId || !supplyBatchId || !actualQuantity) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: warehouseAdminId }
  })

  if (!admin || admin.role !== Role.WAREHOUSE_ADMIN) {
    throw createError({ statusCode: 403, message: '仅库房管理员可执行出库操作' })
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id }
  })

  if (!requisition) {
    throw createError({ statusCode: 404, message: '领用记录不存在' })
  }

  if (requisition.status !== RequisitionStatus.PENDING) {
    throw createError({ statusCode: 400, message: '仅待处理状态可执行出库操作' })
  }

  const batch = await prisma.supplyBatch.findUnique({
    where: { id: supplyBatchId }
  })

  if (!batch) {
    throw createError({ statusCode: 404, message: '批次不存在' })
  }

  if (batch.supplyId !== requisition.supplyId) {
    throw createError({ statusCode: 400, message: '批次与耗材不匹配' })
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

  const updatedRequisition = await prisma.requisition.update({
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

  await prisma.inventoryChange.create({
    data: {
      batchId: supplyBatchId,
      requisitionId: id,
      changeType: InventoryChangeType.OUTBOUND,
      quantity: actualQuantity,
      operatorId: warehouseAdminId,
      remark: '领用出库'
    }
  })

  return updatedRequisition
})
