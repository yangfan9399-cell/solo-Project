import { db } from '../db/config'
import { disposalProcess, accountabilityRecords, transferRecords, inventoryRecords, assets } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getDisposalProcesses() {
  return await db.select({
    id: disposalProcess.id,
    inventoryRecordId: disposalProcess.inventoryRecordId,
    processType: disposalProcess.processType,
    departmentRemark: disposalProcess.departmentRemark,
    departmentApprovedAt: disposalProcess.departmentApprovedAt,
    departmentApproverName: disposalProcess.departmentApproverName,
    financeRemark: disposalProcess.financeRemark,
    financeApprovedAt: disposalProcess.financeApprovedAt,
    financeApproverName: disposalProcess.financeApproverName,
    supervisorRemark: disposalProcess.supervisorRemark,
    supervisorApprovedAt: disposalProcess.supervisorApprovedAt,
    supervisorApproverName: disposalProcess.supervisorApproverName,
    status: disposalProcess.status,
    createdAt: disposalProcess.createdAt,
  })
    .from(disposalProcess)
    .orderBy(desc(disposalProcess.createdAt))
}

export async function getDisposalProcessById(id: number) {
  const result = await db.select({
    id: disposalProcess.id,
    inventoryRecordId: disposalProcess.inventoryRecordId,
    processType: disposalProcess.processType,
    departmentRemark: disposalProcess.departmentRemark,
    departmentApprovedAt: disposalProcess.departmentApprovedAt,
    departmentApproverId: disposalProcess.departmentApproverId,
    departmentApproverName: disposalProcess.departmentApproverName,
    financeRemark: disposalProcess.financeRemark,
    financeApprovedAt: disposalProcess.financeApprovedAt,
    financeApproverId: disposalProcess.financeApproverId,
    financeApproverName: disposalProcess.financeApproverName,
    supervisorRemark: disposalProcess.supervisorRemark,
    supervisorApprovedAt: disposalProcess.supervisorApprovedAt,
    supervisorApproverId: disposalProcess.supervisorApproverId,
    supervisorApproverName: disposalProcess.supervisorApproverName,
    status: disposalProcess.status,
    createdAt: disposalProcess.createdAt,
  })
    .from(disposalProcess)
    .where(eq(disposalProcess.id, id))

  return result[0]
}

export async function createDisposalProcess(data: {
  inventoryRecordId: number
  processType: string
}) {
  const result = await db.insert(disposalProcess).values(data).returning()
  return result[0]
}

export async function updateDisposalProcess(id: number, data: Partial<{
  departmentRemark: string
  departmentApprovedAt: Date
  departmentApproverId: string
  departmentApproverName: string
  financeRemark: string
  financeApprovedAt: Date
  financeApproverId: string
  financeApproverName: string
  supervisorRemark: string
  supervisorApprovedAt: Date
  supervisorApproverId: string
  supervisorApproverName: string
  status: string
}>) {
  const result = await db.update(disposalProcess)
    .set(data)
    .where(eq(disposalProcess.id, id))
    .returning()

  return result[0]
}

export async function getAccountabilityRecords() {
  return await db.select({
    id: accountabilityRecords.id,
    inventoryRecordId: accountabilityRecords.inventoryRecordId,
    responsibleUserId: accountabilityRecords.responsibleUserId,
    responsibleUserName: accountabilityRecords.responsibleUserName,
    investigationResult: accountabilityRecords.investigationResult,
    compensationAmount: accountabilityRecords.compensationAmount,
    status: accountabilityRecords.status,
    createdAt: accountabilityRecords.createdAt,
    assetName: assets.name,
    assetNo: assets.assetNo,
    assetBookValue: assets.bookValue,
  })
    .from(accountabilityRecords)
    .leftJoin(inventoryRecords, eq(accountabilityRecords.inventoryRecordId, inventoryRecords.id))
    .leftJoin(assets, eq(inventoryRecords.assetId, assets.id))
    .orderBy(desc(accountabilityRecords.createdAt))
}

export async function createAccountabilityRecord(data: {
  inventoryRecordId: number
  responsibleUserId: string
  responsibleUserName: string
  investigationResult?: string | null
  compensationAmount?: string | null
}) {
  const result = await db.insert(accountabilityRecords).values(data).returning()
  return result[0]
}

export async function getTransferRecords() {
  return await db.select({
    id: transferRecords.id,
    disposalProcessId: transferRecords.disposalProcessId,
    fromDepartmentId: transferRecords.fromDepartmentId,
    toDepartmentId: transferRecords.toDepartmentId,
    transferDate: transferRecords.transferDate,
    remarks: transferRecords.remarks,
    createdAt: transferRecords.createdAt,
  })
    .from(transferRecords)
    .orderBy(desc(transferRecords.createdAt))
}