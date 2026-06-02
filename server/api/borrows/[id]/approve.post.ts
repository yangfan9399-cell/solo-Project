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

  if ((record as any).status === 'approved') {
    throw createError({
      statusCode: 400,
      message: '该借用申请已通过，无法重复审批'
    })
  }

  if ((record as any).status === 'rejected') {
    throw createError({
      statusCode: 400,
      message: '该借用申请已被拒绝，无法重复审批'
    })
  }

  if ((record as any).status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: '只有待审批的记录可以审批'
    })
  }

  if (body.approved === undefined) {
    throw createError({
      statusCode: 400,
      message: '请指定审批结果'
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

    if (!body.approved) {
      execute(`
        UPDATE tools SET
          status = CASE 
            WHEN status IN ('available', 'borrowed', 'calibrating', 'maintenance') THEN status
            ELSE 'available'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [(record as any).tool_id])
    }
  })

  return { success: true }
})
