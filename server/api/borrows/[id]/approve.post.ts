import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status FROM borrow_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '借用记录不存在'
    })
  }

  if ((record as any).status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只有待审批的记录可以审批'
    })
  }

  transaction(() => {
    execute(`
      UPDATE borrow_records SET
        status = ?,
        approver_id = ?,
        approver_name = ?,
        approval_remark = ?,
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      body.approved ? 'approved' : 'rejected',
      body.approverId,
      body.approverName,
      body.remark || '',
      id
    ])
  })

  return { success: true }
})
