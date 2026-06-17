import { getDb, getLastInsertRowId, saveDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  const {
    formula_id, batch_id, evaluator,
    scent_score, longevity_score, stability_score, overall_score,
    top_note_rating, middle_note_rating, base_note_rating,
    burning_time_actual, longevity_actual_hours,
    comments, is_blind,
    blind_reviews
  } = body

  if (!formula_id || !batch_id || !evaluator) {
    throw createError({ statusCode: 400, statusMessage: 'formula_id, batch_id, evaluator are required' })
  }

  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score,
      top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [formula_id, batch_id, evaluator, scent_score || 0, longevity_score || 0, stability_score || 0, overall_score || 0,
      top_note_rating || 0, middle_note_rating || 0, base_note_rating || 0,
      burning_time_actual || 0, longevity_actual_hours || 0, comments || '', is_blind ? 1 : 0]
  )
  const evalId = getLastInsertRowId(db)

  if (is_blind && blind_reviews && Array.isArray(blind_reviews)) {
    for (const br of blind_reviews) {
      db.run(
        `INSERT INTO blind_reviews (evaluation_id, reviewer_name, guess_formula, guess_accuracy, preference_score, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        [evalId, br.reviewer_name, br.guess_formula || '', br.guess_accuracy || 'wrong', br.preference_score || 0, br.notes || '']
      )
    }
  }

  saveDb()

  return { id: evalId }
})
