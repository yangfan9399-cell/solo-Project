import { db } from '@/db'
import { claims, batches, parts, suppliers, defectTypes, partCategories } from '@/db/schema'
import { eq, desc, count, sum, sql } from 'drizzle-orm'

export interface SupplierSummary {
  supplierId: number
  supplierName: string
  claimCount: number
  totalAmount: number
  avgAmount: number
}

export interface CategorySummary {
  categoryId: number
  categoryName: string
  claimCount: number
  totalAmount: number
}

export interface DefectTypeSummary {
  defectTypeId: number
  defectTypeName: string
  claimCount: number
  totalAmount: number
}

export interface PeriodSummary {
  period: string
  claimCount: number
  totalAmount: number
}

export async function getSupplierSummary(): Promise<SupplierSummary[]> {
  const result = await db
    .select({
      supplierId: suppliers.id,
      supplierName: suppliers.name,
      claimCount: count(claims.id).as('claimCount'),
      totalAmount: sum(claims.claimAmount).as('totalAmount')
    })
    .from(suppliers)
    .leftJoin(batches, eq(suppliers.id, batches.supplierId))
    .leftJoin(claims, eq(batches.id, claims.batchId))
    .groupBy(suppliers.id, suppliers.name)
    .orderBy(desc(count(claims.id)))

  return result.map(item => ({
    ...item,
    totalAmount: Number(item.totalAmount) || 0,
    avgAmount: item.claimCount > 0 ? Number(item.totalAmount) / item.claimCount : 0
  }))
}

export async function getCategorySummary(): Promise<CategorySummary[]> {
  const result = await db
    .select({
      categoryId: partCategories.id,
      categoryName: partCategories.name,
      claimCount: count(claims.id).as('claimCount'),
      totalAmount: sum(claims.claimAmount).as('totalAmount')
    })
    .from(partCategories)
    .leftJoin(parts, eq(partCategories.id, parts.categoryId))
    .leftJoin(batches, eq(parts.id, batches.partId))
    .leftJoin(claims, eq(batches.id, claims.batchId))
    .groupBy(partCategories.id, partCategories.name)
    .orderBy(desc(count(claims.id)))

  return result.map(item => ({
    ...item,
    totalAmount: Number(item.totalAmount) || 0
  }))
}

export async function getDefectTypeSummary(): Promise<DefectTypeSummary[]> {
  const result = await db
    .select({
      defectTypeId: defectTypes.id,
      defectTypeName: defectTypes.name,
      claimCount: count(claims.id).as('claimCount'),
      totalAmount: sum(claims.claimAmount).as('totalAmount')
    })
    .from(defectTypes)
    .leftJoin(claims, eq(defectTypes.id, claims.defectTypeId))
    .groupBy(defectTypes.id, defectTypes.name)
    .orderBy(desc(count(claims.id)))

  return result.map(item => ({
    ...item,
    totalAmount: Number(item.totalAmount) || 0
  }))
}

export async function getPeriodSummary(): Promise<PeriodSummary[]> {
  const result = await db
    .select({
      period: sql<string>`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`.as('period'),
      claimCount: count(claims.id).as('claimCount'),
      totalAmount: sum(claims.claimAmount).as('totalAmount')
    })
    .from(claims)
    .groupBy(sql`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${claims.createdAt}, 'YYYY-MM')`)

  return result.map(item => ({
    ...item,
    totalAmount: Number(item.totalAmount) || 0
  }))
}

export interface DashboardStats {
  totalClaims: number
  totalAmount: number
  pendingCount: number
  underReviewCount: number
  completedCount: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const totalResult = await db
    .select({
      totalClaims: count(claims.id).as('totalClaims'),
      totalAmount: sum(claims.claimAmount).as('totalAmount')
    })
    .from(claims)

  const pendingResult = await db
    .select({ count: count(claims.id).as('count') })
    .from(claims)
    .where(eq(claims.status, 'pending'))

  const reviewResult = await db
    .select({ count: count(claims.id).as('count') })
    .from(claims)
    .where(eq(claims.status, 'under_review'))

  const completedResult = await db
    .select({ count: count(claims.id).as('count') })
    .from(claims)
    .where(eq(claims.status, 'completed'))

  return {
    totalClaims: totalResult[0].totalClaims,
    totalAmount: Number(totalResult[0].totalAmount) || 0,
    pendingCount: pendingResult[0].count,
    underReviewCount: reviewResult[0].count,
    completedCount: completedResult[0].count
  }
}
