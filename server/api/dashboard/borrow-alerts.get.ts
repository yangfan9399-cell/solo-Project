import { query } from '../../utils/database'

export default defineEventHandler(() => {
  const today = new Date().toISOString().split('T')[0]

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
    WHERE br.status IN ('borrowed', 'overdue') 
      AND br.expected_return_date < ?
    ORDER BY br.expected_return_date ASC
    LIMIT 20
  `, [today])

  return { overdue }
})
