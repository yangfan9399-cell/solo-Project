import { execute, query } from '../../utils/database'

export default defineEventHandler(() => {
  const today = new Date().toISOString().split('T')[0]

  execute(`
    UPDATE borrow_records 
    SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'borrowed' 
    AND expected_return_date < ?
  `, [today])

  const overdue = query(`
    SELECT 
      br.id,
      br.tool_code as toolCode,
      br.tool_name as toolName,
      br.applicant_name as applicantName,
      br.applicant_department as applicantDepartment,
      br.expected_return_date as expectedReturnDate,
      br.status
    FROM borrow_records br
    WHERE br.status = 'overdue'
    ORDER BY br.expected_return_date ASC
    LIMIT 20
  `)

  return { overdue }
})
