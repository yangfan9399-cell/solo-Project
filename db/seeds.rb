puts "🌊 正在初始化河谷水磨坊游戏数据..."

levels_data = [
  {
    level_number: 1,
    name: '初遇水磨',
    description: '欢迎来到河谷水磨坊！将水轮连接到目标齿轮，让它转动起来。',
    difficulty: 'easy',
    water_force: 1.0,
    target_rpm: 60.0,
    time_limit: 300,
    three_star_moves: 2,
    two_star_moves: 4,
    gears_config: [
      { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 40, size: 60, connected_to: [] },
      { id: 'target', type: 'target', x: 650, y: 350, teeth: 40, size: 60, connected_to: [] },
      { id: 'avail1', type: 'available', teeth: 40, size: 60 },
      { id: 'avail2', type: 'available', teeth: 40, size: 60 },
      { id: 'avail3', type: 'available', teeth: 30, size: 45 }
    ]
  },
  {
    level_number: 2,
    name: '减速传动',
    description: '目标齿轮需要更慢的转速。用不同大小的齿轮调整传动比！',
    difficulty: 'easy',
    water_force: 1.0,
    target_rpm: 30.0,
    time_limit: 300,
    three_star_moves: 2,
    two_star_moves: 5,
    gears_config: [
      { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 20, size: 40, connected_to: [] },
      { id: 'target', type: 'target', x: 650, y: 350, teeth: 40, size: 60, connected_to: [] },
      { id: 'avail1', type: 'available', teeth: 40, size: 60 },
      { id: 'avail2', type: 'available', teeth: 20, size: 40 },
      { id: 'avail3', type: 'available', teeth: 30, size: 45 },
      { id: 'avail4', type: 'available', teeth: 60, size: 80 }
    ]
  },
  {
    level_number: 3,
    name: '加速磨坊',
    description: '水流变缓了，但目标齿轮需要更快的转速。设计一个加速传动链！',
    difficulty: 'medium',
    water_force: 0.8,
    target_rpm: 96.0,
    time_limit: 300,
    three_star_moves: 3,
    two_star_moves: 6,
    gears_config: [
      { id: 'waterwheel', type: 'waterwheel', x: 120, y: 350, teeth: 60, size: 80, connected_to: [] },
      { id: 'target', type: 'target', x: 680, y: 350, teeth: 30, size: 45, connected_to: [] },
      { id: 'avail1', type: 'available', teeth: 30, size: 45 },
      { id: 'avail2', type: 'available', teeth: 30, size: 45 },
      { id: 'avail3', type: 'available', teeth: 60, size: 80 },
      { id: 'avail4', type: 'available', teeth: 40, size: 60 },
      { id: 'avail5', type: 'available', teeth: 20, size: 35 }
    ]
  },
  {
    level_number: 4,
    name: '迂回水道',
    description: '空间有限，目标齿轮在角落。构建一条弯曲的传动路径！',
    difficulty: 'hard',
    water_force: 1.2,
    target_rpm: 45.0,
    time_limit: 300,
    three_star_moves: 3,
    two_star_moves: 7,
    gears_config: [
      { id: 'waterwheel', type: 'waterwheel', x: 100, y: 400, teeth: 40, size: 60, connected_to: [] },
      { id: 'target', type: 'target', x: 700, y: 150, teeth: 40, size: 60, connected_to: [] },
      { id: 'avail1', type: 'available', teeth: 40, size: 60 },
      { id: 'avail2', type: 'available', teeth: 40, size: 60 },
      { id: 'avail3', type: 'available', teeth: 40, size: 60 },
      { id: 'avail4', type: 'available', teeth: 60, size: 80 },
      { id: 'avail5', type: 'available', teeth: 30, size: 45 },
      { id: 'avail6', type: 'available', teeth: 20, size: 35 }
    ]
  },
  {
    level_number: 5,
    name: '大师之轮',
    description: '终极挑战！精确的转速要求，复杂的布局。只有真正的水磨大师才能完成！',
    difficulty: 'expert',
    water_force: 1.0,
    target_rpm: 50.0,
    time_limit: 300,
    three_star_moves: 4,
    two_star_moves: 8,
    gears_config: [
      { id: 'waterwheel', type: 'waterwheel', x: 100, y: 250, teeth: 50, size: 70, connected_to: [] },
      { id: 'target', type: 'target', x: 700, y: 250, teeth: 30, size: 45, connected_to: [] },
      { id: 'avail1', type: 'available', teeth: 30, size: 45 },
      { id: 'avail2', type: 'available', teeth: 50, size: 70 },
      { id: 'avail3', type: 'available', teeth: 60, size: 80 },
      { id: 'avail4', type: 'available', teeth: 20, size: 35 },
      { id: 'avail5', type: 'available', teeth: 40, size: 60 },
      { id: 'avail6', type: 'available', teeth: 40, size: 60 },
      { id: 'avail7', type: 'available', teeth: 25, size: 40 }
    ]
  }
]

