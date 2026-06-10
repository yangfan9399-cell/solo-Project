import { db } from '@/db'
import { claims, batches, parts, suppliers, defectTypes, claimEvidences, claimHistory, supplierResponses, partCategories, type ClaimStatus } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export interface ClaimDetail {
  id: number
  batchNumber: string | null
  partNumber: string | null
  partName: string | null
  categoryName: string | null
  supplierName: string | null
  defectType: string | null
  quantityDefective: number
  claimAmount: string
  description: string | null
  status: ClaimStatus | null
  batchTraceable: boolean | null
  repairDeadline: string | null
  repairCompleted: boolean | null
  engineerName: string | null
  createdAt: string | null
  updatedAt: string | null
  evidences: Array<{
    id: number
    type: string | null
    url: string | null
    description: string | null
    uploadedAt: string | null
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    operator: string | null
    createdAt: string | null
  }>
  supplierResponse: {
    responseType: string
    comment: string | null
    evidenceUrl: string | null
    createdAt: string | null
  } | null
}

export async function getClaims() {
  const result = await db
    .select({
      id: claims.id,
      batchId: claims.batchId,
      defectTypeId: claims.defectTypeId,
      quantityDefective: claims.quantityDefective,
      claimAmount: claims.claimAmount,
      description: claims.description,
      status: claims.status,
      batchTraceable: claims.batchTraceable,
      repairDeadline: claims.repairDeadline,
      repairCompleted: claims.repairCompleted,
      engineerName: claims.engineerName,
      createdAt: claims.createdAt,
      batchNumber: batches.batchNumber,
      partNumber: parts.partNumber,
      partName: parts.name,
      categoryName: partCategories.name,
      supplierName: suppliers.name,
      defectType: defectTypes.name
    })
    .from(claims)
    .leftJoin(batches, eq(claims.batchId, batches.id))
    .leftJoin(parts, eq(batches.partId, parts.id))
    .leftJoin(partCategories, eq(parts.categoryId, partCategories.id))
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .leftJoin(defectTypes, eq(claims.defectTypeId, defectTypes.id))
    .orderBy(desc(claims.createdAt))

  return result.map(item => ({
    ...item,
    repairDeadline: item.repairDeadline ? new Date(item.repairDeadline).toISOString() : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null
  }))
}

export async function getClaimById(id: number): Promise<ClaimDetail | null> {
  const claimResult = await db
    .select({
      id: claims.id,
      batchId: claims.batchId,
      defectTypeId: claims.defectTypeId,
      quantityDefective: claims.quantityDefective,
      claimAmount: claims.claimAmount,
      description: claims.description,
      status: claims.status,
      batchTraceable: claims.batchTraceable,
      repairDeadline: claims.repairDeadline,
      repairCompleted: claims.repairCompleted,
      engineerName: claims.engineerName,
      createdAt: claims.createdAt,
      updatedAt: claims.updatedAt,
      batchNumber: batches.batchNumber,
      partNumber: parts.partNumber,
      partName: parts.name,
      categoryName: partCategories.name,
      supplierName: suppliers.name,
      defectType: defectTypes.name
    })
    .from(claims)
    .leftJoin(batches, eq(claims.batchId, batches.id))
    .leftJoin(parts, eq(batches.partId, parts.id))
    .leftJoin(partCategories, eq(parts.categoryId, partCategories.id))
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .leftJoin(defectTypes, eq(claims.defectTypeId, defectTypes.id))
    .where(eq(claims.id, id))
    .limit(1)

  if (claimResult.length === 0) return null

  const claim = claimResult[0]

  const evidences = await db
    .select({
      id: claimEvidences.id,
      type: claimEvidences.type,
      url: claimEvidences.url,
      description: claimEvidences.description,
      uploadedAt: claimEvidences.uploadedAt
    })
    .from(claimEvidences)
    .where(eq(claimEvidences.claimId, id))

  const history = await db
    .select({
      id: claimHistory.id,
      status: claimHistory.status,
      comment: claimHistory.comment,
      operator: claimHistory.operator,
      createdAt: claimHistory.createdAt
    })
    .from(claimHistory)
    .where(eq(claimHistory.claimId, id))
    .orderBy(claimHistory.createdAt)

  const responseResult = await db
    .select({
      responseType: supplierResponses.responseType,
      comment: supplierResponses.comment,
      evidenceUrl: supplierResponses.evidenceUrl,
      createdAt: supplierResponses.createdAt
    })
    .from(supplierResponses)
    .where(eq(supplierResponses.claimId, id))
    .limit(1)

  return {
    ...claim,
    repairDeadline: claim.repairDeadline ? new Date(claim.repairDeadline).toISOString() : null,
    createdAt: claim.createdAt ? new Date(claim.createdAt).toISOString() : null,
    updatedAt: claim.updatedAt ? new Date(claim.updatedAt).toISOString() : null,
    evidences: evidences.map(e => ({
      ...e,
      uploadedAt: e.uploadedAt ? new Date(e.uploadedAt).toISOString() : null
    })),
    history: history.map(h => ({
      ...h,
      createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : null
    })),
    supplierResponse: responseResult.length > 0 ? {
      ...responseResult[0],
      createdAt: responseResult[0].createdAt ? new Date(responseResult[0].createdAt).toISOString() : null
    } : null
  }
}

export async function updateClaimStatus(id: number, status: string, comment: string, operator: string) {
  await db.transaction(async (tx) => {
    await tx.update(claims)
      .set({ status: status as ClaimStatus, updatedAt: new Date() })
      .where(eq(claims.id, id))

    await tx.insert(claimHistory).values({
      claimId: id,
      status,
      comment,
      operator,
      createdAt: new Date()
    })
  })
}

export async function addSupplierResponse(claimId: number, responseType: string, comment: string, evidenceUrl: string | null) {
  await db.transaction(async (tx) => {
    await tx.insert(supplierResponses).values({
      claimId,
      responseType,
      comment,
      evidenceUrl,
      createdAt: new Date()
    })

    await tx.update(claims)
      .set({ status: 'supplier_response', updatedAt: new Date() })
      .where(eq(claims.id, claimId))

    await tx.insert(claimHistory).values({
      claimId,
      status: 'supplier_response',
      comment: `供应商${responseType === 'accept' ? '同意' : '提出反驳'}`,
      operator: '系统',
      createdAt: new Date()
    })
  })
}

export async function addEvidence(claimId: number, type: string, url: string, description: string) {
  await db.insert(claimEvidences).values({
    claimId,
    type,
    url,
    description,
    uploadedAt: new Date()
  })
}

export async function createClaim(data: {
  batchId: number
  defectTypeId: number
  quantityDefective: number
  claimAmount: string
  description: string
  engineerName: string
}) {
  const result = await db.transaction(async (tx) => {
    const claimResult = await tx.insert(claims).values({
      ...data,
      status: 'pending',
      batchTraceable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    await tx.insert(claimHistory).values({
      claimId: claimResult[0].id,
      status: 'pending',
      comment: '质量工程师登记问题',
      operator: data.engineerName,
      createdAt: new Date()
    })

    return claimResult[0]
  })

  return result
}
