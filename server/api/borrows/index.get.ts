import { query } from '../../utils/database'
import type { BorrowRecord } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string
  const toolId = queryParams.toolId as string
  const applicantId = queryParams.applicantId as string

  let sql = `
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
    WHERE 1=1
  `
  const params: string[] = []

  if (status && status !== 'all') {
    sql += ' AND status = ?'
    params.push(status)
  }

  if (toolId) {
    sql += ' AND tool_id = ?'
    params.push(toolId)
  }

  if (applicantId) {
    sql += ' AND applicant_id = ?'
    params.push(applicantId)
  }

  sql += ' ORDER BY id DESC'

  const records = query<BorrowRecord>(sql, params)
  return { records }
})
