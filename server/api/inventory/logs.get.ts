import { getDb, queryAll, type InventoryLog } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)
  const inventoryId = query.inventory_id ? Number(query.inventory_id) : undefined
  const batchId = query.batch_id ? Number(query.batch_id) : undefined

  let sql = `
    SELECT il.*, i.material_name, i.unit, b.batch_code
    FROM inventory_logs il
    JOIN inventory i ON il.inventory_id = i.id
    LEFT JOIN batches b ON il.related_batch_id = b.id
    WHERE 1=1
  `
  const params: any[] = []

  if (inventoryId) {
    sql += ' AND il.inventory_id = ?'
    params.push(inventoryId)
  }
  if (batchId) {
    sql += ' AND il.related_batch_id = ?'
    params.push(batchId)
  }

  sql += ' ORDER BY il.created_at DESC'

  return queryAll<InventoryLog & { material_name: string; unit: string; batch_code: string | null }>(db, sql, params)
})
