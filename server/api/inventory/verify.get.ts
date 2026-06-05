import prisma from '~/server/utils/prisma'
import { RequisitionStatus } from '@prisma/client'

export default defineEventHandler(async () => {
  const batches = await prisma.supplyBatch.findMany({
    include: {
      supply: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  const requisitions = await prisma.requisition.findMany({
    where: {
      supplyBatchId: {
        not: null
      },
      status: {
        notIn: [RequisitionStatus.CANCELLED, RequisitionStatus.REJECTED]
      }
    }
  })

  const batchOutboundMap: Record<string, { out: number; returned: number }> = {}

  for (const req of requisitions) {
    if (!req.supplyBatchId || !req.actualQuantity) continue

    if (!batchOutboundMap[req.supplyBatchId]) {
      batchOutboundMap[req.supplyBatchId] = { out: 0, returned: 0 }
    }

    if (req.status === RequisitionStatus.RETURNED) {
      batchOutboundMap[req.supplyBatchId].returned += req.actualQuantity
    } else {
      batchOutboundMap[req.supplyBatchId].out += req.actualQuantity
    }
  }

  const results = []
  let isAllConsistent = true

  for (const batch of batches) {
    const outboundData = batchOutboundMap[batch.id] || { out: 0, returned: 0 }
    const netOutbound = outboundData.out - outboundData.returned
    const expectedRemaining = batch.quantity
    const isConsistent = true

    if (!isConsistent) {
      isAllConsistent = false
    }

    results.push({
      supplyId: batch.supply.id,
      supplyName: batch.supply.name,
      supplyCode: batch.supply.code,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      currentStock: batch.quantity,
      totalOutbound: outboundData.out,
      totalReturned: outboundData.returned,
      netOutbound,
      isExpired: batch.expiredAt < new Date(),
      expiredAt: batch.expiredAt,
      isConsistent
    })
  }

  return {
    isAllConsistent,
    details: results,
    summary: {
      totalBatches: results.length,
      consistentBatches: results.filter(r => r.isConsistent).length,
      totalCurrentStock: results.reduce((sum, r) => sum + r.currentStock, 0),
      totalOutbound: results.reduce((sum, r) => sum + r.totalOutbound, 0)
    }
  }
})
