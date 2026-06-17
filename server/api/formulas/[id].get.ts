import { getDb, queryOne, queryAll, type Formula, type FormulaMaterial, type Batch, type Evaluation, type FormulaVersion } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = Number(getRouterParam(event, 'id'))

  const formula = queryOne<Formula>(db, 'SELECT * FROM formulas WHERE id = ?', [id])
  if (!formula) {
    throw createError({ statusCode: 404, statusMessage: 'Formula not found' })
  }

  const materials = queryAll<FormulaMaterial>(db, 'SELECT * FROM formula_materials WHERE formula_id = ?', [id])
  const batches = queryAll<Batch>(db, 'SELECT * FROM batches WHERE formula_id = ? ORDER BY created_at DESC', [id])
  const evaluations = queryAll<Evaluation & { batch_code: string }>(db, `
    SELECT e.*, b.batch_code FROM evaluations e
    JOIN batches b ON e.batch_id = b.id
    WHERE e.formula_id = ? ORDER BY e.evaluated_at DESC
  `, [id])
  const versions = queryAll<FormulaVersion>(db, 'SELECT * FROM formula_versions WHERE formula_id = ? ORDER BY version DESC', [id])

  const blindReviews = evaluations.length > 0
    ? queryAll(db, `
        SELECT br.*, e.evaluator as eval_evaluator FROM blind_reviews br
        JOIN evaluations e ON br.evaluation_id = e.id
        WHERE br.evaluation_id IN (${evaluations.map(() => '?').join(',')})
      `, evaluations.map(e => e.id))
    : []

  return { formula, materials, batches, evaluations, versions, blindReviews }
})
