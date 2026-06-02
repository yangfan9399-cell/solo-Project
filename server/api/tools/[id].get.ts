import { queryOne } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  
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
  `, [id!])

  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  return { tool }
})
