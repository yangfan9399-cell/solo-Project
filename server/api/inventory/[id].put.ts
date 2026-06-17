import { getDb, queryOne, saveDb, type Inventory } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const inv = queryOne<Inventory>(db, 'SELECT * FROM inventory WHERE id = ?', [id])
  if (!inv) {
    throw createError({ statusCode: 404, statusMessage: 'Inventory item not found' })
  }

  const { change_amount, change_type, notes } = body

  db.run('UPDATE inventory SET current_stock = current_stock + ?, last_restocked = datetime("now","localtime") WHERE id = ?', [change_amount, id])
  db.run('INSERT INTO inventory_logs (inventory_id, change_amount, change_type, related_batch_id, notes) VALUES (?, ?, ?, ?, ?)', [id, change_amount, change_type, body.related_batch_id || null, notes || ''])
  saveDb()

  return queryOne(db, 'SELECT * FROM inventory WHERE id = ?', [id])
})
