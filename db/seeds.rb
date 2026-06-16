puts "🌱 正在初始化星港货柜调度竞速游戏数据..."

ActiveRecord::Base.transaction do
  puts "  🎮 创建关卡..."

  level1 = Level.find_or_create_by!(name: '新手泊位') do |l|
    l.description = '学习基础操作，掌握拖拽调度的基本要领'
    l.difficulty = 'easy'
    l.time_limit = 180
    l.target_score = 1500
    l.container_count = 5
    l.berth_count = 3
    l.max_weight_per_berth = 80
  end

  level2 = Level.find_or_create_by!(name: '货运中转站') do |l|
    l.description = '管理更多货柜，优化重量分配'
    l.difficulty = 'medium'
    l.time_limit = 150
    l.target_score = 3500
    l.container_count = 7
    l.berth_count = 4
    l.max_weight_per_berth = 100
  end

  level3 = Level.find_or_create_by!(name: '星际货运港') do |l|
    l.description = '高难度调度，需要精准的目的地匹配'
    l.difficulty = 'hard'
    l.time_limit = 120
    l.target_score = 6000
    l.container_count = 9
    l.berth_count = 4
    l.max_weight_per_berth = 120
  end

  level4 = Level.find_or_create_by!(name: '银河枢纽') do |l|
    l.description = '终极挑战！在最短时间内完成最复杂的调度'
    l.difficulty = 'expert'
    l.time_limit = 90
    l.target_score = 10000
    l.container_count = 12
    l.berth_count = 5
    l.max_weight_per_berth = 150
  end

  puts "  📦 创建货柜配置..."

  def create_containers_for_level(level, count, destinations)
    existing = level.containers.count
    return if existing >= count

    colors = %w[cyan purple pink yellow green orange blue red]
    (existing...count).each do |i|
      weight = rand(10..40)
      priority = rand(1..5)
      destination = destinations[i % destinations.size]
      color = colors[i % colors.size]

      level.containers.create!(
        weight: weight,
        destination: destination,
        priority: priority,
        color: color,
        label: "C-#{(i + 1).to_s.rjust(3, '0')}"
      )
    end
    puts "    ✓ #{level.name}: 创建了 #{count - existing} 个货柜"
  end

  def create_berths_for_level(level, count, destinations_config)
    existing = level.berths.count
    return if existing >= count

    berth_names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
    (existing...count).each do |i|
      allowed_destinations = destinations_config[i % destinations_config.size]
      max_weight = level.max_weight_per_berth + rand(-20..20)

      level.berths.create!(
        name: "泊位 #{berth_names[i]}",
        max_weight: max_weight,
        allowed_destinations: allowed_destinations,
        position: i
      )
    end
    puts "    ✓ #{level.name}: 创建了 #{count - existing} 个泊位"
  end

  create_containers_for_level(level1, 5, ['地球', '火星', '地球', '月球', '火星'])
  create_berths_for_level(level1, 3, ['地球', '火星,月球', '*'])

  create_containers_for_level(level2, 7, ['地球', '火星', '木卫二', '地球', '月球', '火星', '木卫二'])
  create_berths_for_level(level2, 4, ['地球', '火星', '木卫二,月球', '*'])

  create_containers_for_level(level3, 9, ['地球', '火星', '木卫二', '土卫六', '地球', '月球', '火星', '木卫二', '土卫六'])
  create_berths_for_level(level3, 4, ['地球,月球', '火星', '木卫二', '土卫六'])

  create_containers_for_level(level4, 12, ['地球', '火星', '木卫二', '土卫六', '海卫一', '地球', '月球', '火星', '木卫二', '土卫六', '海卫一', '冥王星'])
  create_berths_for_level(level4, 5, ['地球,月球', '火星', '木卫二,土卫六', '海卫一', '冥王星,*'])

  puts "  👤 创建默认玩家..."
  Player.find_or_create_by!(name: 'LocalPlayer') do |p|
    p.current_score = 0
    p.total_games = 0
    p.wins = 0
  end

  puts "  👤 创建测试玩家..."
  %w[指挥官Nova 领航员Aria 工程师Kai 飞行员Zoe].each do |name|
    Player.find_or_create_by!(name: name) do |p|
      p.current_score = rand(5000..15000)
      p.total_games = rand(20..50)
      p.wins = rand(10..30)
    end
  end

  puts "\n✅ 种子数据初始化完成！"
  puts "   - #{Level.count} 个关卡"
  puts "   - #{Container.count} 个货柜配置"
  puts "   - #{Berth.count} 个泊位配置"
  puts "   - #{Player.count} 个玩家档案"
  puts "\n🚀 星港货柜调度竞速游戏已准备就绪！"
end
