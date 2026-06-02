import { query } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string
  const search = queryParams.search as string
  const department = queryParams.department as string

  let sql = `
    SELECT 
      t.id,
      t.code,
      t.name,
      t.specification,
      t.manufacturer,
      t.model,
      t.serial_number as serialNumber,
      t.measurement_range as measurementRange,
      t.accuracy,
      t.department,
      t.location,
      t.status,
      t.calibration_cycle_days as calibrationCycleDays,
      t.last_calibration_date as lastCalibrationDate,
      t.next_calibration_date as nextCalibrationDate,
      t.purchase_date as purchaseDate,
      t.price,
      t.remark,
      t.created_at as createdAt,
      t.updated_at as updatedAt,
      EXISTS (
        SELECT 1 FROM borrow_records b 
        WHERE b.tool_id = t.id AND b.status = 'pending'
      ) as hasPendingBorrow,
      EXISTS (
        SELECT 1 FROM borrow_records b 
        WHERE b.tool_id = t.id AND b.status IN ('approved', 'borrowed', 'overdue')
      ) as isBorrowedActive
    FROM tools t
    WHERE 1=1
  `
  const params: string[] = []

  if (status && status !== 'all') {
    sql += ' AND t.status = ?'
    params.push(status)
  }

  if (search) {
    sql += ' AND (t.code LIKE ? OR t.name LIKE ? OR t.serial_number LIKE ?)'
    const searchTerm = `%${search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (department && department !== 'all') {
    sql += ' AND t.department = ?'
    params.push(department)
  }

  sql += ' ORDER BY t.id DESC'

  const tools = query<(Tool & { hasPendingBorrow: number; isBorrowedActive: number })[]>(sql, params)
  return { tools: tools.map(t => ({ ...t, hasPendingBorrow: !!t.hasPendingBorrow, isBorrowedActive: !!t.isBorrowedActive })) }
})
