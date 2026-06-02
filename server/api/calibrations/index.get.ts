import { query } from '../../utils/database'
import type { CalibrationRecord } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string
  const toolId = queryParams.toolId as string

  let sql = `
    SELECT 
      id,
      tool_id as toolId,
      tool_code as toolCode,
      tool_name as toolName,
      planned_date as plannedDate,
      actual_date as actualDate,
      status,
      calibration_agency as calibrationAgency,
      certificate_number as certificateNumber,
      calibration_result as calibrationResult,
      next_calibration_date as nextCalibrationDate,
      cost,
      inspector_id as inspectorId,
      inspector_name as inspectorName,
      remark,
      created_at as createdAt,
      updated_at as updatedAt
    FROM calibration_records
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

  sql += ' ORDER BY id DESC'

  const records = query<CalibrationRecord>(sql, params)
  return { records }
})
