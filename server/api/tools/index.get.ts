import { query } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string
  const search = queryParams.search as string
  const department = queryParams.department as string

  let sql = `
    SELECT 
      id,
      code,
      name,
      specification,
      manufacturer,
      model,
      serial_number as serialNumber,
      measurement_range as measurementRange,
      accuracy,
      department,
      location,
      status,
      calibration_cycle_days as calibrationCycleDays,
      last_calibration_date as lastCalibrationDate,
      next_calibration_date as nextCalibrationDate,
      purchase_date as purchaseDate,
      price,
      remark,
      created_at as createdAt,
      updated_at as updatedAt
    FROM tools
    WHERE 1=1
  `
  const params: string[] = []

  if (status && status !== 'all') {
    sql += ' AND status = ?'
    params.push(status)
  }

  if (search) {
    sql += ' AND (code LIKE ? OR name LIKE ? OR serial_number LIKE ?)'
    const searchTerm = `%${search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (department && department !== 'all') {
    sql += ' AND department = ?'
    params.push(department)
  }

  sql += ' ORDER BY id DESC'

  const tools = query<Tool>(sql, params)
  return { tools }
})
