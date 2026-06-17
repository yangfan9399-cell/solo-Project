import { getDb, queryAll, queryOne, type Formula, type FormulaMaterial } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)

  const status = query.status as string | undefined
  const search = query.search as string | undefined
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 20

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (status && status !== 'all') {
    where += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    where += ' AND (name LIKE ? OR description LIKE ? OR top_note LIKE ? OR middle_note LIKE ? OR base_note LIKE ?)'
    const s = `%${search}%`
    params.push(s, s, s, s, s)
  }

  const total = queryOne<{ c: number }>(db, `SELECT COUNT(*) as c FROM formulas ${where}`, params)?.c ?? 0

  const offset = (page - 1) * pageSize
  const formulas = queryAll<Formula>(db, `SELECT * FROM formulas ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])

  const formulaIds = formulas.map(f => f.id)
  const materialsMap: Record<number, FormulaMaterial[]> = {}

  if (formulaIds.length > 0) {
    const placeholders = formulaIds.map(() => '?').join(',')
    const materials = queryAll<FormulaMaterial>(db, `SELECT * FROM formula_materials WHERE formula_id IN (${placeholders})`, formulaIds)

    for (const m of materials) {
      if (!materialsMap[m.formula_id]) materialsMap[m.formula_id] = []
      materialsMap[m.formula_id].push(m)
    }
  }

  const batchStats = queryAll<{ formula_id: number; batch_count: number; testing_count: number }>(db, `
    SELECT formula_id, COUNT(*) as batch_count,
      SUM(CASE WHEN status = 'testing' THEN 1 ELSE 0 END) as testing_count
    FROM batches GROUP BY formula_id
  `)

  const evalStats = queryAll<{ formula_id: number; avg_score: number; eval_count: number }>(db, `
    SELECT formula_id, AVG(overall_score) as avg_score, COUNT(*) as eval_count
    FROM evaluations GROUP BY formula_id
  `)

  const batchMap = Object.fromEntries(batchStats.map(b => [b.formula_id, b]))
  const evalMap = Object.fromEntries(evalStats.map(e => [e.formula_id, e]))

  const items = formulas.map(f => ({
    ...f,
    materials: materialsMap[f.id] || [],
    batch_count: batchMap[f.id]?.batch_count || 0,
    testing_count: batchMap[f.id]?.testing_count || 0,
    avg_score: evalMap[f.id]?.avg_score ? Math.round(evalMap[f.id].avg_score * 10) / 10 : null,
    eval_count: evalMap[f.id]?.eval_count || 0,
  }))

  return { items, total, page, pageSize }
})
