import { getDb, queryOne, runStatement } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = Number(getRouterParam(event, 'id'))

  const existing = queryOne(db, 'SELECT * FROM formulas WHERE id = ?', [id])
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Formula not found' })
  }

  runStatement(db, 'DELETE FROM formulas WHERE id = ?', [id])
  return { success: true, id }
})