puts "📋 创建 #{levels_data.count} 个关卡..."

levels_data.each do |data|
  level = Level.find_or_initialize_by(level_number: data[:level_number])
  level.assign_attributes(
    name: data[:name],
    description: data[:description],
    difficulty: data[:difficulty],
    water_force: data[:water_force],
    target_rpm: data[:target_rpm],
    time_limit: data[:time_limit],
    three_star_moves: data[:three_star_moves],
    two_star_moves: data[:two_star_moves],
    gears_config: data[:gears_config]
  )
  level.save!
  puts "  ✅ 第#{data[:level_number]}关：#{data[:name]} [#{data[:difficulty]}]"
end

puts "👤 创建示例玩家档案..."
demo_player = Player.find_or_create_by!(name: '水磨学徒') do |p|
  p.password_digest = nil
end
puts "  ✅ 玩家：#{demo_player.name}"

puts "🎮 创建示例游戏局次记录..."

def build_level1_solution(level)
  [
    { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: true },
    { id: 'gear1', type: 'gear', x: 270, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
    { id: 'gear2', type: 'gear', x: 390, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
    { id: 'gear3', type: 'gear', x: 510, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
    { id: 'target', type: 'target', x: 650, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false }
  ]
end

def build_level2_solution(level)
  [
    { id: 'waterwheel', type: 'waterwheel', x: 150, y: 350, teeth: 20, size: 40, rotation: 0, connected_to: [], active: true },
    { id: 'gear1', type: 'gear', x: 250, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false },
    { id: 'target', type: 'target', x: 650, y: 350, teeth: 40, size: 60, rotation: 0, connected_to: [], active: false }
  ]
end

demo_sessions = [
  {
    level_number: 1,
    status: 'completed',
    moves: 4,
    time_spent: 45,
    stars: 3,
    score: 1780,
    solution_builder: :build_level1_solution
  },
  {
    level_number: 2,
    status: 'completed',
    moves: 3,
    time_spent: 78,
    stars: 2,
    score: 1450,
    solution_builder: :build_level2_solution
  },
  {
    level_number: 1,
    status: 'completed',
    moves: 6,
    time_spent: 120,
    stars: 1,
    score: 1120,
    solution_builder: :build_level1_solution
  },
  {
    level_number: 3,
    status: 'failed',
    moves: 5,
    time_spent: 150,
    stars: 0,
    score: 0,
    solution_builder: :build_level1_solution
  }
]

demo_sessions.each_with_index do |session_data, idx|
  level = Level.find_by(level_number: session_data[:level_number])
  next unless level

  session = demo_player.game_sessions.create!(
    level: level,
    status: session_data[:status],
    moves_count: session_data[:moves],
    time_spent: session_data[:time_spent],
    stars: session_data[:stars],
    score: session_data[:score],
    current_rpm: session_data[:status] == 'completed' ? level.target_rpm : 0.0,
    completed_at: session_data[:status] == 'completed' ? (idx + 1).days.ago : nil
  )

  if session_data[:status] == 'completed'
    gears_state = send(session_data[:solution_builder], level)
    session.update!(gears_state: gears_state)

    session_data[:moves].times do |i|
      session.operation_histories.create!(
        operation_type: i == 0 ? 'add' : 'move',
        gear_id: "gear#{i + 1}",
        move_number: i + 1,
        undone: false
      )
    end
  end

  puts "  ✅ 第#{level.level_number}关 #{session.status} - #{session.stars}星 - #{session.score}分"
end

demo_player.update_stats!

puts ""
puts "🎉 河谷水磨坊游戏数据初始化完成！"
puts "📊 总计：#{Level.count} 个关卡，#{Player.count} 个玩家，#{GameSession.count} 局游戏记录"
puts "💡 提示：在首页选择或创建玩家，然后开始挑战齿轮传动谜题吧！"
