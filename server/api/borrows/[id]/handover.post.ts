import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status, tool_id, tool_code FROM borrow_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '借用记录不存在'
    })
  }

  if ((record as any).status === 'pending') {
    throw createError({
      statusCode: 400,
      message: '该借用申请待审批中，请先完成审批'
    })
  }

  if ((record as any).status === 'rejected') {
    throw createError({
      statusCode: 400,
      message: '该借用申请已被拒绝，无法执行交接'
    })
  }

  if ((record as any).status === 'borrowed' || (record as any).status === 'overdue') {
    throw createError({
      statusCode: 400,
      message: '该借用已完成交接，无需重复操作'
    })
  }

  if ((record as any).status === 'returned') {
    throw createError({
      statusCode: 400,
      message: '该借用已完成归还，无法执行交接'
    })
  }

  if ((record as any).status !== 'approved') {
    throw createError({
      statusCode: 400,
      message: '只有已审批的记录可以交接'
    })
  }

  if (!body.handoverPersonId || !body.handoverPersonName) {
    throw createError({
      statusCode: 400,
      message: '请填写交接人员信息'
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
