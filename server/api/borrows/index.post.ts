import { execute, queryOne, transaction } from '../../utils/database'
import type { BorrowRecord } from '../../../types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const required = ['toolId', 'applicantId', 'applicantName', 'applicantDepartment', 'purpose', 'expectedReturnDate']
  for (const field of required) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        message: `${field} 为必填项`
      })
    }
  }

  const tool = queryOne('SELECT code, name, status FROM tools WHERE id = ?', [body.toolId])
  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  if ((tool as any).status === 'scrapped') {
    throw createError({
      statusCode: 400,
      message: '该量具已报废，无法借用'
    })
  }

  if ((tool as any).status === 'calibrating') {
    throw createError({
      statusCode: 400,
      message: '该量具正在校准中，暂时无法借用'
    })
  }

  if ((tool as any).status === 'maintenance') {
    throw createError({
      statusCode: 400,
      message: '该量具正在维护中，暂时无法借用'
    })
  }

  if ((tool as any).status === 'borrowed') {
    throw createError({
      statusCode: 400,
      message: '该量具已被借用，请选择其他量具'
    })
  }

  const pendingBorrow = queryOne(`
    SELECT id FROM borrow_records 
    WHERE tool_id = ? AND status = 'pending'
  `, [body.toolId])
  
  if (pendingBorrow) {
    throw createError({
      statusCode: 400,
      message: '该量具已有待审批的借用申请，请等待审批结果'
    })
  }

  const activeBorrow = queryOne(`
    SELECT id FROM borrow_records 
    WHERE tool_id = ? AND status IN ('approved', 'borrowed', 'overdue')
  `, [body.toolId])
  
  if (activeBorrow) {
    throw createError({
      statusCode: 400,
      message: '该量具已被借出或正在交接中'
    })
  }

  const result = execute(`
    INSERT INTO borrow_records (
      tool_id, tool_code, tool_name, applicant_id, applicant_name,
      applicant_department, purpose, expected_return_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [
    body.toolId,
    (tool as any).code,
    (tool as any).name,
    body.applicantId,
    body.applicantName,
    body.applicantDepartment,
    body.purpose,
    body.expectedReturnDate
  ])

  const record = queryOne<BorrowRecord>(`
    SELECT 
      id,
      tool_id as toolId,
      tool_code as toolCode,
      tool_name as toolName,
      applicant_id as applicantId,
      applicant_name as applicantName,
      applicant_department as applicantDepartment,
      purpose,
      expected_return_date as expectedReturnDate,
      status,
      approver_id as approverId,
      approver_name as approverName,
      approval_remark as approvalRemark,
      approved_at as approvedAt,
      handover_person_id as handoverPersonId,
      handover_person_name as handoverPersonName,
      handed_over_at as handedOverAt,
      return_inspector_id as returnInspectorId,
      return_inspector_name as returnInspectorName,
      return_condition as returnCondition,
      returned_at as returnedAt,
      remark,
      created_at as createdAt,
      updated_at as updatedAt
    FROM borrow_records
    WHERE id = ?
  `, [result.lastInsertRowid])

  return { record }
})
