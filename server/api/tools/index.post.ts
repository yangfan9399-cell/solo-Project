import { execute, queryOne } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const required = ['code', 'name', 'calibrationCycleDays']
  for (const field of required) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        message: `${field} 为必填项`
      })
    }
  }

  const existing = queryOne('SELECT id FROM tools WHERE code = ?', [body.code])
  if (existing) {
    throw createError({
      statusCode: 400,
      message: '量具编号已存在'
    })
  }

  const result = execute(`
    INSERT INTO tools (
      code, name, specification, manufacturer, model, serial_number,
      measurement_range, accuracy, department, location, status,
      calibration_cycle_days, last_calibration_date, next_calibration_date,
      purchase_date, price, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    body.status || 'available',
    body.calibrationCycleDays,
    body.lastCalibrationDate || null,
    body.nextCalibrationDate || null,
    body.purchaseDate || null,
    body.price || 0,
    body.remark || ''
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
  `, [result.lastInsertRowid])

  return { tool }
})
