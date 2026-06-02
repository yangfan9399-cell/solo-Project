import { execute, queryOne } from '../../utils/database'
import type { CalibrationRecord } from '../../../types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const required = ['toolId', 'plannedDate']
  for (const field of required) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        message: `${field} 为必填项`
      })
    }
  }

  const tool = queryOne('SELECT code, name FROM tools WHERE id = ?', [body.toolId])
  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  const result = execute(`
    INSERT INTO calibration_records (
      tool_id, tool_code, tool_name, planned_date, status,
      calibration_agency, inspector_id, inspector_name, remark
    ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?, ?)
  `, [
    body.toolId,
    (tool as any).code,
    (tool as any).name,
    body.plannedDate,
    body.calibrationAgency || '',
    body.inspectorId || null,
    body.inspectorName || '',
    body.remark || ''
  ])

  const record = queryOne<CalibrationRecord>(`
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
    WHERE id = ?
  `, [result.lastInsertRowid])

  return { record }
})
