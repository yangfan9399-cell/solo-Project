import prisma from '~/server/utils/prisma'
import { RequisitionStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { supplyId, supplyBatchId, departmentId, nurseId, applyQuantity, usageDescription } = body

  if (!supplyId || !departmentId || !nurseId || !applyQuantity) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  const nurse = await prisma.user.findUnique({
    where: { id: nurseId }
  })

  if (!nurse || nurse.departmentId !== departmentId) {
    throw createError({ statusCode: 403, message: '申请人科室与申请科室不符' })
  }

  const count = await prisma.requisition.count()
  const requisitionNo = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const requisition = await prisma.requisition.create({
    data: {
      requisitionNo,
      supplyId,
      supplyBatchId: supplyBatchId || null,
      departmentId,
      nurseId,
      applyQuantity,
      usageDescription,
      status: RequisitionStatus.PENDING
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
      requisitionId: requisition.id,
      status: RequisitionStatus.PENDING,
      operatorId: nurseId,
      remark: '提交领用申请'
    }
  })

  return requisition
})
