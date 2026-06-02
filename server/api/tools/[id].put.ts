import { execute, queryOne } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const existing = queryOne('SELECT id FROM tools WHERE id = ?', [id])
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  execute(`
    UPDATE tools SET
      code = ?,
      name = ?,
      specification = ?,
      manufacturer = ?,
      model = ?,
      serial_number = ?,
      measurement_range = ?,
      accuracy = ?,
      department = ?,
      location = ?,
      status = ?,
      calibration_cycle_days = ?,
      last_calibration_date = ?,
      next_calibration_date = ?,
      purchase_date = ?,
      price = ?,
      remark = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    body.code,
    body.name,
    body.specification || '',
    body.manufacturer || '',
    body.model || '',
    body.serialNumber || '',
    body.measurementRange || '',
    body.accuracy || '',
    body.department || '',
    body.location || '',
    body.status,
    body.calibrationCycleDays,
    body.lastCalibrationDate || null,
    body.nextCalibrationDate || null,
    body.purchaseDate || null,
    body.price || 0,
    body.remark || '',
    id
  ])

  const tool = queryOne<Tool>(`
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
    WHERE id = ?
  `, [id])

  return { tool }
})
