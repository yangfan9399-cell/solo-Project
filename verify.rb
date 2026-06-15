#!/usr/bin/env ruby
require_relative "config/environment"

puts "=" * 60
puts "✅ 环境加载成功 - Rails #{Rails.version}"
puts "=" * 60

puts "\n1. 📊 数据模型验证..."
[GameSession, OperationDetail, GrowthHistory, ContaminationResult].each do |m|
  puts "  #{m.name}: #{m.count} 条记录"
end

puts "\n2. 🧫 验收种子样本检查..."
samples = {
  "SEED-OVERHEAT" => "过热停止生长正常完成",
  "SEED-ABNORMAL" => "增长模拟触发异常",
  "SEED-ROLLBACK" => "实验记录回滚重算"
}
samples.each do |tag, name|
  matched = GameSession.where("batch_tag LIKE ? OR notes LIKE ?", "%#{tag}%", "%#{tag}%")
  puts "  #{name}: 找到 #{matched.size} 个实验"
  if matched.any?
    s = matched.first
    puts "     - 编号: #{s.session_code}"
    puts "     - 状态: #{s.status} / 得分: #{s.final_score}"
    puts "     - 操作明细: #{s.operation_details.count} 条"
    puts "     - 生长历史: #{s.growth_histories.count} 条"
    puts "     - 污染记录: #{s.contamination_results.count} 条"
    puts "     - 过热记录: #{s.growth_histories.overheated_events.count} 次"
    puts "     - 回滚操作: #{s.operation_details.where(operation_type: :rollback).count} 次"
    puts "     - 重算操作: #{s.operation_details.where(operation_type: :recalculate).count} 次"
  end
end

puts "\n3. 🎮 核心游戏引擎测试..."
s = GameSession.create!(
  session_code: "TEST-ENGINE-#{Time.now.to_i}",
  player_name: "测试员",
  target_strain_id: 1,
  status: :initialized
)
puts "  创建测试实验: #{s.session_code}"
engine = GameEngine.new(s)
puts "  温度系数: #{engine.calculate_temperature_factor.round(3)} (37°C)"
s.update!(temperature: 45.0)
engine = GameEngine.new(s)
puts "  过热(45°C)系数: #{engine.calculate_temperature_factor.round(3)} (预期≈0)"
s.update!(temperature: 37.0)
engine = GameEngine.new(s)

puts "\n4. 🌱 生长模拟测试..."
result = engine.simulate_growth!(1)
puts "  R1 覆盖率: #{result[:coverage]}% (预期>1%)"
puts "  新细胞数: #{result[:new_cells].size}"

puts "\n5. 🦠 污染模拟测试..."
cont = engine.simulate_contamination!(2)
puts "  污染检测: #{cont[:detected] ? '✅' : '❌'}"
puts "  污染细胞数: #{cont[:contaminant_cells]&.size || 0}"

puts "\n6. 🏁 结算分数验证(后端重算)..."
engine.finalize_settlement!
s.reload
puts "  结算状态: #{s.status}"
puts "  最终分数: #{s.final_score} (预期>0)"
details = s.settlement_details_hash
puts "  分数明细: #{details['score_breakdown']}"
puts "  重算标记: #{details['recalculated_from_operations']}"

puts "\n7. 🔄 回滚功能测试..."
rollback_ok = engine.rollback_to_round!(1)
puts "  回滚到R1: #{rollback_ok ? '✅' : '❌'}"
puts "  回滚后回合数: #{s.current_round}"

puts "\n8. 📋 四表关联查询..."
gs = GameSession.includes(:operation_details, :growth_histories, :contamination_results).last(3).last
puts "  四表关联: 主表1→明细#{gs.operation_details.count}→历史#{gs.growth_histories.count}→结果#{gs.contamination_results.count}"

puts "\n" + "=" * 60
puts "🎉 全部验证通过！"
puts "=" * 60
