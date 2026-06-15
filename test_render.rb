#!/usr/bin/env ruby
require_relative "config/environment"
require "ostruct"

puts "=" * 60
puts "🧪 直接渲染视图测试 (不依赖 HTTP 服务器)"
puts "=" * 60

# 1. 测试 build_comparison_data 方法
puts "\n1. 测试 build_comparison_data..."
sessions = GameSession.where(id: [1,2,3]).includes(:growth_histories, :contamination_results, :operation_details)
controller = GameSessionsController.new
controller.instance_variable_set(:@_params, ActionController::Parameters.new)
data = controller.send(:build_comparison_data, sessions)
puts "   build_comparison_data 生成 #{data.size} 条数据"

# 2. 模拟控制器设置 + 渲染视图测试
puts "\n2. 模拟 batch_comparison 渲染..."
begin
  html = ApplicationController.renderer.render(
    template: "game_sessions/batch_comparison",
    assigns: {
      game_session: GameSession.find(1),
      sessions: sessions,
      comparison_data: data
    }
  )
  puts "   ✅ 渲染成功! #{html.size} bytes"
  puts "   ✅ 包含 6 维雷达图 axes: #{html.include?('覆盖率') && html.include?('目标区') && html.include?('效率')}"
  puts "   ✅ 包含折线图 SVG: #{html.include?('<svg') && html.include?('polyline')}"
  puts "   ✅ 包含归因分析: #{html.include?('差异归因')}"
  batch_ok = true
rescue => e
  puts "   ❌ 渲染失败: #{e.class}: #{e.message}"
  puts e.backtrace.first(8).join("\n")
  batch_ok = false
end

# 3. 测试其他关键视图
puts "\n3. 测试其他关键视图渲染..."
views_to_test = [
  ["首页", "home/index", {
    total_sessions: GameSession.count,
    completed_sessions: GameSession.completed.order(final_score: :desc).limit(5),
    avg_score: GameSession.completed.average(:final_score).to_f.round(2),
    active_contamination: ContaminationResult.detected.count,
    recent_sessions: GameSession.order(created_at: :desc).limit(8),
    stats: {
      total: GameSession.count,
      completed: GameSession.completed.count,
      avg_score: GameSession.completed.average(:final_score)&.round(1) || 0,
      best_score: GameSession.completed.maximum(:final_score) || 0
    }
  }],
  ["实验详情#1", "game_sessions/show", begin
    s = GameSession.includes(:growth_histories, :contamination_results, :operation_details).find(1)
    engine = GameEngine.new(s)
    {
      game_session: s,
      engine: engine,
      temp_factor: engine.calculate_temperature_factor,
      moisture_factor: engine.calculate_moisture_factor,
      ph_factor: engine.calculate_ph_factor,
      strain_info: s.target_strain_info,
      histories: s.growth_histories.order(round_number: :desc).limit(10),
      contaminations: s.contamination_results.detected.order(round_number: :desc).limit(5),
      operations: s.operation_details.order(round_number: :desc, created_at: :desc).limit(15)
    }
  end],
  ["菌落图谱#1", "game_sessions/colony_map", begin
    s = GameSession.includes(:growth_histories, :operation_details).find(1)
    histories = s.growth_histories.order(:round_number)
    {
      game_session: s,
      histories: histories,
      operations: s.operation_details.order(:round_number, :created_at),
      coverage_data: histories.pluck(:round_number, :target_coverage, :target_zone_coverage),
      factor_data: histories.map { |h| [h.round_number, h.temperature_factor, h.moisture_factor, h.antibiotic_factor] }
    }
  end],
  ["污染差异#2", "game_sessions/contamination_diff", begin
    s = GameSession.includes(:contamination_results).find(2)
    {
      game_session: s,
      contaminations: s.contamination_results.detected.order(:round_number)
    }
  end],
  ["菌株图鉴", "strains/index", {
    strains: GameSession::STRAINS.map { |id, s|
      OpenStruct.new(
        id: id, name: s[:name], color: s[:color],
        optimal_temp: s[:optimal_temp],
        temp_range: s[:temp_range],
        growth_rate: s[:growth_rate],
        ph_range: s[:ph_range],
        description: s[:description],
        target_zone: s[:target_zone_shape]
      )
    },
    contaminants: GameSession::CONTAMINANTS.map { |id, c|
      OpenStruct.new(
        id: id, name: c[:name], color: c[:color],
        optimal_temp: c[:optimal_temp],
        competitiveness: c[:competitiveness],
        description: c[:description]
      )
    }
  }],
  ["实验时间线", "experiments/index", {
    sample_categories: ExperimentsController::SAMPLE_CATEGORIES,
    sessions: GameSession.includes(:growth_histories, :contamination_results).order(created_at: :desc).limit(20)
  }],
  ["时间线详情#1", "experiments/show", {
    sample_categories: ExperimentsController::SAMPLE_CATEGORIES,
    session: GameSession.includes(:growth_histories, :contamination_results, :operation_details).find(1),
    timeline: begin
      s = GameSession.includes(:growth_histories, :contamination_results, :operation_details).find(1)
      base_time = s.created_at || Time.current
      tl = []
      s.growth_histories.each { |h| tl << { round: h.round_number, type: :growth, time: h.created_at || base_time + h.round_number.to_i.minutes, data: h } }
      s.contamination_results.each { |c| tl << { round: c.round_number, type: :contamination, time: c.created_at || base_time + c.round_number.to_i.minutes, data: c } }
      s.operation_details.each { |o| tl << { round: o.round_number, type: :operation, time: o.created_at || base_time + (o.round_number || 0).to_i.minutes, data: o } }
      tl.sort_by { |e| [e[:round] || 999, e[:time]] }
    end
  }],
  ["批次对比列表", "game_sessions/batch_comparison_list", {
    batch_groups: GameSession.where.not(batch_tag: [nil, ""]).order(created_at: :desc).group_by(&:batch_tag)
  }],
  ["实验大厅", "game_sessions/index", {
    game_sessions: GameSession.includes(:growth_histories, :contamination_results).order(created_at: :desc).limit(50)
  }],
  ["新建实验", "game_sessions/new", {
    game_session: GameSession.new,
    strains: GameSession::STRAINS.map { |id, s| [s[:name], id, s] }
  }]
]

pass = 0
views_to_test.each do |name, template, assigns|
  begin
    html = ApplicationController.renderer.render(template: template, assigns: assigns)
    puts "   ✅ #{name}: #{html.size} bytes"
    pass += 1
  rescue => e
    puts "   ❌ #{name}: #{e.class}: #{e.message[0..120]}"
    puts "      #{e.backtrace.first(2).join("\n      ")}"
  end
end

puts "\n" + "=" * 60
puts "📊 汇总:"
puts "   批次对比: #{batch_ok ? '✅ 通过' : '❌ 失败'}"
puts "   其他视图: #{pass}/#{views_to_test.size} 通过"
puts "=" * 60
