import { db } from '../db/config'
import { assets, departments, assetCategories, inventoryRecords, discrepancyTypes } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function getAssets() {
  return await db.select({
    id: assets.id,
    assetNo: assets.assetNo,
    name: assets.name,
    categoryId: assets.categoryId,
    departmentId: assets.departmentId,
    location: assets.location,
    userId: assets.userId,
    userName: assets.userName,
    purchaseDate: assets.purchaseDate,
    purchasePrice: assets.purchasePrice,
    bookValue: assets.bookValue,
    tagNumber: assets.tagNumber,
    status: assets.status,
    categoryName: assetCategories.name,
    departmentName: departments.name,
  })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .leftJoin(departments, eq(assets.departmentId, departments.id))
}

export async function getAssetById(id: number) {
  const result = await db.select({
    id: assets.id,
    assetNo: assets.assetNo,
    name: assets.name,
    categoryId: assets.categoryId,
    departmentId: assets.departmentId,
    location: assets.location,
    userId: assets.userId,
    userName: assets.userName,
    purchaseDate: assets.purchaseDate,
    purchasePrice: assets.purchasePrice,
    bookValue: assets.bookValue,
    tagNumber: assets.tagNumber,
    status: assets.status,
    categoryName: assetCategories.name,
    departmentName: departments.name,
  })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .leftJoin(departments, eq(assets.departmentId, departments.id))
    .where(eq(assets.id, id))

  return result[0]
}

export async function getInventoryRecords() {
  return await db.select({
    id: inventoryRecords.id,
    assetId: inventoryRecords.assetId,
    inventoryDate: inventoryRecords.inventoryDate,
    discrepancyTypeId: inventoryRecords.discrepancyTypeId,
    actualStatus: inventoryRecords.actualStatus,
    actualLocation: inventoryRecords.actualLocation,
    actualUser: inventoryRecords.actualUser,
    photoUrl: inventoryRecords.photoUrl,
    remarks: inventoryRecords.remarks,
    recorderId: inventoryRecords.recorderId,
    recorderName: inventoryRecords.recorderName,
    createdAt: inventoryRecords.createdAt,
    assetNo: assets.assetNo,
    assetName: assets.name,
    discrepancyTypeName: discrepancyTypes.name,
    discrepancyTypeCode: discrepancyTypes.code,
  })
    .from(inventoryRecords)
    .leftJoin(assets, eq(inventoryRecords.assetId, assets.id))
    .leftJoin(discrepancyTypes, eq(inventoryRecords.discrepancyTypeId, discrepancyTypes.id))
    .orderBy(desc(inventoryRecords.createdAt))
}

export async function getInventoryRecordById(id: number) {
  const result = await db.select({
    id: inventoryRecords.id,
    assetId: inventoryRecords.assetId,
    inventoryDate: inventoryRecords.inventoryDate,
    discrepancyTypeId: inventoryRecords.discrepancyTypeId,
    actualStatus: inventoryRecords.actualStatus,
    actualLocation: inventoryRecords.actualLocation,
    actualUser: inventoryRecords.actualUser,
    photoUrl: inventoryRecords.photoUrl,
    remarks: inventoryRecords.remarks,
    recorderId: inventoryRecords.recorderId,
    recorderName: inventoryRecords.recorderName,
    createdAt: inventoryRecords.createdAt,
    assetNo: assets.assetNo,
    assetName: assets.name,
    assetLocation: assets.location,
    assetUser: assets.userName,
    assetBookValue: assets.bookValue,
    discrepancyTypeName: discrepancyTypes.name,
    discrepancyTypeCode: discrepancyTypes.code,
  })
    .from(inventoryRecords)
    .leftJoin(assets, eq(inventoryRecords.assetId, assets.id))
    .leftJoin(discrepancyTypes, eq(inventoryRecords.discrepancyTypeId, discrepancyTypes.id))
    .where(eq(inventoryRecords.id, id))

  return result[0]
}

export async function getDepartments() {
  return await db.select().from(departments)
}

export async function getAssetCategories() {
  return await db.select().from(assetCategories)
}

export async function getDiscrepancyTypes() {
  return await db.select().from(discrepancyTypes)
}

export async function createInventoryRecord(data: {
  assetId: number
  inventoryDate: string
  discrepancyTypeId: number | null
  actualStatus: string | null
  actualLocation: string | null
  actualUser: string | null
  remarks: string | null
  recorderId: string
  recorderName: string
}) {
  const result = await db.insert(inventoryRecords).values(data).returning()
  return result[0]
}

export async function getInventoryRecordsByFilters(filters: {
  departmentId?: number
  categoryId?: number
  discrepancyTypeId?: number
}) {
  const conditions = []
  if (filters.departmentId) {
    conditions.push(eq(assets.departmentId, filters.departmentId))
  }
  if (filters.categoryId) {
    conditions.push(eq(assets.categoryId, filters.categoryId))
  }
  if (filters.discrepancyTypeId) {
    conditions.push(eq(inventoryRecords.discrepancyTypeId, filters.discrepancyTypeId))
  }

  return await db.select({
    id: inventoryRecords.id,
    assetId: inventoryRecords.assetId,
    inventoryDate: inventoryRecords.inventoryDate,
    discrepancyTypeId: inventoryRecords.discrepancyTypeId,
    actualStatus: inventoryRecords.actualStatus,
    remarks: inventoryRecords.remarks,
    assetNo: assets.assetNo,
    assetName: assets.name,
    departmentName: departments.name,
    categoryName: assetCategories.name,
    discrepancyTypeName: discrepancyTypes.name,
  })
    .from(inventoryRecords)
    .leftJoin(assets, eq(inventoryRecords.assetId, assets.id))
    .leftJoin(departments, eq(assets.departmentId, departments.id))
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .leftJoin(discrepancyTypes, eq(inventoryRecords.discrepancyTypeId, discrepancyTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
}