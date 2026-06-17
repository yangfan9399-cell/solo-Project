import { getDb, queryAll, type Inventory } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)
  const category = query.category as string | undefined
  const lowOnly = query.low_only === '1'

  let sql = 'SELECT * FROM inventory WHERE 1=1'
  const params: any[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  if (lowOnly) {
    sql += ' AND current_stock <= min_threshold'
  }

  sql += ' ORDER BY material_name'

  return queryAll<Inventory>(db, sql, params)
})
