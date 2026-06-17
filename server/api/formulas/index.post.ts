import { getDb, queryOne, queryAll, getLastInsertRowId, saveDb, type Formula } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  const { name, description, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, materials } = body

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Formula name is required' })
  }

  db.run(
    `INSERT INTO formulas (name, description, version, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, status) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, 'draft')`,
    [name, description || '', top_note || '', middle_note || '', base_note || '', burning_time_min || 0, burning_time_max || 0, longevity_hours || 0]
  )
  const formulaId = getLastInsertRowId(db)

  if (materials && Array.isArray(materials)) {
    for (const m of materials) {
      db.run(
        `INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)`,
        [formulaId, m.material_name, m.ratio, m.unit || 'g', m.note_type || 'middle']
      )
    }
  }

  const snapshot = JSON.stringify({ name, materials: materials || [] })
  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [formulaId, 1, snapshot, '初版创建']
  )

  saveDb()

  return queryOne<Formula>(db, 'SELECT * FROM formulas WHERE id = ?', [formulaId])
})
