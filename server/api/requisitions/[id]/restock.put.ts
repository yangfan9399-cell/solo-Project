import prisma from '~/server/utils/prisma'
import { InventoryChangeType, Role } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { warehouseAdminId, quantity, remark } = body

  if (!id || !warehouseAdminId || !quantity) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const admin = await prisma.user.findUnique({
    where: { id: warehouseAdminId }
  })

  if (!admin || admin.role !== Role.WAREHOUSE_ADMIN) {
    throw createError({ statusCode: 403, message: '仅库房管理员可执行补货操作' })
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { supplyBatch: true }
  })

  if (!requisition || !requisition.supplyBatchId) {
    throw createError({ statusCode: 404, message: '领用记录或批次不存在' })
  }

  await prisma.supplyBatch.update({
    where: { id: requisition.supplyBatchId },
    data: {
      quantity: {
        increment: quantity
      }
    }
  })

  await prisma.inventoryChange.create({
    data: {
      batchId: requisition.supplyBatchId,
      requisitionId: id,
      changeType: InventoryChangeType.RESTOCK,
      quantity,
      operatorId: warehouseAdminId,
      remark: remark || `补货 ${quantity}`
    }
  })

  return { success: true, message: '补货成功' }
})
