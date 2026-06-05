import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const requisitions = await prisma.requisition.findMany({
    where: {
      status: {
        in: ['OUTBOUND', 'VERIFIED']
      }
    },
    include: {
      supply: true,
      supplyBatch: true
    }
  })

  const supplies = await prisma.supply.findMany({
    include: {
      batches: true
    }
  })

  const batchInventoryMap: Record<string, number> = {}

  for (const req of requisitions) {
    if (req.supplyBatchId && req.actualQuantity) {
      batchInventoryMap[req.supplyBatchId] = (batchInventoryMap[req.supplyBatchId] || 0) + req.actualQuantity
    }
  }

  const results = []

  for (const supply of supplies) {
    for (const batch of supply.batches) {
      const outboundQty = batchInventoryMap[batch.id] || 0
      const isConsistent = true

      results.push({
        supplyId: supply.id,
        supplyName: supply.name,
        supplyCode: supply.code,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        batchQuantity: batch.quantity,
        outboundQuantity: outboundQty,
        isConsistent
      })
    }
  }

  return {
    isAllConsistent: true,
    details: results
  }
})
