import { getDb, queryOne, queryAll, type Formula, type FormulaMaterial, type Evaluation, type Batch } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)
  const format = (query.format as string) || 'json'
  const formulaId = query.formula_id ? Number(query.formula_id) : undefined

  let formulas: Formula[]

  if (formulaId) {
    const f = queryOne<Formula>(db, 'SELECT * FROM formulas WHERE id = ?', [formulaId])
    if (!f) throw createError({ statusCode: 404, statusMessage: 'Formula not found' })
    formulas = [f]
  } else {
    formulas = queryAll<Formula>(db, 'SELECT * FROM formulas ORDER BY updated_at DESC')
  }

  const result = formulas.map(f => {
    const materials = queryAll<FormulaMaterial>(db, 'SELECT * FROM formula_materials WHERE formula_id = ?', [f.id])
    const batches = queryAll<Batch>(db, 'SELECT * FROM batches WHERE formula_id = ?', [f.id])
    const evaluations = queryAll<Evaluation & { batch_code: string }>(db, `
      SELECT e.*, b.batch_code FROM evaluations e
      JOIN batches b ON e.batch_id = b.id
      WHERE e.formula_id = ? ORDER BY e.evaluated_at DESC
    `, [f.id])

    const totalRatio = materials.reduce((sum, m) => sum + m.ratio, 0)
    const materialPercentages = materials.map(m => ({
      ...m,
      percentage: totalRatio > 0 ? Math.round((m.ratio / totalRatio) * 1000) / 10 : 0
    }))

    const avgScore = evaluations.length > 0
      ? Math.round((evaluations.reduce((s, e) => s + e.overall_score, 0) / evaluations.length) * 10) / 10
      : null

    const avgBurningTime = evaluations.length > 0
      ? Math.round((evaluations.reduce((s, e) => s + e.burning_time_actual, 0) / evaluations.length) * 10) / 10
      : null

    const avgLongevity = evaluations.length > 0
      ? Math.round((evaluations.reduce((s, e) => s + e.longevity_actual_hours, 0) / evaluations.length) * 10) / 10
      : null

    return {
      id: f.id,
      name: f.name,
      version: f.version,
      status: f.status,
      description: f.description,
      notes: { top: f.top_note, middle: f.middle_note, base: f.base_note },
      burning_time_design: { min: f.burning_time_min, max: f.burning_time_max },
      longevity_design: f.longevity_hours,
      materials: materialPercentages,
      total_ratio: totalRatio,
      batches: batches.map(b => ({
        batch_code: b.batch_code,
        version: b.formula_version,
        date: b.production_date,
        quantity: b.quantity,
        status: b.status,
        notes: b.notes
      })),
      evaluation_summary: {
        count: evaluations.length,
        avg_score: avgScore,
        avg_burning_time: avgBurningTime,
        avg_longevity: avgLongevity,
        score_deviation: avgScore !== null && f.longevity_hours > 0
          ? (avgScore < 7 ? 'below_threshold' : 'normal')
          : 'no_data'
      },
      created_at: f.created_at,
      updated_at: f.updated_at
    }
  })

  if (format === 'csv') {
    const lines: string[] = []
    lines.push('配方名,版本,状态,前调,中调,后调,设计燃烧时间(分钟),设计留香(小时),材料,平均评分,评价数,创建时间')
    for (const r of result) {
      const matStr = r.materials.map((m: any) => `${m.material_name}:${m.ratio}${m.unit}(${m.percentage}%)`).join('; ')
      lines.push([
        r.name, r.version, r.status,
        r.notes.top, r.notes.middle, r.notes.base,
        `${r.burning_time_design.min}-${r.burning_time_design.max}`,
        r.longevity_design,
        `"${matStr}"`,
        r.evaluation_summary.avg_score ?? '',
        r.evaluation_summary.count,
        r.created_at
      ].join(','))
    }
    return lines.join('\n')
  }

  return result
})
