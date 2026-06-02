import { query, execute } from '../../utils/database'
import type { BorrowRecord } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string
  const toolId = queryParams.toolId as string
  const applicantId = queryParams.applicantId as string

  execute(`
    UPDATE borrow_records 
    SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'borrowed' 
    AND expected_return_date < DATE('now')
  `)

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
      CASE 
        WHEN status = 'borrowed' AND expected_return_date < DATE('now') THEN 'overdue'
        ELSE status
      END as status,
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
    if (status === 'overdue') {
      sql += ` AND (status = 'overdue' OR (status = 'borrowed' AND expected_return_date < DATE('now')))`
    } else {
      sql += ' AND status = ?'
      params.push(status)
    }
  }

  if (toolId) {
    sql += ' AND tool_id = ?'
    params.push(toolId)
  }

  if (applicantId) {
    sql += ' AND applicant_id = ?'
    params.push(applicantId)
  }

  sql += ' ORDER BY CASE status WHEN \'overdue\' THEN 1 WHEN \'pending\' THEN 2 ELSE 3 END, id DESC'

  const records = query<BorrowRecord>(sql, params)
  return { records }
})
