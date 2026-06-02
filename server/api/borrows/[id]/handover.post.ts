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

  if ((record as any).status !== 'approved') {
    throw createError({
      statusCode: 400,
      message: '只有已审批的记录可以交接'
    })
  }

  transaction(() => {
    execute(`
      UPDATE borrow_records SET
        status = 'borrowed',
        handover_person_id = ?,
        handover_person_name = ?,
        handed_over_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [body.handoverPersonId, body.handoverPersonName, id])

    execute(`
      UPDATE tools SET
        status = 'borrowed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [(record as any).tool_id])
  })

  return { success: true }
})
