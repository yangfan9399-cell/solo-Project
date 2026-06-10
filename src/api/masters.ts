import { db } from '@/db'
import { suppliers, parts, defectTypes, batches, partCategories } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getSuppliers() {
  return db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers)
}

export async function getParts() {
  return db.select({ id: parts.id, partNumber: parts.partNumber, name: parts.name }).from(parts)
}

export async function getDefectTypes() {
  return db.select({ id: defectTypes.id, name: defectTypes.name }).from(defectTypes)
}

export async function getBatches() {
  return db
    .select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      partId: batches.partId,
      supplierId: batches.supplierId,
      traceable: batches.traceable
    })
    .from(batches)
}

export async function getBatchDetails(id: number) {
  const result = await db
    .select({
      id: batches.id,
      batchNumber: batches.batchNumber,
      partNumber: parts.partNumber,
      partName: parts.name,
      supplierName: suppliers.name,
      productionDate: batches.productionDate,
      quantity: batches.quantity,
      receivedDate: batches.receivedDate,
      traceable: batches.traceable
    })
    .from(batches)
    .leftJoin(parts, eq(batches.partId, parts.id))
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .where(eq(batches.id, id))
    .limit(1)

  return result[0]
}

export async function getPartCategories() {
  return db.select({ id: partCategories.id, name: partCategories.name }).from(partCategories)
}
