import { queryOne } from '../../utils/database'
import type { Tool } from '../../../types'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  
  const tool = queryOne<Tool & { hasPendingBorrow: number; isBorrowedActive: number }>(`
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
    WHERE t.id = ?
  `, [id!])

  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  return {
    tool: {
      ...tool,
      hasPendingBorrow: !!tool.hasPendingBorrow,
      isBorrowedActive: !!tool.isBorrowedActive
    }
  }
})
