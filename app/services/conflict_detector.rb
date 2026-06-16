class ConflictDetector
  def self.check_placement(game_session, container, berth)
    new(game_session).check_placement(container, berth)
  end

  def self.check_removal(game_session, container)
    new(game_session).check_removal(container)
  end

  def initialize(game_session)
    @game_session = game_session
    @level = game_session.level
  end

  def check_placement(container, berth)
    conflicts = []

    unless @game_session.status == 'playing'
      conflicts << {
        type: :game_status,
        severity: :error,
        message: "游戏已结束，无法进行操作"
      }
      return conflicts
    end

    if @game_session.placed_container_ids.include?(container.id)
      conflicts << {
        type: :already_placed,
        severity: :error,
        message: "货柜 #{container.label} 已经被放置"
      }
    end

    unless berth.accepts_destination?(container.destination)
      conflicts << {
        type: :destination_mismatch,
        severity: :warning,
        message: "泊位 #{berth.name} 不接受目的地为 #{container.destination} 的货柜，将损失目的地匹配奖励",
        details: {
          allowed: berth.allowed_destination_list,
          actual: container.destination
        }
      }
    end

    current_weight = berth.current_weight(@game_session)
    new_total = current_weight + container.weight
    if new_total > berth.max_weight
      conflicts << {
        type: :weight_exceeded,
        severity: :error,
        message: "泊位 #{berth.name} 超重！当前 #{current_weight} + 货柜 #{container.weight} = #{new_total}，上限 #{berth.max_weight}",
        details: {
          current: current_weight,
          adding: container.weight,
          total: new_total,
          max: berth.max_weight,
          overflow: new_total - berth.max_weight
        }
      }
    end

    if container.weight > @level.max_weight_per_berth
      conflicts << {
        type: :container_too_heavy,
        severity: :warning,
        message: "货柜 #{container.label} 重量 #{container.weight} 超过关卡单泊位推荐上限 #{@level.max_weight_per_berth}",
        details: {
          container_weight: container.weight,
          level_max: @level.max_weight_per_berth
        }
      }
    end

    conflicts
  end

  def check_removal(container)
    conflicts = []

    unless @game_session.status == 'playing'
      conflicts << {
        type: :game_status,
        severity: :error,
        message: "游戏已结束，无法进行操作"
      }
      return conflicts
    end

    placement = @game_session.container_placements.find_by(container: container)
    unless placement
      conflicts << {
        type: :not_placed,
        severity: :error,
        message: "货柜 #{container.label} 尚未被放置"
      }
    end

    conflicts
  end
end
