import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status, tool_id FROM borrow_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '借用记录不存在'
    })
  }

  if ((record as any).status !== 'borrowed' && (record as any).status !== 'overdue') {
    throw createError({
      statusCode: 400,
      message: '只有借用中或逾期的记录可以归还'
    })
  }

  transaction(() => {
    execute(`
      UPDATE borrow_records SET
        status = 'returned',
        return_inspector_id = ?,
        return_inspector_name = ?,
        return_condition = ?,
        returned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      body.inspectorId,
      body.inspectorName,
      body.condition || '',
      id
    ])

    execute(`
      UPDATE tools SET
        status = 'available',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [(record as any).tool_id])
  })

  return { success: true }
})
