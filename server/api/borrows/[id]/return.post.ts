import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status, tool_id, tool_code, expected_return_date FROM borrow_records WHERE id = ?', [id])
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

  if ((record as any).status === 'approved') {
    throw createError({
      statusCode: 400,
      message: '该借用申请已通过，请先完成出库交接'
    })
  }

  if ((record as any).status === 'rejected') {
    throw createError({
      statusCode: 400,
      message: '该借用申请已被拒绝，无法执行归还操作'
    })
  }

  if ((record as any).status === 'returned') {
    throw createError({
      statusCode: 400,
      message: '该借用已完成归还，无法重复操作'
    })
  }

  if ((record as any).status !== 'borrowed' && (record as any).status !== 'overdue') {
    throw createError({
      statusCode: 400,
      message: '只有借用中或逾期的记录可以归还'
    })
  }

  if (!body.inspectorId || !body.inspectorName) {
    throw createError({
      statusCode: 400,
      message: '请填写验收人员信息'
    })
  }

  if (!body.condition) {
    throw createError({
      statusCode: 400,
      message: '请填写归还验收情况'
    })
  }

  transaction(() => {
    const isOverdue = (record as any).status === 'overdue'
    
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
      isOverdue ? `${body.condition}（注：原状态为逾期）` : body.condition,
      id
    ])

    execute(`
      UPDATE tools SET
        status = 'available',
        remark = COALESCE(remark, '') || ? ,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [isOverdue ? `\n归还状态：逾期归还\n归还时间：${new Date().toISOString()}` : '', (record as any).tool_id])
  })

  return { success: true }
})
