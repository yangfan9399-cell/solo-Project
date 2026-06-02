import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const record = queryOne('SELECT status, tool_id, tool_code FROM calibration_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '校准记录不存在'
    })
  }

  if ((record as any).status === 'in_progress') {
    throw createError({
      statusCode: 400,
      message: '该校准正在进行中，无需重复开始'
    })
  }

  if ((record as any).status === 'passed') {
    throw createError({
      statusCode: 400,
      message: '该校准已完成，无法重新开始'
    })
  }

  if ((record as any).status === 'failed') {
    throw createError({
      statusCode: 400,
      message: '该校准已标记为不合格，无法重新开始'
    })
  }

  if ((record as any).status !== 'scheduled') {
    throw createError({
      statusCode: 400,
      message: '只有计划中的校准可以开始'
    })
  }

  const tool = queryOne('SELECT status FROM tools WHERE id = ?', [(record as any).tool_id])
  if (tool) {
    if ((tool as any).status === 'borrowed') {
      throw createError({
        statusCode: 400,
        message: '该量具已被借出，请先收回再开始校准'
      })
    }

    const activeBorrow = queryOne(`
      SELECT id FROM borrow_records 
      WHERE tool_id = ? AND status IN ('pending', 'approved', 'borrowed', 'overdue')
    `, [(record as any).tool_id])

    if (activeBorrow) {
      throw createError({
        statusCode: 400,
        message: '该量具有待处理或进行中的借用记录，请先处理后再开始校准'
      })
    }
  }

  transaction(() => {
    execute(`
      UPDATE calibration_records SET
        status = 'in_progress',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])

    execute(`
      UPDATE tools SET
        status = 'calibrating',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status NOT IN ('borrowed', 'scrapped')
    `, [(record as any).tool_id])
  })

  return { success: true }
})
