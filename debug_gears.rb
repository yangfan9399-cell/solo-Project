gears_state = [
  { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: true },
  { id: 'mid1', type: 'gear', x: 270, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'mid2', type: 'gear', x: 390, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'mid3', type: 'gear', x: 510, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
  { id: 'target', type: 'target', x: 630, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false }
]

engine = GearPhysicsEngine.new(gears_state, 1.0)

gear_ids = gears_state.map { |g| g[:id] }
gear_ids.each do |id1|
  gear_ids.each do |id2|
    next if id1 == id2
    g1 = engine.instance_variable_get(:@gears)[id1]
    g2 = engine.instance_variable_get(:@gears)[id2]
    dist = Math.sqrt((g1[:x] - g2[:x])**2 + (g1[:y] - g2[:y])**2)
    min_dist = g1[:size] + g2[:size]
    max_dist = min_dist * 1.15
    connected = engine.send(:gears_connected?, g1, g2)
    puts "#{id1} <-> #{id2}: 距离=#{dist.round(1)}, 最小=#{min_dist}, 最大=#{max_dist.round(1)}, 连接=#{connected}"
  end
end

puts '---'
rpms = engine.calculate_all_rpms
puts 'RPM结果:'
rpms.each { |id, rpm| puts "  #{id}: #{rpm}" }
puts "target_connected: #{engine.target_connected?}"
