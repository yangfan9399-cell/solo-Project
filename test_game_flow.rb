player = Player.find_or_create_by!(name: '测试玩家')
level = Level.find_by(level_number: 1)

puts '=== 测试完整游戏流程 ==='
puts "玩家: #{player.name}"
puts "关卡: 第#{level.level_number}关 - #{level.name}"
puts

session = player.game_sessions.create!(level: level)
session.start!
puts "创建游戏局次 ##{session.id} [#{session.status}]"
puts "初始步数: #{session.moves_count}"
puts "初始RPM: #{session.current_rpm}"
puts

gears_state = session.parsed_gears_state
puts "初始齿轮数: #{gears_state.length}"
puts

gear1 = {
  id: 'placed_1',
  type: 'gear',
  x: 270,
  y: 350,
  teeth: 40,
  size: 60,
  rotation: 0.0,
  connected_to: [],
  active: false
}
from_state = session.parsed_gears_state.deep_dup
to_state = from_state + [gear1]
session.record_operation!('add', 'placed_1', from_state, to_state)
puts "第1步: 添加齿轮, 当前RPM: #{session.current_rpm}"

gear2 = {
  id: 'placed_2',
  type: 'gear',
  x: 390,
  y: 350,
  teeth: 40,
  size: 60,
  rotation: 0.0,
  connected_to: [],
  active: false
}
from_state = session.parsed_gears_state.deep_dup
to_state = from_state + [gear2]
session.record_operation!('add', 'placed_2', from_state, to_state)
puts "第2步: 添加齿轮, 当前RPM: #{session.current_rpm}"

gear3 = {
  id: 'placed_3',
  type: 'gear',
  x: 510,
  y: 350,
  teeth: 40,
  size: 60,
  rotation: 0.0,
  connected_to: [],
  active: false
}
from_state = session.parsed_gears_state.deep_dup
to_state = from_state + [gear3]
session.record_operation!('add', 'placed_3', from_state, to_state)
puts "第3步: 添加齿轮, 当前RPM: #{session.current_rpm}"

from_state = session.parsed_gears_state.deep_dup
gear = from_state.find { |g| g[:id] == 'placed_3' }
gear[:x] = 530
session.record_operation!('move', 'placed_3', from_state.deep_dup, from_state)
puts "第4步: 移动齿轮靠近目标, 当前RPM: #{session.current_rpm}"

puts
puts "操作历史记录: #{session.operation_histories.count}条"
session.operation_histories.each do |h|
  puts "  第#{h.move_number}步: #{h.operation_type} - #{h.gear_id}"
end

puts
puts "可撤销? #{session.can_undo?}"

if session.can_undo?
  session.undo!
  puts "撤销后步数: #{session.moves_count}"
  puts "撤销后RPM: #{session.current_rpm}"
end

puts
puts '=== 测试后端分数重计算 ==='
gears_state = [
  { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 40, size: 60 },
  { id: 'g1', type: 'gear', x: 270, y: 350, teeth: 40, size: 60 },
  { id: 'g2', type: 'gear', x: 390, y: 350, teeth: 40, size: 60 },
  { id: 'g3', type: 'gear', x: 510, y: 350, teeth: 40, size: 60 },
  { id: 'target', type: 'target', x: 630, y: 350, teeth: 40, size: 60 }
]
session.gears_state = gears_state
session.moves_count = 4
session.time_spent = 45
session.save!

calculator = ScoreCalculator.new(level, session)
result = calculator.calculate

puts "后端重计算结果:"
puts "  实际 RPM: #{result[:actual_rpm]}"
puts "  目标 RPM: #{result[:target_rpm]}"
puts "  转速差: #{result[:rpm_difference]}"
puts "  目标连接: #{result[:target_connected]}"
puts "  是否通过: #{result[:passed]}"
puts "  获得星数: #{result[:stars]}"
puts "  最终分数: #{result[:score]}"
puts "  分数明细: #{result[:breakdown]}"

puts
puts '=== 测试结算 ==='
final_result = session.complete!
puts "结算后状态: #{session.status}"
puts "结算后分数: #{session.score}"
puts "结算后星数: #{session.stars}"
puts

player.update_stats!
puts "玩家总星数: #{player.total_stars}"
puts "玩家总分数: #{player.total_score}"
puts

puts '✅ 所有测试通过！'
