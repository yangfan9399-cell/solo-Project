require "date"

def seed_session(attrs = {}, &block)
  s = GameSession.create!(attrs)
  if block_given?
    yield s
    s.save!
  end
  s
end

def add_operation(session, type, round, attrs = {})
  OperationDetail.create!({
    game_session: session,
    round_number: round,
    operation_type: type,
    executed_at: session.created_at + round.minutes
  }.merge(attrs))
end

def add_growth(session, round, attrs = {})
  GrowthHistory.create!({
    game_session: session,
    round_number: round,
    event_type: "growth",
    target_coverage: 0.0,
    target_zone_coverage: 0.0,
    target_colony_cells: 4,
    growth_rate: 0.12,
    effective_nutrient: 50.0,
    temperature_factor: 1.0,
    moisture_factor: 1.0,
    antibiotic_factor: 1.0,
    event_description: "",
    is_overheated: false,
    is_growth_stopped: false
  }.merge(attrs))
end

def add_contamination(session, round, attrs = {})
  ContaminationResult.create!({
    game_session: session,
    round_number: round,
    contaminant_strain_id: 101,
    contaminant_name: "金黄色葡萄球菌",
    is_detected: true,
    is_controlled: false,
    nutrient_consumed: 5.0,
    contaminant_coverage: 2.0,
    contaminant_cell_count: 8,
    target_nutrient_loss: 2.0,
    target_growth_impact: 5.0,
    competition_index: 0.15,
    severity: "low",
    event_description: ""
  }.merge(attrs))
end

puts "🌱 开始创建种子样本数据..."

seed1_created = false
seed2_created = false
seed3_created = false

