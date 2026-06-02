import { query } from '../../utils/database'

export default defineEventHandler(() => {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const dueSoon = query(`
    SELECT 
      id,
      code,
      name,
      next_calibration_date as nextCalibrationDate,
      department,
      status
    FROM tools
    WHERE status != 'scrapped' 
      AND next_calibration_date IS NOT NULL 
      AND next_calibration_date <= ?
      AND next_calibration_date >= ?
    ORDER BY next_calibration_date ASC
    LIMIT 20
  `, [thirtyDaysLater, today])

  const overdue = query(`
    SELECT 
      id,
      code,
      name,
      next_calibration_date as nextCalibrationDate,
      department,
      status
    FROM tools
    WHERE status != 'scrapped' 
      AND next_calibration_date IS NOT NULL 
      AND next_calibration_date < ?
    ORDER BY next_calibration_date ASC
    LIMIT 20
  `, [today])

  return { dueSoon, overdue }
})
