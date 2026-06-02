import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const tool = queryOne('SELECT status, code, name FROM tools WHERE id = ?', [id])
  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  if ((tool as any).status === 'scrapped') {
    throw createError({
      statusCode: 400,
      message: '该量具已报废，无需重复操作'
    })
  }

  if ((tool as any).status === 'borrowed') {
    throw createError({
      statusCode: 400,
      message: '量具正在借用中，请先收回再报废'
    })
  }

  if ((tool as any).status === 'calibrating') {
    throw createError({
      statusCode: 400,
      message: '量具正在校准中，请先完成校准再报废'
    })
  }

  if (!body.reason) {
    throw createError({
      statusCode: 400,
      message: '请填写报废原因'
    })
  }

  transaction(() => {
    execute(`
      UPDATE tools SET
        status = 'scrapped',
        remark = COALESCE(remark, '') || ? ,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [`\n报废原因: ${body.reason}\n报废时间: ${new Date().toISOString()}`, id])

    execute(`
      UPDATE borrow_records 
      SET status = 'returned', updated_at = CURRENT_TIMESTAMP
      WHERE tool_id = ? AND status IN ('pending', 'approved')
    `, [id])
  })

  return { success: true }
})
