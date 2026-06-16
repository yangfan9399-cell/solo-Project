class GameScoreCalculator
  BASE_SCORE_PER_CONTAINER = 100
  WEIGHT_BONUS_MULTIPLIER = 2
  PRIORITY_BONUS_MULTIPLIER = 50
  DESTINATION_MATCH_BONUS = 200
  EFFICIENCY_BONUS_BASE = 500
  PERFECT_PLACEMENT_BONUS = 300

  def self.calculate(game_session)
    new(game_session).calculate
  end

  def initialize(game_session)
    @game_session = game_session
    @level = game_session.level
    @placements = game_session.container_placements.includes(:container, :berth)
  end

  def calculate
    return 0 if @placements.empty?

    total_score = 0

    @placements.each do |placement|
      total_score += calculate_placement_score(placement)
    end

    total_score += calculate_efficiency_bonus
    total_score += calculate_time_bonus
    total_score += calculate_perfect_completion_bonus
    total_score = apply_difficulty_multiplier(total_score)

    [total_score.to_i, 0].max
  end

  def calculate_detailed
    details = {
      base_score: 0,
      weight_bonus: 0,
      priority_bonus: 0,
      destination_bonus: 0,
      berth_utilization_bonus: 0,
      efficiency_bonus: 0,
      time_bonus: 0,
      perfect_bonus: 0,
      multiplier: @level.difficulty_multiplier,
      final_score: 0
    }

    return details if @placements.empty?

    berth_weights = Hash.new(0)
    berth_max_weights = Hash.new(0)

    @placements.each do |placement|
      container = placement.container
      berth = placement.berth

      details[:base_score] += BASE_SCORE_PER_CONTAINER
      details[:weight_bonus] += container.weight * WEIGHT_BONUS_MULTIPLIER
      details[:priority_bonus] += container.priority * PRIORITY_BONUS_MULTIPLIER

      if berth.accepts_destination?(container.destination)
        details[:destination_bonus] += DESTINATION_MATCH_BONUS
      end

      berth_weights[berth.id] += container.weight
      berth_max_weights[berth.id] = berth.max_weight
    end

    berth_weights.each do |berth_id, current_weight|
      max_weight = berth_max_weights[berth_id]
      utilization = current_weight.to_f / max_weight
      details[:berth_utilization_bonus] += (utilization * EFFICIENCY_BONUS_BASE).to_i
    end

    details[:efficiency_bonus] = calculate_efficiency_bonus
    details[:time_bonus] = calculate_time_bonus
    details[:perfect_bonus] = calculate_perfect_completion_bonus

    subtotal = details.values_at(
      :base_score, :weight_bonus, :priority_bonus, :destination_bonus,
      :berth_utilization_bonus, :efficiency_bonus, :time_bonus, :perfect_bonus
    ).sum

    details[:final_score] = (subtotal * details[:multiplier]).to_i

    details
  end

  private

  def calculate_placement_score(placement)
    container = placement.container
    berth = placement.berth

    score = BASE_SCORE_PER_CONTAINER
    score += container.weight * WEIGHT_BONUS_MULTIPLIER
    score += container.priority * PRIORITY_BONUS_MULTIPLIER
    score += DESTINATION_MATCH_BONUS if berth.accepts_destination?(container.destination)

    score
  end

  def calculate_efficiency_bonus
    berth_groups = @placements.group_by(&:berth_id)
    bonus = 0

    berth_groups.each do |berth_id, placements|
      berth = placements.first.berth
      total_weight = placements.sum { |p| p.container.weight }
      utilization = total_weight.to_f / berth.max_weight

      if utilization >= 0.9
        bonus += EFFICIENCY_BONUS_BASE * 2
      elsif utilization >= 0.7
        bonus += EFFICIENCY_BONUS_BASE
      elsif utilization >= 0.5
        bonus += (EFFICIENCY_BONUS_BASE * 0.5).to_i
      end
    end

    bonus
  end

  def calculate_time_bonus
    return 0 unless @game_session.time_remaining && @game_session.status == 'won'

    time_ratio = @game_session.time_remaining.to_f / @level.time_limit
    (time_ratio * 1000).to_i
  end

  def calculate_perfect_completion_bonus
    return 0 unless @game_session.available_containers.empty?

    all_correct_destinations = @placements.all? do |placement|
      placement.berth.accepts_destination?(placement.container.destination)
    end

    all_correct_destinations ? PERFECT_PLACEMENT_BONUS * @placements.count : 0
  end

  def apply_difficulty_multiplier(score)
    (score * @level.difficulty_multiplier).to_i
  end
end
