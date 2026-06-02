import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const tool = queryOne('SELECT status FROM tools WHERE id = ?', [id])
  if (!tool) {
    throw createError({
      statusCode: 404,
      message: '量具不存在'
    })
  }

  if ((tool as any).status === 'borrowed') {
    throw createError({
      statusCode: 400,
      message: '量具正在借用中，无法报废'
    })
  }

  transaction(() => {
    execute(`
      UPDATE tools SET
        status = 'scrapped',
        remark = COALESCE(remark, '') || ? ,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [`\n报废原因: ${body.reason || '未说明'}\n报废时间: ${new Date().toISOString()}`, id])
  })

  return { success: true }
})
