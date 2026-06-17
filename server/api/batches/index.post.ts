import { getDb, queryOne, getLastInsertRowId, saveDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  const { formula_id, formula_version, batch_code, production_date, quantity, notes } = body

  if (!formula_id || !batch_code || !production_date) {
    throw createError({ statusCode: 400, statusMessage: 'formula_id, batch_code, production_date are required' })
  }

  const existing = queryOne(db, 'SELECT id FROM batches WHERE batch_code = ?', [batch_code])
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Batch code already exists' })
  }

  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [formula_id, formula_version || 1, batch_code, production_date, quantity || 1, notes || '']
  )
  const id = getLastInsertRowId(db)
  saveDb()

  return { id }
})