ActiveRecord::Base.transaction do
  puts "=== 样本1: SEED-OVERHEAT - 过热会停止生长正常完成 ==="
  s1 = seed_session(
    session_code: "PETRI-SEED-OVH-#{SecureRandom.hex(3).upcase}",
    player_name: "研究员-过热测试",
    status: :completed,
    target_strain_id: 1,
    initial_nutrient_level: 60.0,
    current_nutrient_level: 18.5,
    temperature: 37.0,
    ph_level: 7.0,
    current_round: 15,
    max_rounds: 20,
    target_coverage: 60.0,
    actual_coverage: 62.3,
    batch_tag: "SEED-OVERHEAT-B001",
    notes: "SEED-OVERHEAT 样本：过热停止生长后恢复，最终成功达标。第5-7轮因温度超标停止，第8轮温度恢复后继续生长。"
  )
  # 初始化网格
  grid = Array.new(GameSession::GRID_SIZE) { Array.new(GameSession::GRID_SIZE, GameSession::CELL_EMPTY) }
  center = GameSession::GRID_SIZE / 2
  2.times { |i| 2.times { |j| grid[center - 1 + i][center - 1 + j] = GameSession::CELL_TARGET } }
  target_points = []
  (GameSession::GRID_SIZE - 6...GameSession::GRID_SIZE - 2).each do |x|
    (2...6).each { |y| target_points << [x, y] }
  end
  s1.colony_grid = grid.to_json
  s1.target_zone_points = target_points.to_json
  s1.save!

  coverage_progress = [4, 12, 25, 40, 55, 56, 56, 58, 59, 55, 52, 50, 48, 47, 46]
  (1..15).each do |r|
    overheated = (r >= 5 && r <= 7)
    s1.temperature = if r < 5 then 37.0
                     elsif r < 8 then 44.5 + rand
                     else 36.0
                     end

    add_operation(s1, :adjust_temperature, r,
      temperature_adjustment: case r when 4 then 5.0 when 7 then -8.0 else 0.0 end,
      operation_note: "温度调整 #{case r when 4 then '+5°C 误操作' when 7 then '-8°C 紧急降温' else '微调' end}")
    add_operation(s1, :simulate_growth, r, moisture_level: r < 7 ? 55.0 : 62.0, operation_note: "第 #{r} 轮生长模拟")
    if r % 3 == 0
      add_operation(s1, :add_nutrient, r, nutrient_adjustment: 10.0, operation_note: "补充营养 10 单位")
    end

    reached_cells = []
    new_cells = []
    target_cells_count = coverage_progress[r - 1] * (GameSession::GRID_SIZE * GameSession::GRID_SIZE) / 100
    zone_coverage = if r >= 12 then ((r - 11) * 18 + 8) else [r * 3, 0].max end

    GrowthHistory.create!(
      game_session: s1,
      round_number: r,
      event_type: overheated ? "overheat" : (zone_coverage >= 30 ? "expansion" : "growth"),
      target_coverage: coverage_progress[r - 1].to_f,
      target_zone_coverage: zone_coverage.to_f,
      target_colony_cells: target_cells_count.to_i,
      growth_rate: overheated ? 0.0 : 0.12 + rand * 0.05,
      effective_nutrient: [60.0 - r * 2.8 + (r / 3) * 10.0, 5.0].max.round(2),
      temperature_factor: overheated ? 0.0 : (s1.temperature.to_f > 42 ? 0.2 : (1.0 - (s1.temperature.to_f - 37).abs * 0.08)).round(4),
      moisture_factor: 0.85 + rand * 0.15,
      antibiotic_factor: 1.0,
      target_zone_reached_cells: reached_cells.first(zone_coverage / 5).to_json,
      new_growth_cells: new_cells.to_json,
      stagnated_cells: (overheated ? [[10, 10], [11, 10], [10, 11]] : []).to_json,
      event_description: overheated ? "温度过热 #{s1.temperature.round(1)}°C，生长停止!" : "正常生长 #{new_cells.size} 细胞，目标区 #{zone_coverage}%",
      is_overheated: overheated,
      is_growth_stopped: overheated
    )
  end

  # 一次轻微污染事件
  add_contamination(s1, 9,
    contaminant_strain_id: 102,
    contaminant_name: "黑曲霉孢子",
    severity: "low",
    is_controlled: true,
    nutrient_consumed: 3.2,
    contaminant_coverage: 1.5,
    contaminant_cell_count: 6,
    target_nutrient_loss: 1.8,
    target_growth_impact: 2.5,
    competition_index: 0.08,
    event_description: "黑曲霉轻度入侵，已被控制，影响不大"
  )

  add_operation(s1, :place_antibiotic, 9,
    antibiotic_radius: 2.5,
    antibiotic_position_x: 3,
    antibiotic_position_y: 3,
    antibiotic_type: "weak",
    operation_note: "放置弱效抑菌圈应对黑曲霉")

  engine = GameEngine.new(s1)
  engine.finalize_settlement!
  seed1_created = true
  puts "✅ 样本1已创建: #{s1.session_code} 得分 #{s1.final_score}"

  puts "=== 样本2: SEED-ABNORMAL - 增长模拟触发异常（多次污染） ==="
  s2 = seed_session(
    session_code: "PETRI-SEED-ABN-#{SecureRandom.hex(3).upcase}",
    player_name: "研究员-异常测试",
    status: :completed,
    target_strain_id: 3,
    initial_nutrient_level: 75.0,
    current_nutrient_level: 5.0,
    temperature: 37.5,
    ph_level: 7.2,
    current_round: 20,
    max_rounds: 20,
    target_coverage: 70.0,
    actual_coverage: 34.2,
    batch_tag: "SEED-ABNORMAL-B002",
    notes: "SEED-ABNORMAL 样本：营养过剩导致多次严重污染事件，模拟异常场景。第3轮污染扩散、第7轮竞争激烈、第15轮危急污染。"
  )
  s2.colony_grid = grid.to_json
  s2.target_zone_points = target_points.to_json
  s2.save!

  cov2 = [4, 9, 14, 11, 16, 22, 20, 18, 24, 28, 33, 30, 35, 38, 34, 31, 33, 34, 35, 34]
  (1..20).each do |r|
    temp_adj = case r when 5 then 1.5 when 10 then -2.0 when 16 then 1.0 else 0.0 end
    s2.temperature += temp_adj

    add_operation(s2, :simulate_growth, r, moisture_level: 40 + r * 1.5, operation_note: "第 #{r} 轮生长模拟")
    if temp_adj != 0
      add_operation(s2, :adjust_temperature, r, temperature_adjustment: temp_adj, operation_note: "温度调整 #{temp_adj > 0 ? '+' : ''}#{temp_adj}°C")
    end

    zone2 = if r >= 18 then 22 elsif r >= 12 then r else [r - 2, 0].max end

    GrowthHistory.create!(
      game_session: s2,
      round_number: r,
      event_type: (r == 15 || r == 7) ? "stagnation" : (zone2 > 10 ? "expansion" : "growth"),
      target_coverage: cov2[r - 1].to_f,
      target_zone_coverage: zone2.to_f,
      target_colony_cells: (cov2[r - 1] * GameSession::GRID_SIZE * GameSession::GRID_SIZE / 100).to_i,
      growth_rate: 0.05 + rand * 0.06,
      effective_nutrient: [75.0 - r * 4.0, 0.0].max,
      temperature_factor: (1.0 - (s2.temperature.to_f - 37).abs * 0.1).round(4),
      moisture_factor: [0.5 + (r % 5) * 0.1, 1.0].min.round(4),
      antibiotic_factor: r > 9 ? 0.85 : 1.0,
      event_description: case r when 7 then "第7轮污染侵袭，生长受限" when 15 then "危急污染，目标菌损失惨重" else "生长受污染压制" end,
      is_overheated: false,
      is_growth_stopped: r == 15
    )
  end

  # 3次污染事件，包括模拟异常触发
  add_contamination(s2, 3,
    contaminant_strain_id: 101,
    contaminant_name: "金黄色葡萄球菌",
    severity: "medium",
    is_controlled: false,
    nutrient_consumed: 8.5,
    contaminant_coverage: 4.2,
    contaminant_cell_count: 17,
    target_nutrient_loss: 4.0,
    target_growth_impact: 8.5,
    competition_index: 0.28,
    event_description: "高营养吸引金黄色葡萄球菌入侵，争夺营养 8.5 单位",
    before_state: {nutrient: 62.0, target_coverage: 14.0, contaminant_coverage: 0.0}.to_json,
    after_state: {nutrient: 49.5, target_coverage: 11.0, contaminant_coverage: 4.2}.to_json
  )

  add_contamination(s2, 7,
    contaminant_strain_id: 101,
    contaminant_name: "金黄色葡萄球菌",
    severity: "high",
    is_controlled: false,
    nutrient_consumed: 15.2,
    contaminant_coverage: 9.8,
    contaminant_cell_count: 39,
    target_nutrient_loss: 8.7,
    target_growth_impact: 15.0,
    competition_index: 0.56,
    event_description: "ABNORMAL: 异常触发！金葡菌大量繁殖，覆盖9.8%",
    before_state: {nutrient: 45.0, target_coverage: 22.0, contaminant_coverage: 5.0}.to_json,
    after_state: {nutrient: 21.1, target_coverage: 20.0, contaminant_coverage: 9.8}.to_json
  )

  add_contamination(s2, 15,
    contaminant_strain_id: 103,
    contaminant_name: "白色念珠菌",
    severity: "critical",
    is_controlled: false,
    nutrient_consumed: 22.0,
    contaminant_coverage: 17.5,
    contaminant_cell_count: 70,
    target_nutrient_loss: 15.0,
    target_growth_impact: 28.0,
    competition_index: 0.88,
    event_description: "CRITICAL: 白色念珠菌爆发！23轮模拟异常，目标区被大量侵占",
    before_state: {nutrient: 28.0, target_coverage: 38.0, contaminant_coverage: 12.0}.to_json,
    after_state: {nutrient: 5.0, target_coverage: 34.0, contaminant_coverage: 17.5}.to_json
  )

  # 抑菌操作
  add_operation(s2, :place_antibiotic, 4,
    antibiotic_radius: 3.5, antibiotic_position_x: 5, antibiotic_position_y: 5,
    antibiotic_type: "medium", operation_note: "尝试中效抑菌圈，但为时已晚")
  add_operation(s2, :place_antibiotic, 8,
    antibiotic_radius: 4.5, antibiotic_position_x: 10, antibiotic_position_y: 6,
    antibiotic_type: "strong", operation_note: "强效抑菌圈放置")
  add_operation(s2, :place_antibiotic, 16,
    antibiotic_radius: 4.5, antibiotic_position_x: 12, antibiotic_position_y: 12,
    antibiotic_type: "strong", operation_note: "危急情况下再次放置强效抑菌")

  engine2 = GameEngine.new(s2)
  engine2.finalize_settlement!
  seed2_created = true
  puts "✅ 样本2已创建: #{s2.session_code} 得分 #{s2.final_score} (失败场景)"

  puts "=== 样本3: SEED-ROLLBACK - 实验记录回滚或重算 ==="
  s3 = seed_session(
    session_code: "PETRI-SEED-RBK-#{SecureRandom.hex(3).upcase}",
    player_name: "研究员-回滚测试",
    status: :completed,
    target_strain_id: 2,
    initial_nutrient_level: 55.0,
    current_nutrient_level: 25.0,
    temperature: 30.0,
    ph_level: 6.5,
    current_round: 14,
    max_rounds: 18,
    target_coverage: 65.0,
    actual_coverage: 68.0,
    batch_tag: "SEED-ROLLBACK-B003",
    notes: "SEED-ROLLBACK 样本：第10轮操作错误导致过热，回滚至R8后重算，最终成功。演示回滚/重算验收场景。"
  )
  s3.colony_grid = grid.to_json
  s3.target_zone_points = target_points.to_json
  s3.save!

  # 前8轮正常
  cov3_normal = [4, 11, 20, 31, 42, 51, 58, 62]
  (1..8).each do |r|
    s3.temperature = 29.0 + r * 0.2
    add_operation(s3, :simulate_growth, r, moisture_level: 50 + r, operation_note: "第 #{r} 轮正常生长")
    if r.even?
      add_operation(s3, :adjust_moisture, r, moisture_adjustment: 5.0, moisture_level: 50 + r * 5, operation_note: "水分微调 +5%")
    end

    GrowthHistory.create!(
      game_session: s3,
      round_number: r,
      event_type: cov3_normal[r - 1] >= 30 ? "expansion" : "growth",
      target_coverage: cov3_normal[r - 1].to_f,
      target_zone_coverage: (r * 4).to_f,
      target_colony_cells: (cov3_normal[r - 1] * 4).to_i,
      growth_rate: 0.12,
      effective_nutrient: 55 - r * 4,
      temperature_factor: 0.95,
      moisture_factor: 0.95,
      antibiotic_factor: 1.0,
      event_description: "正常推进 R#{r}",
      is_overheated: false,
      is_growth_stopped: false
    )
  end

  # 第9-10轮 模拟误操作(后来回滚) - 先写入过热操作，再通过回滚记录标记
  (9..10).each do |r|
    add_operation(s3, :adjust_temperature, r,
      temperature_adjustment: r == 9 ? 9.5 : 4.0,
      operation_note: "⚠️ 误操作：温度猛升 +#{r == 9 ? 9.5 : 4}°C")
    add_operation(s3, :simulate_growth, r, moisture_level: 45.0, operation_note: "过热模拟，错误推进")

    GrowthHistory.create!(
      game_session: s3,
      round_number: r,
      event_type: "overheat",
      target_coverage: (62 - (r - 8) * 2).to_f,
      target_zone_coverage: 32.0,
      target_colony_cells: (62 - (r - 8) * 2) * 4,
      growth_rate: 0.0,
      effective_nutrient: 40 - r * 2,
      temperature_factor: 0.0,
      moisture_factor: 0.8,
      antibiotic_factor: 1.0,
      event_description: "过热停止！错误操作导致",
      is_overheated: true,
      is_growth_stopped: true
    )
  end

  # R10.5: 执行回滚
  add_operation(s3, :rollback, 8,
    operation_note: "🔄 检测到R9/R10操作错误，回滚至R8，准备重算")

  # R11-R14: 重新计算的正确推进（实际存储为R9-R12但展示时以新编号继续）
  new_labels = [9, 10, 11, 12]
  redo_cov = [62, 64, 66, 68]
  redo_zone = [36, 42, 55, 68]
  new_labels.each_with_index do |nr, i|
    actual_round = 11 + i
    s3.temperature = 29.5
    add_operation(s3, :adjust_temperature, actual_round,
      temperature_adjustment: -6.0,
      operation_note: "✅ 纠正：温度调回适宜 #{s3.temperature}°C")
    add_operation(s3, :simulate_growth, actual_round, moisture_level: 55.0 + i * 2,
      operation_note: "RECALC: 重算R#{nr}（从R8基础继续）")

    GrowthHistory.create!(
      game_session: s3,
      round_number: actual_round,
      event_type: redo_zone[i] >= 50 ? "target_reached" : "expansion",
      target_coverage: redo_cov[i].to_f,
      target_zone_coverage: redo_zone[i].to_f,
      target_colony_cells: redo_cov[i] * 4,
      growth_rate: 0.13 + i * 0.01,
      effective_nutrient: 32 - i * 2,
      temperature_factor: 0.97,
      moisture_factor: 0.95,
      antibiotic_factor: 1.0,
      event_description: "🔁 回滚重算: 从R8继续R#{nr} - #{redo_cov[i]}% 覆盖，目标区#{redo_zone[i]}%",
      is_overheated: false,
      is_growth_stopped: false
    )
  end

  # 最终 RECAL 操作
  add_operation(s3, :recalculate, 14,
    operation_note: "🏁 强制重新计算：基于R8至R12的有效数据，结算完成")

  # 轻微污染
  add_contamination(s3, 12,
    contaminant_strain_id: 101,
    contaminant_name: "金黄色葡萄球菌",
    severity: "low",
    is_controlled: true,
    nutrient_consumed: 2.5,
    contaminant_coverage: 0.8,
    contaminant_cell_count: 3,
    target_nutrient_loss: 1.0,
    target_growth_impact: 1.5,
    competition_index: 0.05,
    event_description: "轻微污染，不影响大局"
  )

  engine3 = GameEngine.new(s3)
  engine3.finalize_settlement!
  s3.update_columns(status: :rolled_back) if s3.completed?
  s3.update_columns(status: :completed)
  seed3_created = true
  puts "✅ 样本3已创建: #{s3.session_code} 得分 #{s3.final_score} (包含回滚记录)"

  # 为批次对比创建一个同源对比实验
  puts "=== 创建额外批次对比样本 ==="
  3.times do |i|
    variant = seed_session(
      session_code: "PETRI-BATCH-#{i + 1}-#{SecureRandom.hex(2).upcase}",
      player_name: "对比实验-#{i + 1}",
      status: [:completed, :in_progress, :completed][i],
      target_strain_id: [1, 3, 2][i],
      initial_nutrient_level: [50.0, 65.0, 55.0][i],
      current_nutrient_level: [20.0 - i * 3, 45.0, 22.0][i],
      temperature: [37.0, 37.5, 30.0][i],
      ph_level: [7.0, 7.2, 6.5][i],
      current_round: [16, 10, 14][i],
      max_rounds: 20,
      target_coverage: 70.0,
      actual_coverage: [55.0 + i * 5, 32.0, 60.0][i],
      batch_tag: ["SEED-OVERHEAT-B001", "SEED-ABNORMAL-B002", "SEED-ROLLBACK-B003"][i],
      notes: "与#{['SEED-OVERHEAT', 'SEED-ABNORMAL', 'SEED-ROLLBACK'][i]}同批次的对比实验"
    )
    variant.colony_grid = grid.to_json
    variant.target_zone_points = target_points.to_json
    variant.save!

    (1..[16, 10, 14][i]).each do |r|
      GrowthHistory.create!(
        game_session: variant,
        round_number: r,
        event_type: "growth",
        target_coverage: (r * [3.5, 3.2, 4.3][i]).round(2),
        target_zone_coverage: (r * [2.5, 2.0, 3.2][i]).round(2),
        target_colony_cells: r * 20,
        growth_rate: [0.12, 0.10, 0.13][i],
        effective_nutrient: 50 - r * 2,
        temperature_factor: 1.0,
        moisture_factor: 0.9,
        antibiotic_factor: 1.0,
        event_description: "对比实验 #{i + 1} 第 #{r} 轮"
      )
    end
    if [0, 2].include?(i)
      eng = GameEngine.new(variant)
      eng.finalize_settlement!
    end
    puts "  ✅ 对比实验 #{i + 1}: #{variant.session_code} (#{variant.status})"
  end
end

if seed1_created && seed2_created && seed3_created
  puts ""
  puts "🎉 所有种子数据创建成功！"
  puts "📋 三个验收样本："
  puts "  1. SEED-OVERHEAT 过热会停止生长正常完成 ✅"
  puts "  2. SEED-ABNORMAL 增长模拟触发异常 ✅"
  puts "  3. SEED-ROLLBACK 实验记录回滚重算 ✅"
  puts ""
  puts "🔍 验收时可查看:"
  puts "  - /experiments 实验记录时间线"
  puts "  - /game_sessions/:id/contamination_diff 污染前后差异"
  puts "  - /game_sessions/batch_comparison_list 批次对比"
  puts "  - /game_sessions/:id/colony_map 菌落图谱"
else
  puts "❌ 部分种子创建失败，请检查错误日志"
end
