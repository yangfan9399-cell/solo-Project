import { execute, queryOne } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status FROM feedbacks WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '反馈记录不存在'
    })
  }

  execute(`
    UPDATE feedbacks SET
      status = ?,
      handler_id = ?,
      handler_name = ?,
      handle_result = ?,
      handled_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    body.status,
    body.handlerId,
    body.handlerName,
    body.result || '',
    id
  ])

  return { success: true }
})
