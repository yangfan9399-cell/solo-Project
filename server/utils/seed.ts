import { getDb, initDb, queryOne, getLastInsertRowId, saveDb } from './db'

export async function seedData(): Promise<void> {
  await initDb()
  const db = await getDb()

  const count = queryOne<{ c: number }>(db, 'SELECT COUNT(*) as c FROM formulas')?.c ?? 0
  if (count > 0) return

  db.run(
    `INSERT INTO formulas (name, description, version, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['檀静安神', '以檀香为主调的安神静心配方，适合晚间使用', 3, '佛手柑、甜橙', '檀香、乳香', '沉香、安息香', 45, 60, 6, 'approved']
  )
  const f1Id = getLastInsertRowId(db)

  const materials1 = [
    [f1Id, '檀香粉', 30, 'g', 'middle'],
    [f1Id, '沉香粉', 15, 'g', 'base'],
    [f1Id, '乳香粉', 12, 'g', 'middle'],
    [f1Id, '安息香', 8, 'g', 'base'],
    [f1Id, '佛手柑精油', 3, 'ml', 'top'],
    [f1Id, '甜橙精油', 2, 'ml', 'top'],
    [f1Id, '楠木粉(粘合)', 15, 'g', 'base'],
  ] as any[][]
  for (const m of materials1) {
    db.run('INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)', m)
  }

  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, 3, 'TJ-2025-001', '2025-03-15', 50, 'completed', '第三版调整了檀香比例']
  )
  const b1Id = getLastInsertRowId(db)
  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, 2, 'TJ-2025-002', '2025-02-10', 30, 'completed', '第二版试产']
  )
  const b2Id = getLastInsertRowId(db)
  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, 3, 'TJ-2025-003', '2025-05-01', 100, 'testing', '大货试产']
  )

  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score, top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, b1Id, '张师傅', 8.5, 7.8, 9.0, 8.4, 7.5, 9.0, 8.8, 52, 5.5, '檀香韵醇厚，前调柑橘稍弱，留香时间比预期短', 0]
  )
  const e1Id = getLastInsertRowId(db)
  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score, top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, b1Id, '李老师', 9.0, 8.2, 8.5, 8.6, 8.0, 9.2, 8.5, 55, 6.0, '整体协调，中调表现优秀', 0]
  )
  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score, top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, b2Id, '王评委', 7.0, 6.5, 7.0, 6.8, 6.0, 7.5, 7.0, 40, 4.0, '旧版前调过于突兀，中调不够圆润', 0]
  )
  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score, top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f1Id, b1Id, '盲评组', 8.2, 7.5, 8.0, 7.9, 7.8, 8.5, 8.0, 50, 5.0, '盲评环境，无先入为主', 1]
  )
  const eBlindId = getLastInsertRowId(db)

  db.run(
    `INSERT INTO blind_reviews (evaluation_id, reviewer_name, guess_formula, guess_accuracy, preference_score, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [eBlindId, '赵评委', '檀静安神', 'correct', 8.5, '凭檀香底蕴判断正确']
  )
  db.run(
    `INSERT INTO blind_reviews (evaluation_id, reviewer_name, guess_formula, guess_accuracy, preference_score, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [eBlindId, '钱评委', '檀香安神方', 'partial', 7.8, '猜到檀香主调但配方名不准']
  )
  db.run(
    `INSERT INTO blind_reviews (evaluation_id, reviewer_name, guess_formula, guess_accuracy, preference_score, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [eBlindId, '孙评委', '禅意静心', 'wrong', 8.0, '误判为其他配方，说明辨识度有提升空间']
  )

  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f1Id, 1, JSON.stringify({ name: '檀静安神', materials: [{ name: '檀香粉', ratio: 25 }, { name: '沉香粉', ratio: 10 }] }), '初版配方']
  )
  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f1Id, 2, JSON.stringify({ name: '檀静安神', materials: [{ name: '檀香粉', ratio: 28 }, { name: '沉香粉', ratio: 12 }, { name: '乳香粉', ratio: 10 }] }), '增加乳香提升中调层次']
  )
  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f1Id, 3, JSON.stringify({ name: '檀静安神', materials: [{ name: '檀香粉', ratio: 30 }, { name: '沉香粉', ratio: 15 }, { name: '乳香粉', ratio: 12 }, { name: '安息香', ratio: 8 }] }), '大幅调整檀香比例，加入安息香增强底调']
  )

  db.run(
    `INSERT INTO formulas (name, description, version, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['兰馥清远', '以兰花为灵感的清雅配方，适合书房与茶室', 2, '柠檬、薄荷', '兰花、茉莉', '白檀、龙脑', 30, 45, 4, 'testing']
  )
  const f2Id = getLastInsertRowId(db)

  const materials2 = [
    [f2Id, '兰花浸膏', 5, 'g', 'middle'],
    [f2Id, '茉莉净油', 3, 'ml', 'middle'],
    [f2Id, '白檀粉', 20, 'g', 'base'],
    [f2Id, '龙脑', 2, 'g', 'base'],
    [f2Id, '柠檬精油', 4, 'ml', 'top'],
    [f2Id, '薄荷精油', 1, 'ml', 'top'],
    [f2Id, '楠木粉(粘合)', 12, 'g', 'base'],
  ] as any[][]
  for (const m of materials2) {
    db.run('INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)', m)
  }

  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f2Id, 2, 'LF-2025-001', '2025-04-01', 20, 'testing', '第二版测评中']
  )
  const b3Id = getLastInsertRowId(db)

  db.run(
    `INSERT INTO evaluations (formula_id, batch_id, evaluator, scent_score, longevity_score, stability_score, overall_score, top_note_rating, middle_note_rating, base_note_rating, burning_time_actual, longevity_actual_hours, comments, is_blind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f2Id, b3Id, '张师傅', 7.5, 6.0, 7.0, 6.8, 8.0, 7.5, 6.0, 35, 3.0, '前调清亮但留香偏短，底调需要加强', 0]
  )

  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f2Id, 1, JSON.stringify({ name: '兰馥清远', materials: [{ name: '兰花浸膏', ratio: 3 }, { name: '白檀粉', ratio: 18 }] }), '初版，兰花量不足']
  )
  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f2Id, 2, JSON.stringify({ name: '兰馥清远', materials: [{ name: '兰花浸膏', ratio: 5 }, { name: '白檀粉', ratio: 20 }, { name: '龙脑', ratio: 2 }] }), '增加兰花比例，加入龙脑定香']
  )

  db.run(
    `INSERT INTO formulas (name, description, version, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['松风听涛', '松柏为骨的森系配方，适合冥想与瑜伽', 1, '松针、桉叶', '柏木、雪松', '广藿香、岩兰草', 60, 80, 8, 'draft']
  )
  const f3Id = getLastInsertRowId(db)

  const materials3 = [
    [f3Id, '松针粉', 15, 'g', 'top'],
    [f3Id, '桉叶精油', 2, 'ml', 'top'],
    [f3Id, '柏木粉', 20, 'g', 'middle'],
    [f3Id, '雪松精油', 3, 'ml', 'middle'],
    [f3Id, '广藿香粉', 10, 'g', 'base'],
    [f3Id, '岩兰草精油', 2, 'ml', 'base'],
    [f3Id, '楠木粉(粘合)', 15, 'g', 'base'],
  ] as any[][]
  for (const m of materials3) {
    db.run('INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)', m)
  }

  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f3Id, 1, JSON.stringify({ name: '松风听涛', materials: [{ name: '松针粉', ratio: 15 }, { name: '柏木粉', ratio: 20 }] }), '初版设计']
  )

  db.run(
    `INSERT INTO formulas (name, description, version, top_note, middle_note, base_note, burning_time_min, burning_time_max, longevity_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['梅影暗香', '梅花主题配方，实验性方案已归档', 1, '梅花', '丁香', '零陵香豆', 20, 30, 2, 'archived']
  )
  const f4Id = getLastInsertRowId(db)

  const materials4 = [
    [f4Id, '梅花浸膏', 4, 'g', 'top'],
    [f4Id, '丁香粉', 8, 'g', 'middle'],
    [f4Id, '零陵香豆粉', 6, 'g', 'base'],
    [f4Id, '楠木粉(粘合)', 10, 'g', 'base'],
  ] as any[][]
  for (const m of materials4) {
    db.run('INSERT INTO formula_materials (formula_id, material_name, ratio, unit, note_type) VALUES (?, ?, ?, ?, ?)', m)
  }

  db.run(
    `INSERT INTO batches (formula_id, formula_version, batch_code, production_date, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f4Id, 1, 'MY-2025-001', '2025-01-05', 10, 'failed', '燃烧不充分，留香过短']
  )

  db.run(
    `INSERT INTO formula_versions (formula_id, version, snapshot, change_note) VALUES (?, ?, ?, ?)`,
    [f4Id, 1, JSON.stringify({ name: '梅影暗香', materials: [{ name: '梅花浸膏', ratio: 4 }, { name: '丁香粉', ratio: 8 }] }), '初版，实验失败归档']
  )

  const invItems = [
    ['檀香粉', '木本', 500, 'g', 200, 3.5, '天香源', '2025-04-20'],
    ['沉香粉', '木本', 80, 'g', 100, 25.0, '天香源', '2025-03-10'],
    ['乳香粉', '树脂', 300, 'g', 100, 8.0, '西域香坊', '2025-04-15'],
    ['安息香', '树脂', 200, 'g', 80, 12.0, '西域香坊', '2025-04-15'],
    ['佛手柑精油', '精油', 30, 'ml', 20, 15.0, '芳源堂', '2025-05-01'],
    ['甜橙精油', '精油', 45, 'ml', 20, 8.0, '芳源堂', '2025-05-01'],
    ['楠木粉(粘合)', '粘合剂', 1000, 'g', 300, 1.5, '天香源', '2025-04-20'],
    ['兰花浸膏', '花膏', 15, 'g', 10, 50.0, '芳源堂', '2025-03-25'],
    ['茉莉净油', '精油', 8, 'ml', 10, 80.0, '芳源堂', '2025-02-15'],
    ['白檀粉', '木本', 350, 'g', 150, 4.0, '天香源', '2025-04-20'],
    ['龙脑', '树脂', 25, 'g', 20, 45.0, '西域香坊', '2025-03-10'],
    ['松针粉', '草本', 200, 'g', 100, 2.0, '山野集', '2025-05-05'],
    ['柏木粉', '木本', 280, 'g', 100, 3.0, '山野集', '2025-05-05'],
    ['广藿香粉', '草本', 150, 'g', 80, 5.0, '山野集', '2025-04-10'],
    ['雪松精油', '精油', 18, 'ml', 15, 22.0, '芳源堂', '2025-04-10'],
    ['桉叶精油', '精油', 22, 'ml', 15, 10.0, '芳源堂', '2025-04-10'],
    ['岩兰草精油', '精油', 12, 'ml', 10, 35.0, '芳源堂', '2025-03-20'],
    ['梅花浸膏', '花膏', 5, 'g', 8, 120.0, '芳源堂', '2025-01-02'],
    ['丁香粉', '香料', 90, 'g', 50, 6.0, '西域香坊', '2025-02-20'],
    ['零陵香豆粉', '香料', 40, 'g', 30, 15.0, '西域香坊', '2025-02-20'],
  ] as any[][]
  for (const inv of invItems) {
    db.run(
      `INSERT INTO inventory (material_name, category, current_stock, unit, min_threshold, unit_cost, supplier, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      inv
    )
    const invId = getLastInsertRowId(db)
    db.run(
      `INSERT INTO inventory_logs (inventory_id, change_amount, change_type, related_batch_id, notes) VALUES (?, ?, ?, ?, ?)`,
      [invId, inv[2], 'restock', null, '初始库存']
    )
  }

  db.run(`INSERT INTO inventory_logs (inventory_id, change_amount, change_type, related_batch_id, notes) VALUES (?, ?, ?, ?, ?)`, [1, -150, 'consumption', b1Id, 'TJ-2025-001批次消耗'])
  db.run(`INSERT INTO inventory_logs (inventory_id, change_amount, change_type, related_batch_id, notes) VALUES (?, ?, ?, ?, ?)`, [2, -75, 'consumption', b1Id, 'TJ-2025-001批次消耗'])
  db.run(`INSERT INTO inventory_logs (inventory_id, change_amount, change_type, related_batch_id, notes) VALUES (?, ?, ?, ?, ?)`, [1, -90, 'consumption', b2Id, 'TJ-2025-002批次消耗'])

  saveDb()
}
