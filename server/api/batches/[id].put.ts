import { getDb, queryOne, runStatement, type Batch } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const existing = queryOne<Batch>(db, 'SELECT * FROM batches WHERE id = ?', [id])
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Batch not found' })
  }

  runStatement(db, 'UPDATE batches SET status = ?, notes = COALESCE(?, notes) WHERE id = ?', [
    body.status || existing.status,
    body.notes ?? null,
    id
  ])

  return queryOne(db, 'SELECT * FROM batches WHERE id = ?', [id])
})
