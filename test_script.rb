level = Level.first
player = Player.first

session = player.game_sessions.create!(level: level)
session.start!

gears_state = [
  { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: true },
  { id: 'mid1', type: 'gear', x: 270, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'mid2', type: 'gear', x: 390, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'mid3', type: 'gear', x: 510, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'target', type: 'target', x: 650, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false }
]

engine = GearPhysicsEngine.new(gears_state, level.water_force)
rpms = engine.calculate_all_rpms
puts "齿轮转速："
rpms.each { |id, rpm| puts "  #{id}: #{rpm} RPM" }
puts "目标是否连接: #{engine.target_connected?}"
puts "目标 RPM: #{engine.target_rpm}"

session.gears_state = gears_state
session.moves_count = 4
session.time_spent = 60
session.save!

calculator = ScoreCalculator.new(level, session)
result = calculator.calculate
puts "\n后端分数重新计算结果："
puts "  实际 RPM: #{result[:actual_rpm]}"
puts "  目标 RPM: #{result[:target_rpm]}"
puts "  转速差: #{result[:rpm_difference]}"
puts "  目标连接: #{result[:target_connected]}"
puts "  是否通过: #{result[:passed]}"
puts "  获得星数: #{result[:stars]}"
puts "  最终分数: #{result[:score]}"
puts "  分数明细: #{result[:breakdown]}"
