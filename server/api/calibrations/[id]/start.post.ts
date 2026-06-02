import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const record = queryOne('SELECT status, tool_id FROM calibration_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '校准记录不存在'
    })
  }

  if ((record as any).status !== 'scheduled') {
    throw createError({
      statusCode: 400,
      message: '只有计划中的校准可以开始'
    })
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
      WHERE id = ? AND status = 'available'
    `, [(record as any).tool_id])
  })

  return { success: true }
})
