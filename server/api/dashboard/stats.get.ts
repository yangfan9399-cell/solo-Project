import { queryOne } from '../../utils/database'
import type { DashboardStats } from '../../../types'

export default defineEventHandler(() => {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const totalTools = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tools WHERE status != ?', ['scrapped'])
  const availableTools = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tools WHERE status = ?', ['available'])
  const borrowedTools = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tools WHERE status = ?', ['borrowed'])
  const calibratingTools = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tools WHERE status = ?', ['calibrating'])
  
  const pendingBorrows = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM borrow_records WHERE status = ?', ['pending'])
  const overdueBorrows = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM borrow_records 
    WHERE status IN ('borrowed', 'overdue') AND expected_return_date < ?
  `, [today])
  
  const calibrationDueSoon = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM tools 
    WHERE status != 'scrapped' AND next_calibration_date IS NOT NULL 
    AND next_calibration_date <= ? AND next_calibration_date >= ?
  `, [thirtyDaysLater, today])
  
  const calibrationOverdue = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM tools 
    WHERE status != 'scrapped' AND next_calibration_date IS NOT NULL 
    AND next_calibration_date < ?
  `, [today])
  
  const openFeedbacks = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM feedbacks WHERE status IN (?, ?)', ['open', 'processing'])

  const stats: DashboardStats = {
    totalTools: totalTools?.count || 0,
    availableTools: availableTools?.count || 0,
    borrowedTools: borrowedTools?.count || 0,
    calibratingTools: calibratingTools?.count || 0,
    pendingBorrows: pendingBorrows?.count || 0,
    overdueBorrows: overdueBorrows?.count || 0,
    calibrationDueSoon: calibrationDueSoon?.count || 0,
    calibrationOverdue: calibrationOverdue?.count || 0,
    openFeedbacks: openFeedbacks?.count || 0
  }

  return { stats }
})
