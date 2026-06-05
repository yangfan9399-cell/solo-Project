import prisma from '~/server/utils/prisma'
import { InventoryChangeType } from '@prisma/client'

export default defineEventHandler(async () => {
  const batches = await prisma.supplyBatch.findMany({
    include: {
      supply: true,
      inventoryChanges: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  const results = []
  let isAllConsistent = true

  for (const batch of batches) {
    let totalOutbound = 0
    let totalReturned = 0
    let totalRestock = 0

    for (const change of batch.inventoryChanges) {
      if (change.changeType === InventoryChangeType.OUTBOUND) {
        totalOutbound += change.quantity
      } else if (change.changeType === InventoryChangeType.RETURN) {
        totalReturned += change.quantity
      } else if (change.changeType === InventoryChangeType.RESTOCK) {
        totalRestock += change.quantity
      }
    }

    const netChange = totalOutbound - totalReturned - totalRestock
    const expectedStock = batch.initialStock - netChange
    const actualStock = batch.quantity
    const isConsistent = expectedStock === actualStock
    const difference = actualStock - expectedStock

    if (!isConsistent) {
      isAllConsistent = false
    }

    const reasons: string[] = []
    if (!isConsistent) {
      if (difference > 0) {
        reasons.push(`库存多出 ${difference}，可能存在未记录的补货或退回`)
      } else {
        reasons.push(`库存少 ${Math.abs(difference)}，可能存在未记录的出库或损耗`)
      }
      const recordedChanges = batch.inventoryChanges.length
      if (recordedChanges === 0) {
        reasons.push('无库存变更记录')
      }
    }

    results.push({
      supplyId: batch.supply.id,
      supplyName: batch.supply.name,
      supplyCode: batch.supply.code,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      initialStock: batch.initialStock,
      currentStock: batch.quantity,
      expectedStock,
      totalOutbound,
      totalReturned,
      totalRestock,
      netChange,
      difference,
      isExpired: batch.expiredAt < new Date(),
      expiredAt: batch.expiredAt,
      isConsistent,
      inconsistencyReasons: reasons,
      changeCount: batch.inventoryChanges.length
    })
  }

  return {
    isAllConsistent,
    details: results,
    summary: {
      totalBatches: results.length,
      consistentBatches: results.filter(r => r.isConsistent).length,
      inconsistentBatches: results.filter(r => !r.isConsistent).length,
      totalInitialStock: results.reduce((sum, r) => sum + r.initialStock, 0),
      totalCurrentStock: results.reduce((sum, r) => sum + r.currentStock, 0),
      totalExpectedStock: results.reduce((sum, r) => sum + r.expectedStock, 0),
      totalOutbound: results.reduce((sum, r) => sum + r.totalOutbound, 0),
      totalReturned: results.reduce((sum, r) => sum + r.totalReturned, 0),
      totalRestock: results.reduce((sum, r) => sum + r.totalRestock, 0),
      totalDifference: results.reduce((sum, r) => sum + r.difference, 0)
    }
  }
})
