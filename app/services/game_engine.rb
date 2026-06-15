class GameEngine
  GRID_SIZE = GameSession::GRID_SIZE
  CELL_EMPTY = GameSession::CELL_EMPTY
  CELL_TARGET = GameSession::CELL_TARGET
  CELL_CONTAMINANT = GameSession::CELL_CONTAMINANT
  CELL_ANTIBIOTIC = GameSession::CELL_ANTIBIOTIC

  def initialize(game_session)
    @session = game_session
    @grid = @session.grid_as_array
    @target_zone = Set.new(@session.target_zone_as_array.map { |p| [p[0], p[1]] })
    @strain_info = @session.target_strain_info
    @antibiotic_positions = []
    @moisture_level = 50.0
    load_context
  end

  def load_context
    last_moisture = @session.operation_details.where(operation_type: [:adjust_moisture, :simulate_growth]).order(round_number: :desc).first
    @moisture_level = last_moisture&.moisture_level || 50.0
    antibiotic_ops = @session.operation_details.where(operation_type: :place_antibiotic)
    @antibiotic_positions = antibiotic_ops.map do |op|
      {
        x: op.antibiotic_position_x,
        y: op.antibiotic_position_y,
        radius: op.antibiotic_radius.to_f,
        type: op.antibiotic_type,
        round: op.round_number
      }
    end
  end

  def calculate_temperature_factor
    temp = @session.temperature.to_f
    optimal = @strain_info[:optimal_temp]
    range = @strain_info[:temp_range]
    return 0.0 if temp < range[0] || temp > range[1]
    if temp > optimal + 3
      return [0.0, 1.0 - ((temp - optimal - 3) * 0.35)].max
    end
    diff = (temp - optimal).abs
    factor = 1.0 - (diff * 0.08)
    [factor, 0.1].max
  end

  def calculate_moisture_factor
    if @moisture_level < 15
      0.2
    elsif @moisture_level < 30
      0.6
    elsif @moisture_level <= 70
      1.0
    elsif @moisture_level <= 85
      0.85
    else
      0.5
    end
  end

  def calculate_ph_factor
    ph = @session.ph_level.to_f
    range = @strain_info[:ph_range]
    return 0.2 if ph < range[0] - 1 || ph > range[1] + 1
    optimal = (range[0] + range[1]) / 2.0
    diff = (ph - optimal).abs
    [1.0 - (diff * 0.25), 0.3].max
  end

  def calculate_antibiotic_factor_at(x, y)
    factor = 1.0
    @antibiotic_positions.each do |ab|
      dist = Math.sqrt((x - ab[:x])**2 + (y - ab[:y])**2)
      if dist <= ab[:radius]
        decay_factor = ab[:type] == "strong" ? 0.05 : (ab[:type] == "medium" ? 0.2 : 0.4)
        decay = [decay_factor, 1.0 - (1.0 - decay_factor) * (1 - dist / ab[:radius])].min
        factor = [factor, decay].min
      end
    end
    factor
  end

  def nutrient_available_at_cell(x, y)
    total_cells = 0
    nutrient_per_cell = @session.current_nutrient_level.to_f / 5.0
    (0...GRID_SIZE).each do |i|
      (0...GRID_SIZE).each do |j|
        total_cells += 1 if @grid[i] && (@grid[i][j] == CELL_TARGET || @grid[i][j] == CELL_CONTAMINANT)
      end
    end
    total_cells = [total_cells, 1].max
    base = nutrient_per_cell / total_cells * 10
    dist_from_center = Math.sqrt((x - GRID_SIZE / 2.0)**2 + (y - GRID_SIZE / 2.0)**2)
    center_bonus = [0.5, 1.0 - dist_from_center / GRID_SIZE].max
    (base * (0.8 + 0.4 * center_bonus)).round(4)
  end

  def get_neighbors(x, y)
    neighbors = []
    [-1, 0, 1].each do |dx|
      [-1, 0, 1].each do |dy|
        next if dx == 0 && dy == 0
        nx, ny = x + dx, y + dy
        neighbors << [nx, ny] if nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE
      end
    end
    neighbors
  end

  def simulate_growth!(round_number)
    new_grid = @grid.map(&:dup)
    new_growth_cells = []
    stagnated_cells = []
    overheated = false
    growth_stopped = false

    temp_factor = calculate_temperature_factor
    moisture_factor = calculate_moisture_factor
    ph_factor = calculate_ph_factor
    effective_nutrient = [@session.current_nutrient_level.to_f, 0].max

    if temp_factor <= 0.01
      overheated = true
      growth_stopped = true
    end

    base_rate = @strain_info[:growth_rate]
    nutrient_factor = [1.0, effective_nutrient / 30.0].min
    overall_base_factor = temp_factor * moisture_factor * ph_factor * nutrient_factor

    target_cells_to_check = []
    (0...GRID_SIZE).each do |x|
      (0...GRID_SIZE).each do |y|
        target_cells_to_check << [x, y] if @grid[x] && @grid[x][y] == CELL_TARGET
      end
    end

    target_cells_to_check.each do |(x, y)|
      neighbors = get_neighbors(x, y)
      neighbors.each do |(nx, ny)|
        next unless new_grid[nx] && new_grid[nx][ny] == CELL_EMPTY
        cell_ab_factor = calculate_antibiotic_factor_at(nx, ny)
        cell_nutrient = nutrient_available_at_cell(nx, ny)
        cell_nutrient_factor = [1.0, cell_nutrient / 2.0].min
        growth_prob = base_rate * overall_base_factor * cell_ab_factor * cell_nutrient_factor
        growth_prob = [growth_prob, 0.95].min
        if growth_stopped
          stagnated_cells << [nx, ny] unless stagnated_cells.include?([nx, ny])
        elsif rand < growth_prob
          new_grid[nx][ny] = CELL_TARGET
          new_growth_cells << [nx, ny]
        end
      end
    end

    target_zone_reached = []
    @target_zone.each do |(zx, zy)|
      target_zone_reached << [zx, zy] if new_grid[zx] && new_grid[zx][zy] == CELL_TARGET
    end

    target_cells = 0
    (0...GRID_SIZE).each do |x|
      (0...GRID_SIZE).each do |y|
        target_cells += 1 if new_grid[x] && new_grid[x][y] == CELL_TARGET
      end
    end
    coverage = (target_cells.to_f / (GRID_SIZE * GRID_SIZE) * 100).round(2)
    zone_coverage = @target_zone.size > 0 ? ((target_zone_reached.size.to_f / @target_zone.size) * 100).round(2) : 0.0

    nutrient_consumed = (target_cells * 0.15).round(2)
    new_nutrient_level = [@session.current_nutrient_level.to_f - nutrient_consumed, 0.0].max

    event_type = if growth_stopped
                   "overheat"
                 elsif zone_coverage >= 80
                   "target_reached"
                 elsif new_growth_cells.empty?
                   "stagnation"
                 elsif zone_coverage > 0
                   "expansion"
                 else
                   "growth"
                 end

    description_parts = []
    description_parts << "温度异常，生长停止" if overheated
    description_parts << "新增 #{new_growth_cells.size} 个菌落细胞" unless new_growth_cells.empty?
    description_parts << "目标区域覆盖率: #{zone_coverage}%"
    description_parts << "生长停滞" if new_growth_cells.empty? && !overheated
    description = description_parts.join("；")

    growth_history = GrowthHistory.create!(
      game_session: @session,
      round_number: round_number,
      event_type: event_type,
      target_coverage: coverage,
      target_zone_coverage: zone_coverage,
      target_colony_cells: target_cells,
      growth_rate: (base_rate * overall_base_factor).round(4),
      effective_nutrient: effective_nutrient,
      temperature_factor: temp_factor.round(4),
      moisture_factor: moisture_factor.round(4),
      antibiotic_factor: 1.0,
      target_zone_reached_cells: target_zone_reached.to_json,
      new_growth_cells: new_growth_cells.to_json,
      stagnated_cells: stagnated_cells.to_json,
      event_description: description,
      is_overheated: overheated,
      is_growth_stopped: growth_stopped
    )

    @grid = new_grid
    @session.colony_grid = @grid.to_json
    @session.actual_coverage = coverage
    @session.current_nutrient_level = new_nutrient_level
    @session.current_round = round_number
    @session.status = :in_progress if @session.initialized?
    @session.save!

    {
      grid: @grid,
      coverage: coverage,
      zone_coverage: zone_coverage,
      overheated: overheated,
      growth_stopped: growth_stopped,
      new_cells: new_growth_cells,
      history: growth_history,
      nutrient_consumed: nutrient_consumed
    }
  end

  def simulate_contamination!(round_number, contaminant_id = nil)
    contaminant_id ||= GameSession::CONTAMINANTS.keys.sample
    contaminant_info = GameSession::CONTAMINANTS[contaminant_id] || GameSession::CONTAMINANTS[101]

    before_state = {
      nutrient: @session.current_nutrient_level.to_f,
      target_coverage: @session.actual_coverage.to_f,
      contaminant_coverage: 0.0,
      grid_snapshot: @grid.map(&:dup)
    }

    edge_positions = []
    4.times do
      edge = rand(4)
      case edge
      when 0 then edge_positions << [rand(GRID_SIZE), 0]
      when 1 then edge_positions << [rand(GRID_SIZE), GRID_SIZE - 1]
      when 2 then edge_positions << [0, rand(GRID_SIZE)]
      when 3 then edge_positions << [GRID_SIZE - 1, rand(GRID_SIZE)]
      end
    end

    new_grid = @grid.map(&:dup)
    contaminant_cells = []
    edge_positions.each do |(sx, sy)|
      next unless new_grid[sx] && new_grid[sx][sy] == CELL_EMPTY
      new_grid[sx][sy] = CELL_CONTAMINANT
      contaminant_cells << [sx, sy]
    end

    contaminant_count = contaminant_cells.size
    if contaminant_count > 0
      competitiveness = contaminant_info[:competitiveness]
      temp_match = 1.0 - ((@session.temperature.to_f - contaminant_info[:optimal_temp]).abs * 0.05)
      spread_factor = [competitiveness * [temp_match, 0.5].max, 0.9].max

      additional_spread = []
      contaminant_cells.each do |(cx, cy)|
        get_neighbors(cx, cy).each do |(nx, ny)|
          next unless new_grid[nx] && new_grid[nx][ny] == CELL_EMPTY
          ab_factor = calculate_antibiotic_factor_at(nx, ny)
          if rand < (spread_factor * 0.3 * ab_factor)
            new_grid[nx][ny] = CELL_CONTAMINANT
            additional_spread << [nx, ny]
          end
        end
      end
      contaminant_cells += additional_spread

      competition_zones = []
      contaminant_cells.each do |(cx, cy)|
        get_neighbors(cx, cy).each do |(nx, ny)|
          if new_grid[nx] && new_grid[nx][ny] == CELL_TARGET
            competition_zones << [nx, ny] unless competition_zones.include?([nx, ny])
          end
        end
      end

      contested_lost = 0
      competition_zones.each do |(tx, ty)|
        if rand < (competitiveness * 0.15)
          new_grid[tx][ty] = CELL_CONTAMINANT
          contaminant_cells << [tx, ty]
          contested_lost += 1
        end
      end

      nutrient_consumed = (contaminant_cells.size * 0.3).round(2)
      target_loss = (contested_lost * 0.5 + competition_zones.size * 0.1).round(2)
      target_growth_impact = (competition_zones.size * 2.5).round(2)
      comp_index = [(contaminant_cells.size.to_f / 100.0 * competitiveness), 1.0].min.round(4)

      total_contaminant = contaminant_cells.size
      contaminant_coverage = (total_contaminant.to_f / (GRID_SIZE * GRID_SIZE) * 100).round(2)
      severity = if contaminant_coverage >= 15 || contested_lost >= 10
                   "critical"
                 elsif contaminant_coverage >= 8 || contested_lost >= 5
                   "high"
                 elsif contaminant_coverage >= 3
                   "medium"
                 else
                   "low"
                 end

      after_nutrient = [@session.current_nutrient_level.to_f - nutrient_consumed - target_loss, 0.0].max
      target_cells_after = 0
      (0...GRID_SIZE).each do |x|
        (0...GRID_SIZE).each do |y|
          target_cells_after += 1 if new_grid[x] && new_grid[x][y] == CELL_TARGET
        end
      end
      coverage_after = (target_cells_after.to_f / (GRID_SIZE * GRID_SIZE) * 100).round(2)

      after_state = {
        nutrient: after_nutrient,
        target_coverage: coverage_after,
        contaminant_coverage: contaminant_coverage,
        grid_snapshot: new_grid.map(&:dup)
      }

      description = "#{contaminant_info[:name]}入侵: 新增#{contaminant_cells.size}个污染细胞，争夺营养#{nutrient_consumed}，目标区域受影响#{target_growth_impact}%"

      contamination = ContaminationResult.create!(
        game_session: @session,
        round_number: round_number,
        contaminant_strain_id: contaminant_id,
        contaminant_name: contaminant_info[:name],
        is_detected: true,
        is_controlled: severity == "low",
        nutrient_consumed: nutrient_consumed,
        contaminant_coverage: contaminant_coverage,
        contaminant_cell_count: contaminant_cells.size,
        target_nutrient_loss: target_loss,
        target_growth_impact: target_growth_impact,
        competition_index: comp_index,
        contaminant_cells: contaminant_cells.to_json,
        competition_zones: competition_zones.to_json,
        before_state: before_state.to_json,
        after_state: after_state.to_json,
        event_description: description,
        severity: severity
      )

      @grid = new_grid
      @session.colony_grid = @grid.to_json
      @session.actual_coverage = coverage_after
      @session.current_nutrient_level = after_nutrient
      @session.save!

      {
        detected: true,
        contaminant: contamination,
        contaminant_cells: contaminant_cells,
        competition_zones: competition_zones
      }
    else
      { detected: false }
    end
  end

  def finalize_settlement!
    operations = @session.operation_details.order(:round_number)
    growth_histories = @session.growth_histories.order(:round_number)
    contaminations = @session.contamination_results.order(:round_number)

    total_target_cells = growth_histories.maximum(:target_colony_cells) || 0
    zone_coverage = growth_histories.maximum(:target_zone_coverage) || 0
    max_coverage = growth_histories.maximum(:target_coverage) || 0

    coverage_score = [max_coverage / @session.target_coverage.to_f * 40.0, 40.0].min.round(2)
    zone_score = (zone_coverage / 100.0 * 30.0).round(2)

    efficiency_penalty = 0
    operations.each do |op|
      case op.operation_type.to_sym
      when :add_nutrient then efficiency_penalty += (op.nutrient_adjustment.to_f / 20.0)
      when :place_antibiotic then efficiency_penalty += 3.0
      end
    end
    efficiency_score = [20.0 - efficiency_penalty, 0.0].max.round(2)

    contamination_penalty = contaminations.sum do |c|
      case c.severity
      when "critical" then 15
      when "high" then 8
      when "medium" then 3
      else 1
      end
    end
    cleanliness_score = [10.0 - contamination_penalty, 0.0].max.round(2)

    total_score = (coverage_score + zone_score + efficiency_score + cleanliness_score).round(2)

    outcome = if zone_coverage >= @session.target_coverage
                "success"
              elsif zone_coverage >= @session.target_coverage * 0.6
                "partial"
              else
                "failure"
              end

    details = {
      score_breakdown: {
        coverage: coverage_score,
        target_zone: zone_score,
        efficiency: efficiency_score,
        cleanliness: cleanliness_score
      },
      metrics: {
        max_coverage: max_coverage,
        final_zone_coverage: zone_coverage,
        total_target_cells: total_target_cells,
        total_rounds: @session.current_round,
        total_operations: operations.count
      },
      contamination_summary: {
        total_events: contaminations.count,
        max_severity: contaminations.maximum(:severity) || "none",
        total_nutrient_lost: contaminations.sum(:nutrient_consumed) + contaminations.sum(:target_nutrient_loss)
      },
      outcome: outcome,
      recalculated_from_operations: true,
      recalculation_timestamp: Time.current.iso8601
    }

    @session.final_score = total_score
    @session.settlement_details = details.to_json
    @session.status = :completed
    @session.save!

    @session
  end

  def rollback_to_round!(round)
    return false unless @session.can_rollback_to?(round)

    @session.growth_histories.where("round_number > ?", round).destroy_all
    @session.contamination_results.where("round_number > ?", round).destroy_all
    @session.operation_details.where("round_number > ?", round).destroy_all

    history = @session.growth_histories.where(round_number: round).order(:id).last
    if history
      @session.actual_coverage = history.target_coverage
      op = @session.operation_details.where(round_number: round).order(:id).last
      @session.current_nutrient_level = op ? [history.effective_nutrient, @session.current_nutrient_level].min : history.effective_nutrient
    end

    @session.current_round = round
    @session.status = :in_progress
    @session.save!

    reinitialize_grid_up_to_round(round)
    true
  end

  def reinitialize_grid_up_to_round(target_round)
    grid = Array.new(GRID_SIZE) { Array.new(GRID_SIZE, CELL_EMPTY) }
    center = GRID_SIZE / 2
    2.times do |i|
      2.times do |j|
        grid[center - 1 + i][center - 1 + j] = CELL_TARGET
      end
    end
    @session.growth_histories.where("round_number <= ?", target_round).order(:round_number).each do |h|
      h.new_cells_array.each do |(x, y)|
        grid[x][y] = CELL_TARGET if grid[x]
      end
    end
    @session.contamination_results.where("round_number <= ?", target_round).order(:round_number).each do |c|
      c.contaminant_cells_array.each do |(x, y)|
        grid[x][y] = CELL_CONTAMINANT if grid[x]
      end
    end
    @session.colony_grid = grid.to_json
    @session.save!
    grid
  end
end
