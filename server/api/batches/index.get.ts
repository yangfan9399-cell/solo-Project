import { getDb, queryAll, type Batch } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)
  const formulaId = query.formula_id ? Number(query.formula_id) : undefined

  if (formulaId) {
    return queryAll<Batch>(db, 'SELECT * FROM batches WHERE formula_id = ? ORDER BY created_at DESC', [formulaId])
  }

  return queryAll<Batch>(db, 'SELECT * FROM batches ORDER BY created_at DESC')
})
