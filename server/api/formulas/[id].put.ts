import { getDb, queryOne, runStatement, saveDb, type Formula } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const existing = queryOne<Formula>(db, 'SELECT * FROM formulas WHERE id = ?', [id])
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Formula not found' })
  }

  const {
    name, description, top_note, middle_note, base_note,
    burning_time_min, burning_time_max, longevity_hours,
    status, materials, change_note
  } = body

  db.run(`
    UPDATE formulas SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      top_note = COALESCE(?, top_note),
      middle_note = COALESCE(?, middle_note),
      base_note = COALESCE(?, base_note),
      burning_time_min = COALESCE(?, burning_time_min),
      burning_time_max = COALESCE(?, burning_time_max),
      longevity_hours = COALESCE(?, longevity_hours),
      status = COALESCE(?, status),
      version = version + 1,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `, [name ?? null, description ?? null, top_note ?? null, middle_note ?? null, base_note ?? null, burning_time_min ?? null, burning_time_max ?? null, longevity_hours ?? null, status ?? null, id])

  const updatedFormula = queryOne<Formula>(db, 'SELECT * FROM formulas WHERE id = ?', [id])

  if (materials && Array.isArray(materials)) {
    db.run('DELETE FROM formula_materials WHERE formula_id = ?', [id])
    for (const m of materials) {
      db.run(
        `INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)`,
        [id, m.material_name, m.ratio, m.unit || 'g', m.note_type || 'middle']
      )
    }
  }

  const snapshotData = {
    name: updatedFormula!.name,
    materials: materials || [],
    top_note: updatedFormula!.top_note,
    middle_note: updatedFormula!.middle_note,
    base_note: updatedFormula!.base_note
  }
  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [id, updatedFormula!.version, JSON.stringify(snapshotData), change_note || `版本${updatedFormula!.version}更新`]
  )

  saveDb()

  return updatedFormula
})
