import { getDb, queryOne, queryAll } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()

  const totalFormulas = queryOne<{ c: number }>(db, 'SELECT COUNT(*) as c FROM formulas')?.c ?? 0
  const activeFormulas = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM formulas WHERE status IN ('draft','testing','approved')")?.c ?? 0
  const totalBatches = queryOne<{ c: number }>(db, 'SELECT COUNT(*) as c FROM batches')?.c ?? 0
  const testingBatches = queryOne<{ c: number }>(db, "SELECT COUNT(*) as c FROM batches WHERE status = 'testing'")?.c ?? 0

  const lowStockItems = queryAll<{ id: number; material_name: string; current_stock: number; min_threshold: number; unit: string }>(db,
    'SELECT * FROM inventory WHERE current_stock <= min_threshold'
  )

  const anomalies = queryAll(db, `
    SELECT e.*, f.name as formula_name, b.batch_code
    FROM evaluations e
    JOIN formulas f ON e.formula_id = f.id
    JOIN batches b ON e.batch_id = b.id
    WHERE e.overall_score < 7.0
       OR e.burning_time_actual < f.burning_time_min
       OR e.longevity_actual_hours < f.longevity_hours * 0.6
    ORDER BY e.evaluated_at DESC
  `)

  const avgScores = queryAll(db, `
    SELECT f.id, f.name, AVG(e.overall_score) as avg_score
    FROM formulas f
    JOIN evaluations e ON f.id = e.formula_id
    GROUP BY f.id
    ORDER BY avg_score DESC
  `)

  const failedBatches = queryAll(db, `
    SELECT b.*, f.name as formula_name
    FROM batches b
    JOIN formulas f ON b.formula_id = f.id
    WHERE b.status = 'failed'
    ORDER BY b.created_at DESC
  `)

  return {
    summary: { totalFormulas, activeFormulas, totalBatches, testingBatches },
    lowStock: lowStockItems,
    anomalies,
    avgScores,
    failedBatches
  }
})
